// Roster configuration constants and validation
// Based on comprehensive VBD adjustments for different league formats

export type RosterConfig = 
  | 'standard_roster'    // 1QB, 2RB, 2WR, 1TE, 1FLEX
  | '3wr_roster'        // 1QB, 2RB, 3WR, 1TE, 1FLEX
  | '2flex_roster'      // 1QB, 2RB, 2WR, 1TE, 2FLEX
  | '3wr_2flex'         // 1QB, 2RB, 3WR, 1TE, 2FLEX
  | 'superflex';        // 2QB, 2RB, 2WR, 1TE, 1FLEX

export type ScoringFormat = 'Standard' | 'Half-PPR' | 'PPR' | 'Superflex';

// Position value multipliers by scoring format
export const SCORING_MULTIPLIERS: Record<ScoringFormat, Record<string, number>> = {
  'Standard': {
    QB: 1.0,
    RB: 1.0,   // RBs are king in standard
    WR: 0.85,  // WRs less valuable without PPR
    TE: 0.8    // TEs significantly devalued
  },
  'Half-PPR': {
    QB: 1.0,
    RB: 0.95,  // Slight RB decrease
    WR: 0.92,  // WRs gain some value
    TE: 0.88   // TEs improve slightly
  },
  'PPR': {
    QB: 1.0,
    RB: 0.9,   // RBs lose relative value
    WR: 1.0,   // WRs at full value
    TE: 0.95   // TEs much more viable
  },
  'Superflex': {
    QB: 1.8,   // QBs massively boosted
    RB: 0.85,  // Everything else decreases relatively
    WR: 0.85,
    TE: 0.75
  }
};

// Baseline ranks (replacement level) by roster configuration
export const BASELINE_RANKS: Record<RosterConfig, Record<string, number>> = {
  // Standard roster (1QB, 2RB, 2WR, 1TE, 1FLEX)
  'standard_roster': {
    QB: 12,  // 12-team league baseline
    RB: 30,  // 2*12 + 0.5*12 flex
    WR: 30,  // 2*12 + 0.35*12 flex  
    TE: 13   // 1*12 + 0.15*12 flex
  },
  // 3WR roster
  '3wr_roster': {
    QB: 12,
    RB: 30,  // Same RB requirement
    WR: 40,  // 3*12 + 0.35*12 flex - WRs more valuable!
    TE: 13
  },
  // 2FLEX roster
  '2flex_roster': {
    QB: 12,
    RB: 36,  // 2*12 + 0.5*24 flex
    WR: 36,  // 2*12 + 0.35*24 flex
    TE: 15   // 1*12 + 0.15*24 flex
  },
  // 3WR + 2FLEX (most competitive leagues)
  '3wr_2flex': {
    QB: 12,
    RB: 36,  // 2*12 + 0.5*24
    WR: 44,  // 3*12 + 0.35*24 - HUGE WR demand
    TE: 16   // 1*12 + 0.15*24
  },
  // Superflex
  'superflex': {
    QB: 24,  // 2*12 - Every team needs 2 QBs
    RB: 30,
    WR: 30,
    TE: 13
  }
};

// Valid roster configurations
export const VALID_ROSTER_CONFIGS = [
  { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPERFLEX: 0 }, // standard_roster
  { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1, SUPERFLEX: 0 }, // 3wr_roster  
  { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 2, SUPERFLEX: 0 }, // 2flex_roster
  { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 2, SUPERFLEX: 0 }, // 3wr_2flex
  { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, SUPERFLEX: 1 }, // superflex
];

// Get roster type from settings
export const getRosterType = (settings: any): RosterConfig => {
  const wr = settings.roster?.WR || 2;
  const flex = settings.roster?.FLEX || 1;
  const superflex = settings.roster?.SUPERFLEX || 0;
  
  if (superflex > 0) return 'superflex';
  if (wr === 3 && flex === 2) return '3wr_2flex';
  if (wr === 3) return '3wr_roster';
  if (flex === 2) return '2flex_roster';
  return 'standard_roster';
};

// Validate roster configuration
export const validateRosterConfig = (roster: any): { valid: boolean; error?: string } => {
  const config = {
    QB: roster.QB || 1,
    RB: roster.RB || 2,
    WR: roster.WR || 2,
    TE: roster.TE || 1,
    FLEX: roster.FLEX || 1,
    SUPERFLEX: roster.SUPERFLEX || 0
  };
  
  const isValid = VALID_ROSTER_CONFIGS.some(valid => 
    valid.QB === config.QB &&
    valid.RB === config.RB &&
    valid.WR === config.WR &&
    valid.TE === config.TE &&
    valid.FLEX === config.FLEX &&
    valid.SUPERFLEX === config.SUPERFLEX
  );
  
  if (!isValid) {
    const validOptions = VALID_ROSTER_CONFIGS.map(c => 
      `${c.QB}QB/${c.RB}RB/${c.WR}WR/${c.TE}TE/${c.FLEX}FLEX${c.SUPERFLEX ? `/${c.SUPERFLEX}SF` : ''}`
    ).join(', ');
    
    return {
      valid: false,
      error: `Invalid roster configuration. Valid options: ${validOptions}`
    };
  }
  
  return { valid: true };
};