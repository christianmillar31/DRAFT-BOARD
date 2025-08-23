// Advanced Tier System based on Claude Opus research
// Implements VBD-based tiers with position-specific value curves

export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DST';

export interface PlayerForTiering {
  id: string;
  name: string;
  position: Position;
  vbd: number;
  adp: number;
  projectedPoints: number;
  rushAttempts?: number;
  targets?: number;
  tier?: number;
}

export interface TierConfig {
  eliteTierSize: number;
  valueDecay: 'exponential' | 'linear' | 'bimodal' | 'stepped';
  deadZone?: [number, number]; // [startRound, endRound]
}

export interface TierBreak {
  afterIndex: number;
  reason: string;
  vbdDrop: number;
  percentDrop: number;
}

export class TierSystem {
  private tierConfig: Record<Position, TierConfig> = {
    RB: { 
      eliteTierSize: 3, 
      valueDecay: 'exponential',
      deadZone: [4, 6] 
    },
    WR: { 
      eliteTierSize: 5, 
      valueDecay: 'linear' 
    },
    TE: { 
      eliteTierSize: 2, 
      valueDecay: 'bimodal' 
    },
    QB: { 
      eliteTierSize: 3, 
      valueDecay: 'stepped' 
    },
    K: { 
      eliteTierSize: 2, 
      valueDecay: 'linear' 
    },
    DST: { 
      eliteTierSize: 3, 
      valueDecay: 'linear' 
    }
  };

  constructor(private leagueSize = 12) {}

  /**
   * Claude Opus's hybrid threshold approach
   * Uses both percentage and absolute drops, adjusted by round
   */
  private shouldBreakTier(
    currentPlayer: PlayerForTiering, 
    nextPlayer: PlayerForTiering | undefined, 
    round: number,
    currentTierSize: number,
    position: Position
  ): boolean {
    if (!nextPlayer) return true;
    
    const config = this.tierConfig[position];
    
    // Don't break before minimum tier size
    if (currentTierSize < config.eliteTierSize && round <= 3) {
      return false;
    }

    const vbdDrop = currentPlayer.vbd - nextPlayer.vbd;
    const percentDrop = vbdDrop / Math.max(1, currentPlayer.vbd);

    // Hybrid threshold approach from Claude Opus
    if (round <= 3) {
      // Early rounds: stricter percentage (15%) OR absolute (20+ points)
      return percentDrop > 0.15 || vbdDrop > 20;
    } else if (round <= 8) {
      // Mid rounds: looser percentage (10%) OR absolute (10+ points)
      return percentDrop > 0.10 || vbdDrop > 10;
    } else {
      // Late rounds: very loose (7%) OR absolute (5+ points)
      return percentDrop > 0.07 || vbdDrop > 5;
    }
  }

  /**
   * Calculate which round a player falls into based on ADP
   */
  private getPlayerRound(player: PlayerForTiering): number {
    return Math.ceil(player.adp / this.leagueSize);
  }

  /**
   * Identify RB Dead Zone players (rounds 4-6)
   */
  private isInDeadZone(player: PlayerForTiering): boolean {
    if (player.position !== 'RB') return false;
    
    const round = this.getPlayerRound(player);
    const deadZone = this.tierConfig.RB.deadZone;
    
    return deadZone ? round >= deadZone[0] && round <= deadZone[1] : false;
  }

  /**
   * Calculate position-specific maximum tier size based on round and value decay
   */
  private getMaxTierSize(position: Position, round: number): number {
    const config = this.tierConfig[position];
    
    switch (config.valueDecay) {
      case 'exponential': // RBs - tight tiers
        if (round <= 3) return 4;
        if (round <= 6) return 6;
        return 8;
        
      case 'linear': // WRs - broader tiers
        if (round <= 3) return 6;
        if (round <= 8) return 8;
        return 12;
        
      case 'bimodal': // TEs - small elite, large streaming
        if (round <= 2) return 3;
        return 15; // Large streaming tier
        
      case 'stepped': // QBs - consistent groups
        if (round <= 5) return 5;
        return 8;
        
      default:
        return 6;
    }
  }

  /**
   * Main tier calculation method
   */
  public calculateTiers(players: PlayerForTiering[]): PlayerForTiering[] {
    if (players.length === 0) return [];

    const playersWithTiers = [...players];
    let currentTier = 1;
    let currentTierPlayers = 0;

    for (let i = 0; i < playersWithTiers.length; i++) {
      const currentPlayer = playersWithTiers[i];
      const nextPlayer = playersWithTiers[i + 1];
      const round = this.getPlayerRound(currentPlayer);
      
      // Assign current tier
      playersWithTiers[i] = {
        ...currentPlayer,
        tier: currentTier
      };
      
      currentTierPlayers++;

      // Check if we should break to next tier
      const maxTierSize = this.getMaxTierSize(currentPlayer.position, round);
      const shouldBreak = this.shouldBreakTier(
        currentPlayer, 
        nextPlayer, 
        round, 
        currentTierPlayers,
        currentPlayer.position
      );

      // Force break if tier gets too large
      const forceBreak = currentTierPlayers >= maxTierSize && nextPlayer;

      if ((shouldBreak || forceBreak) && nextPlayer) {
        currentTier++;
        currentTierPlayers = 0;
      }
    }

    return playersWithTiers;
  }

  /**
   * Get tier breaks for analysis/debugging
   */
  public getTierBreaks(players: PlayerForTiering[]): TierBreak[] {
    const breaks: TierBreak[] = [];
    let currentTierSize = 0;

    for (let i = 0; i < players.length - 1; i++) {
      const currentPlayer = players[i];
      const nextPlayer = players[i + 1];
      const round = this.getPlayerRound(currentPlayer);
      
      currentTierSize++;

      if (this.shouldBreakTier(currentPlayer, nextPlayer, round, currentTierSize, currentPlayer.position)) {
        const vbdDrop = currentPlayer.vbd - nextPlayer.vbd;
        const percentDrop = vbdDrop / Math.max(1, currentPlayer.vbd);

        breaks.push({
          afterIndex: i,
          reason: `${(percentDrop * 100).toFixed(1)}% drop (${vbdDrop.toFixed(1)} VBD)`,
          vbdDrop: vbdDrop,
          percentDrop: percentDrop
        });

        currentTierSize = 0;
      }
    }

    return breaks;
  }

  /**
   * Check if player is in RB Dead Zone
   */
  public checkDeadZone(player: PlayerForTiering): { inDeadZone: boolean; warning?: string } {
    if (!this.isInDeadZone(player)) {
      return { inDeadZone: false };
    }

    return {
      inDeadZone: true,
      warning: `⚠️ RB Dead Zone (Rounds ${this.tierConfig.RB.deadZone![0]}-${this.tierConfig.RB.deadZone![1]}) - High variance, limited upside`
    };
  }

  /**
   * Get tier color based on tier number and position
   */
  public getTierColor(tier: number, position: Position): string {
    // Position-adjusted tier coloring
    const adjustedTier = position === 'TE' && tier <= 1 ? 1 : tier;
    
    if (adjustedTier <= 1) return 'text-yellow-400';      // Gold - Elite
    if (adjustedTier <= 2) return 'text-green-400';       // Green - High  
    if (adjustedTier <= 4) return 'text-blue-400';        // Blue - Mid
    if (adjustedTier <= 6) return 'text-purple-400';      // Purple - Depth
    return 'text-gray-400';                               // Gray - Late
  }
}