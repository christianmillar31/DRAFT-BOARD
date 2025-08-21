import fetch from 'node-fetch';

const TANK01_API_KEY = process.env.TANK01_API_KEY || '';
const TANK01_API_HOST = 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com';
const BASE_URL = `https://${TANK01_API_HOST}`;

console.log('Tank01 API Key loaded:', TANK01_API_KEY ? `${TANK01_API_KEY.substring(0, 10)}...` : 'MISSING');

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
  try {
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
  try {
    const response = await fetch(`${BASE_URL}/getNFLProjections?position=${position}`, {
      method: 'GET',
      headers: tank01Headers
    });

    if (!response.ok) {
      throw new Error(`Tank01 API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return data.body || [];
  } catch (error) {
    console.error('Error fetching fantasy projections from Tank01:', error);
    return [];
  }
}

export async function getNFLPlayerADP(): Promise<any[]> {
  try {
    const response = await fetch(`${BASE_URL}/getNFLADP?adpType=halfPPR`, {
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