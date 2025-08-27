import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TANK01_API_KEY = process.env.TANK01_API_KEY || '';
const TANK01_API_HOST = 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com';
const BASE_URL = `https://${TANK01_API_HOST}`;

console.log('Tank01 API Key loaded:', TANK01_API_KEY ? `${TANK01_API_KEY.substring(0, 10)}...` : 'MISSING');

// Cache helper functions
function getCachedData() {
  try {
    const cacheFile = path.join(__dirname, '..', 'public', 'cache', 'tank01-data.json');
    if (fs.existsSync(cacheFile)) {
      const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();
      
      // If cache is less than 25 hours old, use it
      if (cacheAge < 25 * 60 * 60 * 1000) {
        console.log(`📦 Using cached data (${Math.round(cacheAge / (60 * 60 * 1000))}h old)`);
        return cacheData.data;
      } else {
        console.log(`⏰ Cache expired (${Math.round(cacheAge / (60 * 60 * 1000))}h old), fetching fresh data`);
      }
    } else {
      console.log('📦 No cache file found, fetching fresh data');
    }
  } catch (error) {
    console.error('❌ Cache read error:', error);
  }
  return null;
}

// Get stale cache data as fallback when API fails
function getStaleCacheData() {
  try {
    const cacheFile = path.join(__dirname, '..', 'public', 'cache', 'tank01-data.json');
    if (fs.existsSync(cacheFile)) {
      const cacheData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();
      console.log(`🔄 Using stale cache as API fallback (${Math.round(cacheAge / (60 * 60 * 1000))}h old)`);
      return cacheData.data;
    }
  } catch (error) {
    console.error('❌ Stale cache read error:', error);
  }
  return null;
}

interface Tank01Player {
  playerID: string;
  espnName: string;
  espnID: string;
  espnIDFull: string;
  weight: string;
  jerseyNum: string;
  cbsShortName: string;
  team: string;
  yahooPlayerID: string;
  age: string;
  espnHeadshot: string;
  pos: string;
  teamID: string;
  height: string;
  birthdate: string;
  espnLink: string;
  school: string;
  bDay: string;
  longName: string;
  stats?: {
    [key: string]: any;
  };
}

interface Tank01Game {
  gameID: string;
  gameTime: string;
  gameDate: string;
  teamIDHome: string;
  teamIDAway: string;
  teamAbvHome: string;
  teamAbvAway: string;
  teamPtsHome: string;
  teamPtsAway: string;
  gameStatus: string;
  currentPeriod: string;
  gameClock: string;
}

const tank01Headers = {
  'X-RapidAPI-Key': TANK01_API_KEY,
  'X-RapidAPI-Host': TANK01_API_HOST
};

export async function getNFLPlayers(): Promise<Tank01Player[]> {
  // Check cache first
  const cachedData = getCachedData();
  if (cachedData?.players) {
    return cachedData.players;
  }

  // Fallback to API
  try {
    console.log('🌐 Fetching fresh players data from Tank01 API');
    const response = await fetch(`${BASE_URL}/getNFLPlayerList`, {
      method: 'GET',
      headers: tank01Headers
    });

    if (!response.ok) {
      throw new Error(`Tank01 API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.body || [];
  } catch (error) {
    console.error('Error fetching NFL players from Tank01:', error);
    // Try to use stale cache as fallback
    const staleData = getStaleCacheData();
    if (staleData?.players) {
      console.log('✅ Using stale cache as fallback for players');
      return staleData.players;
    }
    return [];
  }
}

export async function getNFLGamesForWeek(week: string = 'current'): Promise<Tank01Game[]> {
  try {
    const response = await fetch(`${BASE_URL}/getNFLGamesForWeek?week=${week}`, {
      method: 'GET',
      headers: tank01Headers
    });

    if (!response.ok) {
      throw new Error(`Tank01 API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.body || [];
  } catch (error) {
    console.error('Error fetching NFL games from Tank01:', error);
    return [];
  }
}

export async function getNFLPlayerInfo(playerID: string): Promise<Tank01Player | null> {
  try {
    const response = await fetch(`${BASE_URL}/getNFLPlayerInfo?playerID=${playerID}`, {
      method: 'GET',
      headers: tank01Headers
    });

    if (!response.ok) {
      throw new Error(`Tank01 API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.body?.[0] || null;
  } catch (error) {
    console.error('Error fetching player info from Tank01:', error);
    return null;
  }
}

export async function getNFLFantasyProjections(position: string = 'all'): Promise<any[]> {
  // Check cache first
  const cachedData = getCachedData();
  if (cachedData?.projections) {
    // If requesting 'all' or 'ALL', combine all cached positions
    if (position.toLowerCase() === 'all') {
      const allProjections = [];
      for (const pos of ['QB', 'RB', 'WR', 'TE', 'K', 'DST']) {
        if (Array.isArray(cachedData.projections[pos]) && cachedData.projections[pos].length > 0) {
          allProjections.push(...cachedData.projections[pos]);
        }
      }
      if (allProjections.length > 0) {
        console.log(`📦 Using cached projections: ${allProjections.length} total players`);
        return allProjections;
      }
    } else if (Array.isArray(cachedData.projections[position]) && cachedData.projections[position].length > 0) {
      console.log(`📦 Using cached ${position} projections: ${cachedData.projections[position].length} players`);
      return cachedData.projections[position];
    }
  }

  // Fallback to API
  try {
    console.log(`🌐 Fetching fresh ${position} projections from Tank01 API`);
    const response = await fetch(`${BASE_URL}/getNFLProjections?position=${position}`, {
      method: 'GET',
      headers: tank01Headers
    });

    if (!response.ok) {
      throw new Error(`Tank01 API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    // Extract player projections from API response
    if (data.body?.playerProjections) {
      return Object.values(data.body.playerProjections);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching fantasy projections from Tank01:', error);
    // Try to use stale cache as fallback
    const staleData = getStaleCacheData();
    if (staleData?.projections) {
      console.log('✅ Using stale cache as fallback for projections');
      if (position.toLowerCase() === 'all') {
        const allProjections = [];
        for (const pos of ['QB', 'RB', 'WR', 'TE', 'K', 'DST']) {
          if (Array.isArray(staleData.projections[pos]) && staleData.projections[pos].length > 0) {
            allProjections.push(...staleData.projections[pos]);
          }
        }
        return allProjections;
      } else if (Array.isArray(staleData.projections[position])) {
        return staleData.projections[position];
      }
    }
    return [];
  }
}

export async function getNFLPlayerADP(scoringType?: string): Promise<any[]> {
  // Map scoring type to ADP type parameter
  let adpTypeParam = 'halfPPR'; // default fallback
  if (scoringType === 'Standard') {
    adpTypeParam = 'standard';
  } else if (scoringType === 'PPR') {
    adpTypeParam = 'ppr';
  } else if (scoringType === 'Half-PPR') {
    adpTypeParam = 'halfPPR';
  }

  // Check cache first (still use cached data regardless of scoring format)
  const cachedData = getCachedData();
  if (cachedData?.adp) {
    return cachedData.adp;
  }

  // Fallback to API
  try {
    console.log(`🌐 Fetching fresh ADP data from Tank01 API (${adpTypeParam})`);
    const response = await fetch(`${BASE_URL}/getNFLADP?adpType=${adpTypeParam}`, {
      method: 'GET',
      headers: tank01Headers
    });

    if (!response.ok) {
      throw new Error(`Tank01 API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.body?.adpList || [];
  } catch (error) {
    console.error('Error fetching ADP from Tank01:', error);
    // Try to use stale cache as fallback
    const staleData = getStaleCacheData();
    if (staleData?.adp) {
      console.log('✅ Using stale cache as fallback for ADP');
      return staleData.adp;
    }
    return [];
  }
}

export async function getNFLTeamRoster(teamID: string): Promise<Tank01Player[]> {
  try {
    const response = await fetch(`${BASE_URL}/getNFLTeamRoster?teamID=${teamID}`, {
      method: 'GET',
      headers: tank01Headers
    });

    if (!response.ok) {
      throw new Error(`Tank01 API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.body || [];
  } catch (error) {
    console.error('Error fetching team roster from Tank01:', error);
    return [];
  }
}

export async function getNFLPlayerGames(playerID: string, season?: string): Promise<any[]> {
  try {
    const seasonParam = season ? `&season=${season}` : '';
    const response = await fetch(`${BASE_URL}/getNFLGamesForPlayer?playerID=${playerID}${seasonParam}`, {
      method: 'GET',
      headers: tank01Headers
    });

    if (!response.ok) {
      throw new Error(`Tank01 API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.body || [];
  } catch (error) {
    console.error('Error fetching player games from Tank01:', error);
    return [];
  }
}

export async function getNFLPlayerStats(playerID: string): Promise<any> {
  try {
    const response = await fetch(`${BASE_URL}/getNFLPlayerInfo?playerID=${playerID}&getStats=true`, {
      method: 'GET',
      headers: tank01Headers
    });

    if (!response.ok) {
      throw new Error(`Tank01 API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.body?.[0] || null;
  } catch (error) {
    console.error('Error fetching player stats from Tank01:', error);
    return null;
  }
}