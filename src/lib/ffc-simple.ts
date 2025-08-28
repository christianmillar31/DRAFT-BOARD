// Simple FFC API Integration - Just what we need, nothing more
// Replaces Tank01 ADP with format-specific FFC ADP from real drafts

interface FFCPlayer {
  name: string;
  position: string;
  team: string;
  adp: number;
}

interface FFCResponse {
  players: FFCPlayer[];
}

// Simple fetch with 24-hour cache
export const fetchFFCADP = async (
  format: 'ppr' | 'standard' | 'half-ppr' = 'ppr',
  teams: number = 12
): Promise<FFCPlayer[] | null> => {
  const cacheKey = `ffc_adp_${format}_${teams}`;
  
  // Check cache (24 hours)
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return data;
      }
    }
  } catch (e) {
  }
  
  // Fetch fresh data
  try {
    const url = `https://fantasyfootballcalculator.com/api/v1/adp/${format}?teams=${teams}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    const data: FFCResponse = await response.json();
    
    // Cache for 24 hours
    localStorage.setItem(cacheKey, JSON.stringify({
      data: data.players,
      timestamp: Date.now()
    }));
    
    return data.players;
  } catch (error) {
    return null;
  }
};

// Simple name matching (good enough for 95% of cases)
const matchPlayer = (
  tankPlayer: any,
  ffcPlayers: FFCPlayer[]
): FFCPlayer | undefined => {
  // Try exact match first
  let match = ffcPlayers.find(p => 
    p.name.toLowerCase() === tankPlayer.name?.toLowerCase() && 
    p.position === tankPlayer.position
  );
  
  if (match) return match;
  
  // Try last name match (handles most cases)
  const lastName = tankPlayer.name?.split(' ').pop()?.toLowerCase();
  if (lastName) {
    match = ffcPlayers.find(p => 
      p.name.toLowerCase().includes(lastName) && 
      p.position === tankPlayer.position
    );
  }
  
  return match;
};

// Main enhancement function - replaces Tank01 ADP with FFC ADP
export const enhancePlayersWithFFCADP = async (
  players: any[],
  leagueSettings: any
): Promise<any[]> => {
  // Determine format based on league settings
  const format = leagueSettings.scoring?.ppr === 1 ? 'ppr' :
                 leagueSettings.scoring?.ppr === 0.5 ? 'half-ppr' :
                 'standard';
  
  const teams = leagueSettings.teams || 12;
  
  // Fetch FFC data
  const ffcData = await fetchFFCADP(format, teams);
  
  if (!ffcData || ffcData.length === 0) {
    return players;
  }
  
  // Enhance each player with FFC ADP
  let enhanced = 0;
  let notFound = 0;
  
  const enhancedPlayers = players.map(player => {
    const ffcMatch = matchPlayer(player, ffcData);
    
    if (ffcMatch) {
      enhanced++;
      return {
        ...player,
        originalADP: player.adp, // Keep Tank01 ADP for reference
        adp: ffcMatch.adp,       // Use FFC ADP for calculations
        adpSource: 'FFC',
        ffcTeam: ffcMatch.team    // Might be useful
      };
    } else {
      notFound++;
      return {
        ...player,
        adpSource: 'Tank01'
      };
    }
  });
  
  
  return enhancedPlayers;
};

// Get position rank from FFC-enhanced ADP
export const getPositionRankFromFFC = (
  player: any,
  allPlayers: any[]
): number => {
  const positionPlayers = allPlayers
    .filter(p => p.position === player.position)
    .sort((a, b) => a.adp - b.adp);
  
  const rank = positionPlayers.findIndex(p => p.id === player.id) + 1;
  return rank || positionPlayers.length + 1;
};