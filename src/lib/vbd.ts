// VBD (Value-Based Drafting) Utility Functions
// Extracted from DraftBoard component for reusability and testing

export type Pos = "QB" | "RB" | "WR" | "TE";

// Dynamic VBD types for real-time draft analysis
export interface DraftState {
  draftedPlayers: Set<string>;           // All drafted player IDs
  currentPick: number;                   // Overall pick number (1-based)
  myPosition: number;                    // Your draft position (1-12)
  teams: number;                        // League size
  roundsRemaining: number;              // Rounds left to draft
  totalRounds: number;                  // Total rounds in draft
}

export interface PositionDraftCounts {
  QB: { starters: number; flex: number };
  RB: { starters: number; flex: number };
  WR: { starters: number; flex: number };
  TE: { starters: number; flex: number };
}

export interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  adp: number;
  projectedPoints?: number;
}

export interface DynamicVBDResult extends VBDBreakdown {
  staticReplacement: number;
  dynamicReplacement: number;
  scarcityBonus: number;
  remainingAtPosition: number;
}

// Helper functions for smooth tier transitions
export const lerp = (a: number, b: number, t: number): number => {
  return a + (b - a) * t;
};

export const smoothBlend = (r: number, r0: number, fLow: (x: number) => number, fHigh: (x: number) => number): number => {
  const t = Math.min(1, Math.max(0, (r - (r0 - 1)) / 2)); // 0 to 1 across two ranks
  return lerp(fLow(r), fHigh(r), t);
};

// Tiered projections with tuned constants and smooth transitions
export const projPointsTiered = (pos: Pos, r: number): number => {
  if (!Number.isFinite(r) || r <= 0) return 100;
  
  if (pos === "QB") {
    const elite = (x: number) => 380 - 2.0 * x;     // 1-6
    const mid = (x: number) => 371 - 3.25 * x;      // 7-15 (tuned for QB12 ≈ 332)
    const late = (x: number) => 350 - 2.5 * x;      // 16+ (tuned)
    
    if (r <= 6) return Math.max(110, elite(r));
    if (r <= 15) return Math.max(110, r < 8 ? smoothBlend(r, 6, elite, mid) : mid(r));
    return Math.max(110, r < 17 ? smoothBlend(r, 15, mid, late) : late(r));
  }
  if (pos === "RB") {
    const elite = (x: number) => 320 - 5.0 * x;     // 1-6 (RB6 = 290)
    const mid = (x: number) => 296 - 3.5 * x;       // 7-18 (RB7 = 271.5, ensures continuity)
    const late = (x: number) => 240 - 2.0 * x;      // 19+ (more realistic decline)
    
    if (r <= 6) return Math.max(90, elite(r));
    if (r <= 18) return Math.max(90, r < 8 ? smoothBlend(r, 6, elite, mid) : mid(r));
    return Math.max(90, r < 20 ? smoothBlend(r, 18, mid, late) : late(r));
  }
  if (pos === "WR") {
    const elite = (x: number) => 280 - 3.5 * x;     // Less aggressive decline: WR1=276.5
    const mid = (x: number) => 250 - 2.8 * x;       // Better continuity
    const late = (x: number) => 180 - 1.5 * x;      // More realistic floor
    
    if (r <= 12) return Math.max(90, elite(r));
    if (r <= 36) return Math.max(90, r < 14 ? smoothBlend(r, 12, elite, mid) : mid(r));
    return Math.max(90, r < 38 ? smoothBlend(r, 36, mid, late) : late(r));
  }
  if (pos === "TE") {
    const elite = (x: number) => 270 - 12.0 * x;    // 1-3 (TE1 = 258, TE3 = 234)
    const mid = (x: number) => 240 - 8.0 * x;       // 4-8 (TE4 = 208, TE8 = 176)
    const late = (x: number) => 160 - 2.0 * x;      // 9+ (TE12 = 136)
    
    if (r <= 3) return Math.max(95, elite(r));
    if (r <= 8) return Math.max(95, r < 5 ? smoothBlend(r, 3, elite, mid) : mid(r));
    return Math.max(95, r < 10 ? smoothBlend(r, 8, mid, late) : late(r));
  }
  return 100; // fallback
};

// Position-specific SOS multiplier
export const sosMultiplierPos = (pos: Pos, sosByPos: Record<Pos, number>, k = 0.08): number => {
  const base = 16.5;
  const s = sosByPos[pos];
  if (s == null || !Number.isFinite(s)) return 1.0;
  const m = 1 + k * ((s - base) / base);
  // Clamp to prevent extreme adjustments (0.92 to 1.08)
  return Math.min(1.08, Math.max(0.92, m));
};

export const replacementRank = (
  pos: Pos,
  teams: number,
  starters: { QB: number; RB: number; WR: number; TE: number },
  flex: { count: number; eligible: Pos[] } | null,
  flexShare: { QB: number; RB: number; WR: number; TE: number } = { QB: 0, RB: 0.6, WR: 0.35, TE: 0.05 }
): number => {
  // Correct baseline calculation per the comprehensive guide
  // RB gets 60% of flex, WR gets 35%, TE gets 5%
  const base = starters[pos] * teams;
  if (!flex || flex.count <= 0) return base;
  const eligibleShare = flex.eligible.includes(pos) ? flexShare[pos] : 0;
  const extra = Math.round(eligibleShare * flex.count * teams);
  return base + extra;
};

export const replacementPoints = (
  pos: Pos,
  teams: number,
  starters: { QB: number; RB: number; WR: number; TE: number },
  flex: { count: number; eligible: Pos[] } | null,
  flexWeights?: { QB: number; RB: number; WR: number; TE: number }
): number => {
  // Use correct flex weights: RB 60%, WR 35%, TE 5%
  const weights = flexWeights || { QB: 0, RB: 0.6, WR: 0.35, TE: 0.05 };
  const rr = replacementRank(pos, teams, starters, flex, weights);
  // NO streaming discount - keep VBD pure per the guide
  const pts = projPointsTiered(pos, rr);
  return pts;
};

// Position rank calculation from ADP
export const positionRankFromADP = (
  players: { id: string; position: string; adp: number }[]
): Record<string, number> => {
  const byPos: Record<Pos, { id: string; adp: number }[]> = { QB: [], RB: [], WR: [], TE: [] };
  
  // Group players by position
  for (const p of players) {
    if (p.position in byPos) {
      byPos[p.position as Pos].push({ id: p.id, adp: p.adp });
    }
  }
  
  const out: Record<string, number> = {};
  
  // Sort each position by ADP and assign ranks
  (Object.keys(byPos) as Pos[]).forEach(pos => {
    byPos[pos].sort((a, b) => a.adp - b.adp);
    byPos[pos].forEach((p, i) => { 
      out[p.id] = i + 1; 
    });
  });
  
  return out;
};

// Floor caps to prevent negative projections
export const FLOOR = { QB: 110, RB: 90, WR: 90, TE: 95 };

export const applyFloors = (pos: Pos, ptsAfterSOS: number): number => {
  return Math.max(FLOOR[pos], ptsAfterSOS);
};

// Optional helper for playoff weighted SOS
export const playoffWeightedSOS = (
  regularSOS: number,
  playoffSOS: number,
  playoffWeight = 0.3
): number => {
  const w = Math.max(0, Math.min(1, playoffWeight));
  return (1 - w) * regularSOS + w * playoffSOS;
};

// CORRECTED FLEX ALLOCATION - Uses proportional splitting methodology from industry research
export const calculateDynamicFlexWeights = (leagueSettings: any): Record<Pos, number> => {
  const roster = leagueSettings.roster || {};
  const flexCount = roster.FLEX || 0;
  const superflexCount = roster.SUPERFLEX || 
    (leagueSettings.scoring?.superflex || leagueSettings.flexType === 'superflex' ? 1 : 0);
  
  console.log('🔧 CALCULATING PROPORTIONAL FLEX WEIGHTS:', { roster, flexCount, superflexCount });
  
  // CRITICAL FIX: Use effective roster requirements, not historical usage
  // Based on 4for4's "core roster" methodology for non-standard formats
  
  const dedicatedSlots = {
    QB: roster.QB || 1,
    RB: roster.RB || 2, 
    WR: roster.WR || 2,
    TE: roster.TE || 1
  };
  
  // Industry-standard flex allocation weights from ESPN/FantasyPros analysis
  // These reflect actual optimal roster construction, not drafting tendencies
  const baseFlexWeights = {
    QB: superflexCount > 0 ? 0.25 : 0.00,
    RB: 0.50,  // RBs get 50% of flex spots (more valuable due to scarcity)
    WR: 0.40,  // WRs get 40% of flex spots  
    TE: 0.10   // TEs get 10% of flex spots (only elite TEs worth flexing)
  };
  
  // Format-specific adjustments for non-standard roster configurations
  let adjustedWeights = { ...baseFlexWeights };
  
  // 2WR leagues: Boost WR flex usage significantly
  if (dedicatedSlots.WR === 2) {
    adjustedWeights.WR = 0.70;  // Increase WR flex weight in 2WR formats
    adjustedWeights.RB = 0.25;  // Reduce RB flex weight accordingly
  }
  
  // 3+ RB leagues: Reduce RB flex usage
  if (dedicatedSlots.RB >= 3) {
    adjustedWeights.RB = 0.30;
    adjustedWeights.WR = 0.55;
  }
  
  // 2TE leagues: Boost TE flex usage
  if (dedicatedSlots.TE >= 2) {
    adjustedWeights.TE = 0.20;
    adjustedWeights.RB = 0.45;
    adjustedWeights.WR = 0.35;
  }
  
  // Multiple flex leagues: More balanced distribution
  if (flexCount >= 2) {
    adjustedWeights.RB = Math.max(0.40, adjustedWeights.RB - 0.05);
    adjustedWeights.WR = Math.min(0.50, adjustedWeights.WR + 0.05);
  }
  
  // Normalize weights to sum to 1.0
  const eligiblePositions = getFlexEligible(leagueSettings);
  let totalWeight = 0;
  eligiblePositions.forEach(pos => {
    totalWeight += adjustedWeights[pos];
  });
  
  const finalWeights: Record<Pos, number> = { QB: 0, RB: 0, WR: 0, TE: 0 };
  if (totalWeight > 0) {
    eligiblePositions.forEach(pos => {
      finalWeights[pos] = adjustedWeights[pos] / totalWeight;
    });
  }
  
  console.log('✅ PROPORTIONAL FLEX WEIGHTS CALCULATED:', {
    original: baseFlexWeights,
    adjusted: adjustedWeights, 
    final: finalWeights,
    format: `${dedicatedSlots.QB}QB/${dedicatedSlots.RB}RB/${dedicatedSlots.WR}WR/${dedicatedSlots.TE}TE/${flexCount}FLEX`
  });
  
  return finalWeights;
};

// Updated getFlexWeights to use dynamic system
export const getFlexWeights = (leagueSettings: any) => {
  return calculateDynamicFlexWeights(leagueSettings);
};

// Get flex-eligible positions based on league settings
export const getFlexEligible = (leagueSettings: any): Pos[] => {
  // Superflex leagues - QB is flex eligible
  if (leagueSettings.scoring?.superflex || leagueSettings.flexType === 'superflex') {
    return ['QB', 'RB', 'WR', 'TE'];
  }
  
  // Standard leagues - QB not flex eligible
  return ['RB', 'WR', 'TE'];
};

// Caching for expensive calculations
const replacementPointsCache = new Map<string, number>();
const sosMultiplierCache = new Map<string, number>();

// Memoized replacement points calculation
export const replacementPointsMemoized = (
  pos: Pos,
  teams: number,
  starters: { QB: number; RB: number; WR: number; TE: number },
  flex: { count: number; eligible: Pos[] } | null,
  flexWeights?: { QB: number; RB: number; WR: number; TE: number }
): number => {
  // Use CORRECTED default weights: RB 50%, WR 40%, TE 10%
  const weights = flexWeights || { QB: 0, RB: 0.5, WR: 0.4, TE: 0.1 };
  const cacheKey = `${pos}-${teams}-${JSON.stringify(starters)}-${JSON.stringify(flex)}-${JSON.stringify(weights)}`;
  
  if (replacementPointsCache.has(cacheKey)) {
    return replacementPointsCache.get(cacheKey)!;
  }
  
  const result = replacementPoints(pos, teams, starters, flex, weights);
  replacementPointsCache.set(cacheKey, result);
  return result;
};

// Memoized SOS multiplier calculation
export const sosMultiplierPosMemoized = (pos: Pos, sosByPos: Record<Pos, number>, k = 0.08): number => {
  const cacheKey = `${pos}-${JSON.stringify(sosByPos)}-${k}`;
  
  if (sosMultiplierCache.has(cacheKey)) {
    return sosMultiplierCache.get(cacheKey)!;
  }
  
  const result = sosMultiplierPos(pos, sosByPos, k);
  sosMultiplierCache.set(cacheKey, result);
  return result;
};

// VBD breakdown for debugging
export interface VBDBreakdown {
  rawPoints: number;
  sosMultiplier: number;
  sosAdjustedPoints: number;
  floorApplied: boolean;
  finalPoints: number;
  replacementPoints: number;
  vbd: number;
}

export const calculateVBDWithBreakdown = (
  player: { id: string; position: Pos; adp: number },
  allPlayers: { id: string; position: string; adp: number }[],
  sosData: Record<Pos, number> | null,
  teams: number = 12,
  starters: { QB: number; RB: number; WR: number; TE: number } = { QB: 1, RB: 2, WR: 3, TE: 1 },
  flex: { count: number; eligible: Pos[] } | null = { count: 1, eligible: ['RB', 'WR', 'TE'] },
  flexWeights?: { QB: number; RB: number; WR: number; TE: number }
): VBDBreakdown => {
  const position = player.position;
  
  // Calculate position rank
  const positionRanks = positionRankFromADP(allPlayers);
  const positionRank = positionRanks[player.id] || Math.ceil(player.adp / 10);
  
  // Step 1: Raw projected points
  const rawPoints = projPointsTiered(position, positionRank);
  
  // Step 2: SOS adjustment
  const sosMultiplier = sosData ? sosMultiplierPosMemoized(position, sosData) : 1.0;
  const sosAdjustedPoints = rawPoints * sosMultiplier;
  
  // Step 3: Use raw SOS-adjusted points (no floors in VBD)
  const finalPoints = sosAdjustedPoints;
  const floorApplied = false;
  
  // Step 4: Replacement level with CORRECTED flex allocation
  const replPoints = replacementPointsMemoized(position, teams, starters, flex, flexWeights);
  
  console.log(`🎯 VBD CALCULATION for ${position}:`, {
    finalPoints,
    replPoints, 
    rawVBD: finalPoints - replPoints,
    weights: flexWeights
  });
  
  // Step 5: Final VBD - allow negative values
  const vbd = finalPoints - replPoints;
  
  return {
    rawPoints,
    sosMultiplier,
    sosAdjustedPoints,
    floorApplied,
    finalPoints,
    replacementPoints: replPoints,
    vbd
  };
};

// =============================================================================
// DYNAMIC VBD SYSTEM - Real-time replacement calculation based on draft state
// =============================================================================

// Calculate how many players have been drafted by position/role
export const calculateDraftCounts = (
  draftedPlayerIds: Set<string>,
  allPlayers: Player[],
  leagueSettings: any
): PositionDraftCounts => {
  const counts: PositionDraftCounts = {
    QB: { starters: 0, flex: 0 },
    RB: { starters: 0, flex: 0 },
    WR: { starters: 0, flex: 0 },
    TE: { starters: 0, flex: 0 }
  };

  const roster = leagueSettings.roster || { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1 };
  const flexWeights = getFlexWeights(leagueSettings);
  
  // Track drafted players by position
  const draftedByPosition: Record<Pos, number> = { QB: 0, RB: 0, WR: 0, TE: 0 };
  
  allPlayers.forEach(player => {
    if (draftedPlayerIds.has(player.id) && ['QB', 'RB', 'WR', 'TE'].includes(player.position)) {
      draftedByPosition[player.position as Pos]++;
    }
  });

  // Allocate drafted players to starter vs flex slots
  (['QB', 'RB', 'WR', 'TE'] as Pos[]).forEach(pos => {
    const totalDrafted = draftedByPosition[pos];
    const starterSlots = roster[pos] * leagueSettings.teams;
    
    // Fill starter slots first
    counts[pos].starters = Math.min(totalDrafted, starterSlots);
    
    // Remaining go to flex (weighted)
    const overflowToFlex = Math.max(0, totalDrafted - starterSlots);
    counts[pos].flex = overflowToFlex;
  });

  return counts;
};

// Calculate total need for a position in the league
export const calculateTotalPositionNeed = (
  pos: Pos,
  draftState: DraftState,
  leagueSettings: any
): number => {
  const roster = leagueSettings.roster || { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1 };
  const flexWeights = getFlexWeights(leagueSettings);
  
  const totalStartersNeeded = roster[pos] * draftState.teams;
  const totalFlexNeeded = Math.round(flexWeights[pos] * roster.FLEX * draftState.teams);
  
  return totalStartersNeeded + totalFlexNeeded;
};

// Get static replacement rank for comparison
export const getStaticReplacementRank = (
  pos: Pos,
  leagueSettings: any
): number => {
  const teams = leagueSettings.teams || 12;
  const roster = leagueSettings.roster || { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1 };
  const flexWeights = getFlexWeights(leagueSettings);
  
  return replacementRank(
    pos,
    teams,
    { QB: roster.QB, RB: roster.RB, WR: roster.WR, TE: roster.TE },
    { count: roster.FLEX, eligible: getFlexEligible(leagueSettings) },
    flexWeights
  );
};

// Calculate remaining need for each position based on what's left to draft
export const calculateRemainingNeed = (
  pos: Pos,
  draftState: DraftState,
  leagueSettings: any,
  draftedCounts: PositionDraftCounts
): number => {
  const totalNeed = calculateTotalPositionNeed(pos, draftState, leagueSettings);
  const alreadyDrafted = draftedCounts[pos].starters + draftedCounts[pos].flex;
  
  return Math.max(0, totalNeed - alreadyDrafted);
};

// Calculate dynamic replacement levels based on current draft state
// CORRECTED: No scarcity penalties - VBD inherently captures scarcity
export const calculateDynamicReplacement = (
  availablePlayers: Player[],
  draftState: DraftState,
  leagueSettings: any,
  draftedCounts: PositionDraftCounts,
  sosData?: Record<Pos, number> | null
): Record<Pos, number> => {
  const replacement: Record<Pos, number> = { QB: 0, RB: 0, WR: 0, TE: 0 };
  
  (['QB', 'RB', 'WR', 'TE'] as Pos[]).forEach(pos => {
    // Calculate the correct baseline rank with proper flex allocation
    const baselineRank = replacementRank(
      pos,
      draftState.teams,
      { QB: leagueSettings.roster?.QB || 1, RB: leagueSettings.roster?.RB || 2, WR: leagueSettings.roster?.WR || 2, TE: leagueSettings.roster?.TE || 1 },
      { count: leagueSettings.roster?.FLEX || 1, eligible: getFlexEligible(leagueSettings) },
      getFlexWeights(leagueSettings)  // Use dynamic weights
    );
    
    // Get available players at this position - CRITICAL FIX: Sort by ADP not projectedPoints!
    const positionPlayers = availablePlayers
      .filter(p => p.position === pos && !draftState.draftedPlayers.has(p.id))
      .sort((a, b) => a.adp - b.adp);  // Sort by ADP (ascending) to match consensus rankings
    
    // FIXED: Account for already drafted players
    const totalNeeded = calculateTotalPositionNeed(pos, draftState, leagueSettings);
    const alreadyDrafted = Array.from(draftState.draftedPlayers).filter(id => {
      const player = availablePlayers.find(p => p.id === id);
      return player?.position === pos;
    }).length;
    
    // CORRECTED: Use effective replacement calculation for actual roster format
    const roster = leagueSettings.roster || { RB: 2, WR: 2, TE: 1, FLEX: 2 };
    const flexSlots = roster.FLEX || 1;
    
    // Calculate EFFECTIVE starters for this specific roster format
    let effectiveStarters;
    if (pos === 'RB') {
      effectiveStarters = roster.RB + (flexSlots * 0.5); // RBs take ~50% of flex
    } else if (pos === 'WR') {
      effectiveStarters = roster.WR + (flexSlots * 0.65); // WRs take 65% in 2WR leagues 
    } else if (pos === 'TE') {
      effectiveStarters = roster.TE + (flexSlots * 0.1); // TEs take ~10% of flex
    } else {
      effectiveStarters = roster[pos] || 1;
    }
    
    const effectiveReplacementRank = Math.round(effectiveStarters * draftState.teams);
    const replacementIndex = Math.min(
      effectiveReplacementRank - 1,  // Convert to 0-based index  
      positionPlayers.length - 1     // Don't go past array bounds
    );
    
    // SURGICAL DEBUG: Enhanced logging for WR position
    if (pos === 'WR') {
      console.log(`🎯 CORRECTED WR REPLACEMENT CALCULATION:`, {
        rosterWR: roster.WR,
        flexSlots: flexSlots,
        effectiveStarters: effectiveStarters.toFixed(1),
        effectiveReplacementRank,
        replacementIndex,
        oldBaselineRank: baselineRank,
        difference: effectiveReplacementRank - baselineRank,
        availableWRs: positionPlayers.length,
        replacementPlayer: positionPlayers[replacementIndex]?.name,
        replacementADP: positionPlayers[replacementIndex]?.adp
      });
    }
    
          // SURGICAL DEBUG: Log detailed WR replacement calculation
      if (pos === 'WR') {
        console.log(`🎯 WR REPLACEMENT CALCULATION:`, {
          baselineRank: baselineRank,
          alreadyDrafted: alreadyDrafted,
          replacementIndex: replacementIndex,
          positionPlayersCount: positionPlayers.length,
          totalNeeded: totalNeeded,
          firstAvailablePlayer: positionPlayers[0]?.name,
          firstAvailablePoints: positionPlayers[0]?.projectedPoints,
          replacementPlayer: positionPlayers[replacementIndex]?.name,
          replacementPoints: positionPlayers[replacementIndex]?.projectedPoints
        });
      }
    
    // Use actual projections if available, otherwise use tiered estimate with CORRECTED rank
    if (replacementIndex >= 0 && positionPlayers[replacementIndex]) {
      const baselinePlayer = positionPlayers[replacementIndex];
      replacement[pos] = baselinePlayer.projectedPoints || projPointsTiered(pos, effectiveReplacementRank);
      
      // SURGICAL DEBUG: Log the actual replacement player selection for WR
      if (pos === 'WR') {
        console.log(`🎯 WR REPLACEMENT PLAYER SELECTED:`, {
          replacementIndex: replacementIndex,
          replacementPlayer: baselinePlayer.name,
          replacementPoints: baselinePlayer.projectedPoints,
          fallbackPoints: projPointsTiered(pos, baselineRank),
          finalReplacementValue: replacement[pos]
        });
      }
    } else if (positionPlayers.length > 0) {
      // Not enough players left, use last available (scarcity!)
      const lastPlayer = positionPlayers[positionPlayers.length - 1];
      replacement[pos] = lastPlayer.projectedPoints || projPointsTiered(pos, effectiveReplacementRank);
    } else {
      // No players left, use tiered estimate for effective rank
      replacement[pos] = projPointsTiered(pos, effectiveReplacementRank);
    }
  });
  
  return replacement;
};

// Main dynamic VBD calculation
export const calculateDynamicVBD = (
  player: Player,
  availablePlayers: Player[],
  draftState: DraftState,
  leagueSettings: any,
  sosData?: Record<Pos, number> | null,
  recentPicks?: { position: Pos }[],
  myNextPick?: number
): DynamicVBDResult => {
  const position = player.position as Pos;
  
  
  // Skip calculation for unsupported positions
  if (!['QB', 'RB', 'WR', 'TE'].includes(position)) {
    const fallback = { rawPoints: 0, sosMultiplier: 1.0, sosAdjustedPoints: 0, floorApplied: false, finalPoints: 0, replacementPoints: 0, vbd: 0 };
    return { 
      ...fallback, 
      staticReplacement: 0, 
      dynamicReplacement: 0, 
      scarcityBonus: 0, 
      remainingAtPosition: 0 
    };
  }

  // Calculate current draft counts
  const draftedCounts = calculateDraftCounts(draftState.draftedPlayers, availablePlayers, leagueSettings);
  
  // Get both static and dynamic replacement levels
  const staticReplacement = replacementPointsMemoized(
    position,
    draftState.teams,
    { QB: leagueSettings.roster?.QB || 1, RB: leagueSettings.roster?.RB || 2, WR: leagueSettings.roster?.WR || 2, TE: leagueSettings.roster?.TE || 1 },
    { count: leagueSettings.roster?.FLEX || 1, eligible: getFlexEligible(leagueSettings) },
    getFlexWeights(leagueSettings)
  );
  
  const dynamicReplacements = calculateDynamicReplacement(availablePlayers, draftState, leagueSettings, draftedCounts, sosData);
  const dynamicReplacement = dynamicReplacements[position];
  
  // SURGICAL DEBUG: Log dynamic replacement for WR position
  if (position === 'WR') {
    console.log(`🎯 DYNAMIC REPLACEMENT DEBUG for ${position}:`, {
      dynamicReplacement: dynamicReplacement,
      staticReplacement: staticReplacement,
      draftedCount: draftState.draftedPlayers.size,
      availablePlayers: availablePlayers.filter(p => p.position === 'WR' && !draftState.draftedPlayers.has(p.id)).length,
      replacementValues: dynamicReplacements
    });
  }
  
  // Calculate scarcity bonus (how much more valuable due to draft state)
  const scarcityBonus = staticReplacement - dynamicReplacement;
  
  // Count remaining players at this position
  const remainingAtPosition = availablePlayers.filter(p => 
    p.position === position && !draftState.draftedPlayers.has(p.id)
  ).length;
  
  // Standard VBD calculation using dynamic replacement
  const positionRanks = positionRankFromADP(availablePlayers);
  const positionRank = positionRanks[player.id] || Math.ceil(player.adp / 10);
  
  // PRIORITIZE Tank01 projections over tiered estimates
  const rawPoints = (player.projectedPoints && player.projectedPoints > 0) 
    ? player.projectedPoints 
    : projPointsTiered(position, positionRank);
  
  // NO SOS in VBD calculation - keep it pure
  const sosMultiplier = 1.0;
  const sosAdjustedPoints = rawPoints;
  
  // Use raw points directly - no floor application in pure VBD
  const finalPoints = rawPoints;
  const floorApplied = false;
  
  let vbd = finalPoints - dynamicReplacement; // Allow negative VBD - it's meaningful!
  
  // Phase 1: Elite Fall Detection - Add cross-positional value for elite players falling
  const eliteBonus = calculateEliteFallBonus(player, draftState.currentPick);
  const vbdBeforeEliteBonus = vbd;
  vbd = vbd + eliteBonus;
  
  // DEBUG: Log VBD changes for elite players
  if (eliteBonus > 0) {
    console.log('🎯 ELITE VBD TRANSFORMATION:', {
      playerName: player.name,
      vbdBefore: vbdBeforeEliteBonus,
      eliteBonus: eliteBonus,
      vbdAfter: vbd,
      currentPick: draftState.currentPick
    });
  }
  
  // Phase 2: Position Run Adjustment
  if (recentPicks && recentPicks.length > 0) {
    const runState = detectPositionRun(recentPicks);
    vbd = applyPositionRunAdjustment(vbd, position, runState);
  }
  
  // Phase 3: EVONA Integration
  if (myNextPick && myNextPick > draftState.currentPick) {
    const evonaValue = calculateEVONA(player, availablePlayers, draftState, myNextPick);
    // Negative EVONA means waiting costs value - boost current player
    // Positive EVONA means we can wait - reduce urgency slightly
    vbd = vbd - (evonaValue * 0.3); // 30% weight to EVONA considerations
  }
  
  return {
    rawPoints,
    sosMultiplier,
    sosAdjustedPoints,
    floorApplied,
    finalPoints,
    replacementPoints: dynamicReplacement,
    vbd,
    staticReplacement,
    dynamicReplacement,
    scarcityBonus,
    remainingAtPosition
  };
};

// =============================================================================
// STATIC VBD SYSTEM (Original)
// =============================================================================

// Main VBD calculation function
export const calculateVBD = (
  player: { id: string; position: Pos; adp: number },
  allPlayers: { id: string; position: string; adp: number }[],
  sosData: Record<Pos, number> | null,
  teams: number = 12,
  starters: { QB: number; RB: number; WR: number; TE: number } = { QB: 1, RB: 2, WR: 3, TE: 1 },
  flex: { count: number; eligible: Pos[] } | null = { count: 1, eligible: ['RB', 'WR', 'TE'] },
  flexWeights?: { QB: number; RB: number; WR: number; TE: number }
): number => {
  const position = player.position;
  
  // Skip calculation for unsupported positions
  if (!['QB', 'RB', 'WR', 'TE'].includes(position)) {
    return 0;
  }

  // Calculate actual position ranks from all available players
  const positionRanks = positionRankFromADP(allPlayers);
  const positionRank = positionRanks[player.id] || Math.ceil(player.adp / 10);
  
  // PRIORITIZE Tank01 projections over tiered estimates (if available)
  // Note: static VBD doesn't receive projectedPoints, so this is mainly for future-proofing
  const baseProjectedPoints = projPointsTiered(position, positionRank);
  
  // PURE VBD: No SOS adjustment, no floors - just raw points
  const projectedPoints = baseProjectedPoints;
  
  // Calculate replacement level points with correct flex allocation
  const replPoints = replacementPoints(position, teams, starters, flex, flexWeights);
  
  // Pure VBD calculation - allow negative values (meaningful information!)
  return projectedPoints - replPoints;
};

// =============================================================================
// CROSS-POSITIONAL VBD ENHANCEMENTS
// =============================================================================

// PHASE 1: ELITE FALL DETECTION
export const calculateEliteFallBonus = (
  player: Player,
  currentPick: number
): number => {
  const adpDeviation = currentPick - player.adp;
  
  // DEBUG: Log all elite fall calculations
  if (player.name.includes('Chase') || adpDeviation >= 2) {
    console.log('🎯 ELITE FALL DEBUG:', {
      playerName: player.name,
      playerADP: player.adp,
      currentPick: currentPick,
      adpDeviation: adpDeviation,
      condition1: player.adp <= 6,
      condition2: adpDeviation >= 2,
      meetsEliteConditions: player.adp <= 6 && adpDeviation >= 2
    });
  }
  
  // Tiered bonuses based on consensus value
  if (player.adp <= 6 && adpDeviation >= 2) {
    // True elite (Chase, Jefferson, CMC tier)
    const bonus = adpDeviation * 5 + 20;
    console.log('🚀 ELITE FALL BONUS APPLIED:', {
      playerName: player.name,
      bonus: bonus,
      formula: `${adpDeviation} * 5 + 20`
    });
    return bonus;
  } else if (player.adp <= 12 && adpDeviation >= 4) {
    // First round talent falling
    const bonus = adpDeviation * 3 + 10;
    console.log('📈 FIRST ROUND FALL BONUS:', {
      playerName: player.name,
      bonus: bonus
    });
    return bonus;
  } else if (player.adp <= 24 && adpDeviation >= 8) {
    // Second round value
    const bonus = adpDeviation * 2;
    console.log('📊 SECOND ROUND FALL BONUS:', {
      playerName: player.name,
      bonus: bonus
    });
    return bonus;
  }
  return 0;
};

// PHASE 2: POSITION RUN DETECTION & ADJUSTMENT
export interface PositionRunState {
  intensity: number;  // 0-1 scale
  position: Pos | null;
  consecutiveCount: number;
}

export const detectPositionRun = (
  recentPicks: { position: Pos }[],
  lookback: number = 7
): PositionRunState => {
  const relevantPicks = recentPicks.slice(-lookback);
  if (relevantPicks.length < 4) return { intensity: 0, position: null, consecutiveCount: 0 };
  
  const positionCounts: Record<Pos, number> = { QB: 0, RB: 0, WR: 0, TE: 0 };
  relevantPicks.forEach(p => positionCounts[p.position]++);
  
  // Find dominant position
  const maxCount = Math.max(...Object.values(positionCounts));
  const dominantPosition = Object.entries(positionCounts)
    .find(([_, count]) => count === maxCount)?.[0] as Pos;
  
  const intensity = maxCount / relevantPicks.length;
  
  // Check consecutive picks for true "run"
  let consecutive = 0;
  for (let i = relevantPicks.length - 1; i >= 0; i--) {
    if (relevantPicks[i].position === dominantPosition) consecutive++;
    else break;
  }
  
  return {
    intensity: intensity > 0.4 ? intensity : 0,  // 40% threshold
    position: intensity > 0.4 ? dominantPosition : null,
    consecutiveCount: consecutive
  };
};

export const applyPositionRunAdjustment = (
  baseVBD: number,
  playerPosition: Pos,
  runState: PositionRunState
): number => {
  if (!runState.position || runState.intensity === 0) return baseVBD;
  
  if (playerPosition === runState.position) {
    // Position being run on - likely overvalued by market
    // Heavier penalty for extreme runs
    const penalty = runState.consecutiveCount >= 5 ? 0.15 : 0.08;
    return baseVBD * (1 - runState.intensity * penalty);
  } else {
    // Other positions - opportunity for value
    // Bigger boost for positions that complement the run
    let boost = runState.intensity * 0.12;
    
    // Special case: RB run makes elite WRs more valuable
    if (runState.position === 'RB' && playerPosition === 'WR') {
      boost *= 1.3;
    }
    
    return baseVBD * (1 + boost);
  }
};

// PHASE 3: EVONA INTEGRATION
// Add normal CDF approximation
const normCDF = (z: number): number => {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const prob = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + 
    t * (-1.821255978 + 1.330274429 * t))));
  return z > 0 ? 1 - prob : prob;
};

const calculateSurvivalProbability = (
  playerADP: number,
  currentPick: number,
  targetPick: number
): number => {
  const adpStdDev = Math.max(3, playerADP * 0.15);
  const zScore = (targetPick - playerADP) / adpStdDev;
  return Math.max(0, Math.min(1, 1 - normCDF(zScore)));
};

export const calculateEVONA = (
  player: Player,
  availablePlayers: Player[],
  draftState: DraftState,
  myNextPick: number
): number => {
  // Filter to same position
  const positionPlayers = availablePlayers
    .filter(p => p.position === player.position && p.id !== player.id)
    .sort((a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0));
  
  // Calculate expected best available at next pick
  let expectedValue = 0;
  let totalProb = 0;
  
  for (const p of positionPlayers.slice(0, 5)) {  // Top 5 remaining
    const survivalProb = calculateSurvivalProbability(
      p.adp,
      draftState.currentPick,
      myNextPick
    );
    expectedValue += (p.projectedPoints || 0) * survivalProb;
    totalProb += survivalProb;
  }
  
  if (totalProb > 0) {
    expectedValue = expectedValue / totalProb;
  }
  
  // If waiting costs us value, return 0 (don't wait)
  // If current player is worse than expected next, return positive (can wait)
  return Math.max(0, expectedValue - (player.projectedPoints || 0));
};