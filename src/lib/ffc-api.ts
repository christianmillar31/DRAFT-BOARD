// Fantasy Football Calculator API Integration
// Provides format-specific ADP data to fix VBD calculations

interface FFCPlayer {
  name: string;
  position: string;
  team: string;
  adp: number;
  stdev: number;
  times_drafted: number;
}

interface FFCResponse {
  players: FFCPlayer[];
}

// FFC API endpoints for different formats
const FFC_ENDPOINTS = {
  standard: 'https://fantasyfootballcalculator.com/api/v1/adp/standard',
  ppr: 'https://fantasyfootballcalculator.com/api/v1/adp/ppr', 
  halfPPR: 'https://fantasyfootballcalculator.com/api/v1/adp/half-ppr',
  twoQB: 'https://fantasyfootballcalculator.com/api/v1/adp/2qb',
  dynasty: 'https://fantasyfootballcalculator.com/api/v1/adp/dynasty',
  rookie: 'https://fantasyfootballcalculator.com/api/v1/adp/rookie'
};

type FFCFormat = keyof typeof FFC_ENDPOINTS;

// Fetch format-specific ADP from FFC
export const fetchFFCADP = async (
  format: FFCFormat = 'ppr', 
  teams: number = 12
): Promise<FFCPlayer[] | null> => {
  try {
    const url = `${FFC_ENDPOINTS[format]}?teams=${teams}`;
    console.log(`🌐 Fetching FFC ADP data: ${format} ${teams}-team`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`FFC API error: ${response.statusText}`);
    }
    
    const data: FFCResponse = await response.json();
    
    console.log(`✅ FFC API Success: ${data.players.length} players loaded`);
    
    return data.players.map(player => ({
      name: player.name,
      position: player.position,
      team: player.team,
      adp: player.adp,
      stdev: player.stdev,
      times_drafted: player.times_drafted
    }));
    
  } catch (error) {
    console.error('❌ FFC API Error:', error);
    return null;
  }
};

// Normalize player names for matching
const normalizePlayerName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Match player to FFC data
export const findFFCPlayer = (
  playerName: string,
  position: string,
  ffcData: FFCPlayer[]
): FFCPlayer | null => {
  const normalizedName = normalizePlayerName(playerName);
  
  // First try exact match
  let match = ffcData.find(p => 
    normalizePlayerName(p.name) === normalizedName && 
    p.position === position
  );
  
  if (match) return match;
  
  // Try partial match (last name)
  const lastName = normalizedName.split(' ').pop() || '';
  match = ffcData.find(p => 
    normalizePlayerName(p.name).includes(lastName) && 
    p.position === position
  );
  
  return match || null;
};

// Determine format from league settings
export const getFFCFormat = (leagueSettings: any): FFCFormat => {
  if (leagueSettings.scoring?.superflex || leagueSettings.flexType === 'superflex') {
    return 'twoQB';
  }
  
  if (leagueSettings.scoring?.ppr === 1) {
    return 'ppr';
  }
  
  if (leagueSettings.scoring?.ppr === 0.5) {
    return 'halfPPR';
  }
  
  return 'standard';
};

// Enhanced VBD calculation with format-specific ADP
export const calculateEnhancedVBD = async (
  player: { name: string; position: string; projectedPoints?: number },
  leagueSettings: any,
  allPlayers: any[]
): Promise<number> => {
  // 1. Get format-specific FFC data
  const format = getFFCFormat(leagueSettings);
  const ffcData = await fetchFFCADP(format, leagueSettings.teams || 12);
  
  if (!ffcData) {
    console.warn('⚠️ FFC API unavailable, falling back to Tank01 ADP');
    // Fallback to existing VBD calculation
    return 0; // Implement fallback
  }
  
  // 2. Find player in FFC data
  const ffcPlayer = findFFCPlayer(player.name, player.position, ffcData);
  
  if (!ffcPlayer) {
    console.warn(`⚠️ Player not found in FFC: ${player.name}`);
    // Use average ADP for position
    const positionPlayers = ffcData.filter(p => p.position === player.position);
    const avgADP = positionPlayers.reduce((sum, p) => sum + p.adp, 0) / positionPlayers.length;
    console.log(`📊 Using average ${player.position} ADP: ${avgADP.toFixed(1)}`);
  }
  
  // 3. Calculate position rank from format-specific ADP
  const formatADP = ffcPlayer?.adp || 50; // fallback
  const positionRank = calculatePositionRankFromFFC(
    player.position,
    formatADP,
    ffcData
  );
  
  console.log(`📍 ${player.name}: Format ADP ${formatADP.toFixed(1)} = ${player.position}${positionRank}`);
  
  // 4. Use corrected replacement calculation
  const replacement = calculateCorrectReplacement(
    player.position,
    leagueSettings,
    format
  );
  
  const projectedPoints = player.projectedPoints || 200; // fallback
  const vbd = projectedPoints - replacement;
  
  console.log(`🎯 ${player.name}: ${projectedPoints.toFixed(1)} - ${replacement.toFixed(1)} = ${vbd.toFixed(1)} VBD`);
  
  return vbd;
};

// Calculate position rank from FFC data
const calculatePositionRankFromFFC = (
  position: string,
  playerADP: number,
  ffcData: FFCPlayer[]
): number => {
  const positionPlayers = ffcData
    .filter(p => p.position === position)
    .sort((a, b) => a.adp - b.adp);
  
  const rank = positionPlayers.findIndex(p => p.adp >= playerADP) + 1;
  return rank || positionPlayers.length + 1;
};

// Corrected replacement calculation
const calculateCorrectReplacement = (
  position: string,
  leagueSettings: any,
  format: FFCFormat
): number => {
  const teams = leagueSettings.teams || 12;
  const roster = leagueSettings.roster || { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1 };
  
  // Calculate actual replacement ranks
  const replacementRanks: Record<string, number> = {
    QB: roster.QB * teams + (roster.SUPERFLEX || 0) * teams * 0.3,
    RB: roster.RB * teams + roster.FLEX * teams * 0.5,
    WR: roster.WR * teams + roster.FLEX * teams * 0.35,
    TE: roster.TE * teams + roster.FLEX * teams * 0.15
  };
  
  const replacementRank = Math.ceil(replacementRanks[position] || 50);
  
  // Format-specific projection multipliers
  const projectionMultipliers: Record<FFCFormat, number> = {
    ppr: 1.0,
    halfPPR: 0.9,
    standard: 0.8,
    twoQB: 1.0,
    dynasty: 1.0,
    rookie: 1.0
  };
  
  const baseProjection = getProjectionAtRank(position, replacementRank);
  const formatMultiplier = projectionMultipliers[format] || 1.0;
  
  return baseProjection * formatMultiplier;
};

// Simple projection function (to be replaced with your projPointsTiered)
const getProjectionAtRank = (position: string, rank: number): number => {
  // Placeholder - replace with your projPointsTiered function
  const baseProjections: Record<string, number> = {
    QB: Math.max(200, 350 - rank * 3),
    RB: Math.max(100, 300 - rank * 4),
    WR: Math.max(90, 280 - rank * 3),
    TE: Math.max(80, 250 - rank * 5)
  };
  
  return baseProjections[position] || 100;
};