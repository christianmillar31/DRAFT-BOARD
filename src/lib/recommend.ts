// Draft Recommendation Engine
// Extracted from DraftBoard component for reusability and testing

export type DraftStrategy = "value" | "balanced" | "need" | "upside";

export interface RecommendationInput {
  strategy: DraftStrategy;
  myTeam: { position: string }[];
  availablePlayers: { id: string; position: string; tier?: number }[];
  leagueSettings: {
    roster?: { QB: number; RB: number; WR: number; TE: number; FLEX?: number; K?: number; DST?: number; BENCH?: number };
    teams?: number;
  };
  currentPick: number;
}

export function getRecommendations({
  strategy,
  myTeam,
  availablePlayers,
  leagueSettings,
  currentPick
}: RecommendationInput): string[] {
  
  if (strategy === "balanced") {
    // Make balanced strategy league-aware instead of hardcoded thresholds
    const roster = leagueSettings.roster || { QB: 1, RB: 2, WR: 3, TE: 1 };
    const positionNeeds = {
      QB: myTeam.filter(p => p.position === 'QB').length < (roster.QB + 1),
      RB: myTeam.filter(p => p.position === 'RB').length < (roster.RB + 1), 
      WR: myTeam.filter(p => p.position === 'WR').length < (roster.WR + 1),
      TE: myTeam.filter(p => p.position === 'TE').length < (roster.TE + 1),
    };

    const recommendations = availablePlayers.slice(0, 5).filter(player => 
      positionNeeds[player.position as keyof typeof positionNeeds]
    );

    // Always return at least one recommendation (best available if no needs met)
    if (recommendations.length === 0) {
      return availablePlayers.slice(0, 1).map(p => p.id);
    }
    
    return recommendations.map(p => p.id);
  }
  
  if (strategy === "value") {
    // Best Player Available - pure ADP ranking regardless of position
    return availablePlayers
      .slice(0, 5) // Top 5 available players by ADP
      .map(p => p.id);
  }
  
  if (strategy === "need") {
    // Fill Roster Needs - aggressive position targeting
    const roster = leagueSettings.roster || {QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1, K: 1, DST: 1, BENCH: 6};
    const currentCounts = {
      QB: myTeam.filter(p => p.position === 'QB').length,
      RB: myTeam.filter(p => p.position === 'RB').length,
      WR: myTeam.filter(p => p.position === 'WR').length,
      TE: myTeam.filter(p => p.position === 'TE').length,
      K: myTeam.filter(p => p.position === 'K').length,
      DST: myTeam.filter(p => p.position === 'DST').length,
    };
    
    // Find positions where we're most behind target
    const positionPriority = Object.entries(roster)
      .filter(([pos]) => pos !== 'FLEX' && pos !== 'BENCH')
      .map(([pos, target]) => ({
        position: pos,
        shortage: Math.max(0, target - (currentCounts[pos as keyof typeof currentCounts] || 0))
      }))
      .filter(p => p.shortage > 0)
      .sort((a, b) => b.shortage - a.shortage);
    
    if (positionPriority.length === 0) {
      // No urgent needs, get best available
      return availablePlayers.slice(0, 3).map(p => p.id);
    }
    
    // Recommend players from most needed positions
    const neededPositions = positionPriority.slice(0, 2).map(p => p.position);
    return availablePlayers
      .filter(player => neededPositions.includes(player.position))
      .slice(0, 4)
      .map(p => p.id);
  }
  
  if (strategy === "upside") {
    // High Upside - favor younger players, higher tiers, and breakout candidates
    const currentRound = Math.ceil(currentPick / (leagueSettings.teams || 12));
    
    if (currentRound <= 6) {
      // Early rounds: safe high-value picks (tiers 1-3)
      return availablePlayers
        .filter(player => (player.tier || 999) <= 3)
        .slice(0, 4)
        .map(p => p.id);
    } else {
      // Later rounds: high upside picks - RB/WR in better tiers than expected for the round
      const expectedTierForRound = Math.ceil(currentRound * 1.5); // Rough tier expectation
      return availablePlayers
        .filter(player => 
          ['RB', 'WR', 'TE'].includes(player.position) && 
          (player.tier || 999) < expectedTierForRound
        )
        .slice(0, 5)
        .map(p => p.id);
    }
  }
  
  // Fallback to balanced if unknown strategy
  return availablePlayers.slice(0, 3).map(p => p.id);
}