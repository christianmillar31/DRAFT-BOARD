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
    const elite = (x: number) => 315 - 5.5 * x;     // 1-6
    const mid = (x: number) => 325 - 7.0 * x;       // 7-18
    const late = (x: number) => 235 - 2.4 * x;      // 19+ (tuned for RB29 ≈ 165)
    
    if (r <= 6) return Math.max(90, elite(r));
    if (r <= 18) return Math.max(90, r < 8 ? smoothBlend(r, 6, elite, mid) : mid(r));
    return Math.max(90, r < 20 ? smoothBlend(r, 18, mid, late) : late(r));
  }
  if (pos === "WR") {
    const elite = (x: number) => 290 - 4.0 * x;     // 1-8
    const mid = (x: number) => 300 - 5.0 * x;       // 9-28
    const late = (x: number) => 160 - 0.25 * x;     // 29+ (ensures continuity from mid tier)
    
    if (r <= 8) return Math.max(90, elite(r));
    if (r <= 28) return Math.max(90, r < 10 ? smoothBlend(r, 8, elite, mid) : mid(r));
    return Math.max(90, late(r)); // Remove smoothBlend for WR late tier to ensure monotonicity
  }
  if (pos === "TE") {
    const elite = (x: number) => 220 - 8.0 * x;     // 1-3
    const mid = (x: number) => 215 - 6.5 * x;       // 4-10
    const late = (x: number) => 150 - 0.5 * x;      // 11+ (ensures continuity)
    
    if (r <= 3) return Math.max(95, elite(r));
    if (r <= 10) return Math.max(95, r < 5 ? smoothBlend(r, 3, elite, mid) : mid(r));
    return Math.max(95, r < 12 ? smoothBlend(r, 10, mid, late) : late(r));
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

// Superflex and custom flex weight configuration
export const getFlexWeights = (leagueSettings: any) => {
  // Superflex preset - QB is eligible in flex pool
  if (leagueSettings.scoring?.superflex || leagueSettings.flexType === 'superflex') {
    return { QB: 0.3, RB: 0.3, WR: 0.3, TE: 0.1 }; // QB gets 30% of flex allocation
  }
  
  // 3WR leagues preset (push more flex toward WR)
  if (leagueSettings.roster?.WR >= 3) {
    return { QB: 0, RB: 0.35, WR: 0.5, TE: 0.15 };
  }
  
  // Custom flex weights from settings
  if (leagueSettings.flexWeights) {
    return leagueSettings.flexWeights;
  }
  
  // CORRECTED Default allocation per guide: RB 60%, WR 35%, TE 5%
  return { QB: 0, RB: 0.6, WR: 0.35, TE: 0.05 };
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
  // Use correct default weights if not provided
  const weights = flexWeights || { QB: 0, RB: 0.6, WR: 0.35, TE: 0.05 };
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
  
  // Step 3: Apply floor
  const finalPoints = applyFloors(position, sosAdjustedPoints);
  const floorApplied = finalPoints > sosAdjustedPoints;
  
  // Step 4: Replacement level
  const replPoints = replacementPointsMemoized(position, teams, starters, flex, flexWeights);
  
  // Step 5: Final VBD
  const vbd = Math.max(0, finalPoints - replPoints);
  
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
    { count: roster.FLEX, eligible: ['RB', 'WR', 'TE'] },
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
      { QB: leagueSettings.roster?.QB || 1, RB: leagueSettings.roster?.RB || 2, WR: leagueSettings.roster?.WR || 3, TE: leagueSettings.roster?.TE || 1 },
      { count: leagueSettings.roster?.FLEX || 1, eligible: ['RB', 'WR', 'TE'] },
      { QB: 0, RB: 0.6, WR: 0.35, TE: 0.05 }  // Correct flex weights
    );
    
    // Get available players at this position
    const positionPlayers = availablePlayers
      .filter(p => p.position === pos && !draftState.draftedPlayers.has(p.id))
      .sort((a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0));
    
    // Use actual projections if available, otherwise use tiered estimate
    if (positionPlayers.length > baselineRank) {
      const baselinePlayer = positionPlayers[baselineRank];
      replacement[pos] = baselinePlayer.projectedPoints || projPointsTiered(pos, baselineRank);
    } else if (positionPlayers.length > 0) {
      // Not enough players left, use last available
      const lastPlayer = positionPlayers[positionPlayers.length - 1];
      replacement[pos] = lastPlayer.projectedPoints || projPointsTiered(pos, baselineRank);
    } else {
      // No players left, use floor
      replacement[pos] = FLOOR[pos];
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
  sosData?: Record<Pos, number> | null
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
    { QB: leagueSettings.roster?.QB || 1, RB: leagueSettings.roster?.RB || 2, WR: leagueSettings.roster?.WR || 3, TE: leagueSettings.roster?.TE || 1 },
    { count: leagueSettings.roster?.FLEX || 1, eligible: ['RB', 'WR', 'TE'] },
    getFlexWeights(leagueSettings)
  );
  
  const dynamicReplacements = calculateDynamicReplacement(availablePlayers, draftState, leagueSettings, draftedCounts, sosData);
  const dynamicReplacement = dynamicReplacements[position];
  
  // Calculate scarcity bonus (how much more valuable due to draft state)
  const scarcityBonus = staticReplacement - dynamicReplacement;
  
  // Count remaining players at this position
  const remainingAtPosition = availablePlayers.filter(p => 
    p.position === position && !draftState.draftedPlayers.has(p.id)
  ).length;
  
  // Standard VBD calculation using dynamic replacement
  const positionRanks = positionRankFromADP(availablePlayers);
  const positionRank = positionRanks[player.id] || Math.ceil(player.adp / 10);
  
  // PURE VBD: Use actual projections or tiered estimate, no adjustments
  const rawPoints = player.projectedPoints || projPointsTiered(position, positionRank);
  
  // NO SOS in VBD calculation - keep it pure
  const sosMultiplier = 1.0;
  const sosAdjustedPoints = rawPoints;
  
  // Use raw points directly - no floor application in pure VBD
  const finalPoints = rawPoints;
  const floorApplied = false;
  
  const vbd = Math.max(0, finalPoints - dynamicReplacement);
  
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
  
  // Get base projected points (no adjustments for pure VBD)
  const baseProjectedPoints = projPointsTiered(position, positionRank);
  
  // PURE VBD: No SOS adjustment, no floors - just raw points
  const projectedPoints = baseProjectedPoints;
  
  // Calculate replacement level points with correct flex allocation
  const replPoints = replacementPoints(position, teams, starters, flex, flexWeights);
  
  // Pure VBD calculation - just the difference
  return Math.max(0, projectedPoints - replPoints);
};