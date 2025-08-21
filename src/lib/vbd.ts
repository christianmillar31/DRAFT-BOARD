// VBD (Value-Based Drafting) Utility Functions
// Extracted from DraftBoard component for reusability and testing

export type Pos = "QB" | "RB" | "WR" | "TE";

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
  flexShare: { QB: number; RB: number; WR: number; TE: number } = { QB: 0, RB: 0.4, WR: 0.4, TE: 0.2 }
): number => {
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
  const weights = flexWeights || { QB: 0, RB: 0.4, WR: 0.4, TE: 0.2 };
  const rr = replacementRank(pos, teams, starters, flex, weights);
  let pts = projPointsTiered(pos, rr);
  // streaming discount for QB and TE
  if (pos === "QB" || pos === "TE") pts *= 0.95;
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
  
  // Get base projected points using improved tiered formulas with smooth transitions
  const baseProjectedPoints = projPointsTiered(position, positionRank);
  
  // Position-specific SOS Adjustment with clamping
  const sosAdjustment = sosData ? sosMultiplierPos(position, sosData) : 1.0;
  
  // Apply SOS adjustment and floor
  const adjustedProjectedPoints = applyFloors(position, baseProjectedPoints * sosAdjustment);
  
  // Calculate replacement level points with configurable flex allocation
  const replPoints = replacementPoints(position, teams, starters, flex, flexWeights);
  
  // Final VBD calculation
  return Math.max(0, adjustedProjectedPoints - replPoints);
};