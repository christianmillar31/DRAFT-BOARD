import { useQuery } from "@tanstack/react-query";

export interface Player {
  id: string;
  name: string;
  position: string;
  team?: string;
  rank?: number;
  projectedPoints?: number;
  lastYearPoints?: number;
  adp?: number;
  tier?: number;
  trending?: "up" | "down" | "stable";
  injury?: string;
}

export interface DraftPick {
  team: string;
  playerId: string;
  pick: number;
  round: number;
}

const API_BASE = "/api";

export const usePlayersQuery = () => {
  return useQuery<Player[]>({
    queryKey: ["players"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/players`);
      if (!response.ok) {
        throw new Error("Failed to fetch players");
      }
      return response.json();
    },
  });
};

export const useDraftQuery = () => {
  return useQuery<DraftPick[]>({
    queryKey: ["draft"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/draft`);
      if (!response.ok) {
        throw new Error("Failed to fetch draft picks");
      }
      return response.json();
    },
  });
};

export const useDraftPick = () => {
  return async (team: string, playerId: string) => {
    const response = await fetch(`${API_BASE}/draft/pick`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ team, playerId }),
    });
    
    if (!response.ok) {
      throw new Error("Failed to make draft pick");
    }
    
    return response.json();
  };
};

export const usePlayerStats = (pfrId: string, season: string) => {
  return useQuery({
    queryKey: ["playerStats", pfrId, season],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/stats/${pfrId}/${season}`);
      if (!response.ok) {
        throw new Error("Failed to fetch player stats");
      }
      return response.json();
    },
    enabled: !!pfrId && !!season,
  });
};

export const useProjections = (position: string) => {
  return useQuery({
    queryKey: ["projections", position],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/projections/${position}`);
      if (!response.ok) {
        throw new Error("Failed to fetch projections");
      }
      return response.json();
    },
    enabled: !!position,
  });
};

// Tank01 API hooks
export const useTank01Players = () => {
  return useQuery({
    queryKey: ["tank01", "players"],
    queryFn: async () => {
      console.log('🌐 Fetching Tank01 players from:', `${API_BASE}/tank01/players`);
      const response = await fetch(`${API_BASE}/tank01/players`);
      console.log('📡 Tank01 response status:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error('❌ Tank01 API error:', response.status, response.statusText);
        throw new Error(`Failed to fetch Tank01 players: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Tank01 players received:', {
        dataType: typeof data,
        isArray: Array.isArray(data),
        length: data?.length,
        firstItem: data?.[0]
      });
      
      return data;
    },
    onError: (error) => {
      console.error('🚨 Tank01 players query error:', error);
    },
    onSuccess: (data) => {
      console.log('🎉 Tank01 players query success:', data?.length, 'players');
    }
  });
};

export const useTank01ADP = () => {
  return useQuery({
    queryKey: ["tank01", "adp"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/tank01/adp`);
      if (!response.ok) {
        throw new Error("Failed to fetch Tank01 ADP");
      }
      return response.json();
    },
  });
};

export const useTank01Projections = (position: string = "all") => {
  return useQuery({
    queryKey: ["tank01", "projections", position],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/tank01/projections/${position}`);
      if (!response.ok) {
        throw new Error("Failed to fetch Tank01 projections");
      }
      return response.json();
    },
  });
};

export const useTank01Injuries = () => {
  return useQuery({
    queryKey: ["tank01", "injuries"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/tank01/injuries`);
      if (!response.ok) {
        throw new Error("Failed to fetch Tank01 injuries");
      }
      return response.json();
    },
  });
};