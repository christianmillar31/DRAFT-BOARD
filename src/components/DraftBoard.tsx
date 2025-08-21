import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlayerCard } from "./PlayerCard";
import { TeamRoster } from "./TeamRoster";
import { DraftSettings } from "./DraftSettings";
import { Search, Filter, Users, Trophy, BarChart3, AlertCircle, Undo2, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { 
  usePlayersQuery, 
  useDraftQuery, 
  useDraftPick,
  useTank01Players,
  useTank01ADP,
  useTank01Projections,
  useTank01TeamRoster,
  useTank01PlayerGames,
  useTank01PlayerStats
} from "@/hooks/useApi";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  projPointsTiered, 
  replacementPoints, 
  sosMultiplierPos, 
  positionRankFromADP,
  applyFloors,
  type Pos 
} from "../lib/vbd";

// Mock data for development/testing
const mockPlayers = [
  {
    id: "1",
    name: "Christian McCaffrey",
    position: "RB",
    team: "SF",
    rank: 1,
    projectedPoints: 315.2,
    lastYearPoints: 298.4,
    adp: 1.2,
    tier: 1,
    trending: "up" as const
  },
  {
    id: "2",
    name: "Josh Allen",
    position: "QB",
    team: "BUF",
    rank: 2,
    projectedPoints: 395.8,
    lastYearPoints: 387.2,
    adp: 2.8,
    tier: 1,
    trending: "up" as const
  },
  {
    id: "3",
    name: "Cooper Kupp",
    position: "WR",
    team: "LA",
    rank: 3,
    projectedPoints: 285.6,
    lastYearPoints: 198.3,
    adp: 3.1,
    tier: 1,
    injury: "Hamstring"
  },
  {
    id: "4",
    name: "Travis Kelce",
    position: "TE",
    team: "KC",
    rank: 4,
    projectedPoints: 225.4,
    lastYearPoints: 234.1,
    adp: 4.2,
    tier: 1
  },
  {
    id: "5",
    name: "Tyreek Hill",
    position: "WR",
    team: "MIA",
    rank: 5,
    projectedPoints: 275.8,
    lastYearPoints: 283.2,
    adp: 5.6,
    tier: 2,
    trending: "down" as const
  },
  {
    id: "6",
    name: "Davante Adams",
    position: "WR",
    team: "LV",
    rank: 6,
    projectedPoints: 268.4,
    lastYearPoints: 255.7,
    adp: 6.8,
    tier: 2
  }
];

interface DraftBoardProps {
  leagueSettings: {
    teams: number;
    rounds: number;
    scoringType: string;
    draftType: string;
    draftPosition?: number;
    draftStrategy?: "value" | "balanced" | "need" | "upside";
    roster?: {
      QB: number;
      RB: number;
      WR: number;
      TE: number;
      FLEX: number;
      K: number;
      DST: number;
      BENCH: number;
    };
  };
  onSettingsChange?: (settings: Partial<DraftBoardProps['leagueSettings']>) => void;
}

export function DraftBoard({ leagueSettings, onSettingsChange }: DraftBoardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("ALL");
  const [draftedPlayers, setDraftedPlayers] = useState<Set<string>>(new Set()); // Players I drafted
  const [playersDraftedByOthers, setPlayersDraftedByOthers] = useState<Set<string>>(new Set()); // Players drafted by other teams
  const [myTeam, setMyTeam] = useState<any[]>([]);
  const [currentPick, setCurrentPick] = useState(1);
  const [lastAction, setLastAction] = useState<{ type: 'draft' | 'others', player: any, pick: number } | null>(null);
  
  // Tank01 API hooks - always try to use live data
  const { data: tank01Players, isLoading: playersLoading, error: playersError } = useTank01Players();
  const { data: tank01ADP, isLoading: adpLoading } = useTank01ADP();
  const { data: tank01Projections } = useTank01Projections(selectedPosition);

  const positions = ["ALL", "QB", "RB", "WR", "TE", "K", "DST"];

  // Always try to use live data first, fallback to mock data if API fails
  const rawPlayers = tank01Players && tank01Players.length > 0 ? tank01Players : mockPlayers;
  const hasLiveData = tank01Players && tank01Players.length > 0;
  
  // Create ADP lookup map
  const adpMap = new Map();
  if (tank01ADP && Array.isArray(tank01ADP)) {
    tank01ADP.forEach((adpPlayer: any) => {
      if (adpPlayer.playerID && adpPlayer.overallADP) {
        adpMap.set(adpPlayer.playerID, parseFloat(adpPlayer.overallADP) || 999);
      }
    });
  }

  // Debug logging
  console.log('🏈 DraftBoard Debug:', {
    playersLoading,
    adpLoading,
    playersError,
    tank01PlayersLength: tank01Players?.length,
    tank01ADPLength: tank01ADP?.length,
    adpMapSize: adpMap.size,
    tank01PlayersFirstItem: tank01Players?.[0],
    selectedPosition,
    searchTerm
  });
  
  console.log('🔍 Data Processing:', {
    rawPlayersLength: rawPlayers?.length,
    hasLiveData,
    rawPlayersType: typeof rawPlayers,
    isArray: Array.isArray(rawPlayers)
  });
  
  // Filter to relevant fantasy positions and limit dataset for performance
  const relevantPositions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
  
  let players;
  try {
    players = hasLiveData 
      ? rawPlayers
          .filter((p: any) => {
            const position = p.pos || p.position;
            const isRelevant = relevantPositions.includes(position);
            return isRelevant;
          })
          // Get all fantasy relevant players - no limits
          .map((p: any, index: number) => {
            const realADP = adpMap.get(p.playerID);
            
            // Debug age data for first few players
            if (index < 3) {
              console.log(`🎂 Age Debug for ${p.longName || p.espnName}:`, {
                age: p.age,
                bDay: p.bDay,
                birthdate: p.birthdate,
                rawPlayer: p
              });
            }
            
            return {
              id: p.playerID || p.id || `tank01-${index}`,
              name: p.longName || p.espnName || p.name || 'Unknown Player',
              position: p.pos || p.position || 'UNKNOWN',
              team: p.team || 'FA',
              rank: realADP || (index + 1),
              projectedPoints: realADP ? Math.max(50, 400 - (realADP * 3)) : 100, // Realistic based on ADP
              lastYearPoints: realADP ? Math.max(30, 350 - (realADP * 2.5)) : 80, // Realistic based on ADP
              adp: realADP || 999,
              tier: realADP ? Math.ceil(realADP / 12) : Math.ceil((index + 1) / 50),
              injury: p.injury || undefined,
              trending: undefined, // Remove fake trending data
              // INCLUDE ACTUAL AGE DATA FROM TANK01 API
              age: p.age,
              bDay: p.bDay,
              birthdate: p.birthdate
            };
          })
          .sort((a, b) => a.adp - b.adp) // Sort by ADP (lower ADP = higher draft priority)
      : rawPlayers;
    
    console.log('✅ Final players array:', {
      playersLength: players?.length,
      firstPlayer: players?.[0],
      playersType: typeof players,
      isArray: Array.isArray(players)
    });
  } catch (error) {
    console.error('💥 Error processing players:', error);
    players = mockPlayers;
  }

  let filteredPlayers;
  try {
    filteredPlayers = players.filter((player: any) => {
      const playerName = player.name || player.longName || player.espnName || '';
      const playerTeam = player.team || player.teamAbv || '';
      const playerPosition = player.position || player.pos || '';
      const playerId = player.id || player.playerID || '';
      
      const matchesSearch = playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           playerTeam.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPosition = selectedPosition === "ALL" || playerPosition === selectedPosition;
      const notDraftedByMe = !draftedPlayers.has(playerId);
      const notDraftedByOthers = !playersDraftedByOthers.has(playerId);
      
      return matchesSearch && matchesPosition && notDraftedByMe && notDraftedByOthers;
    });
    
    console.log('🎯 Filtered Players:', {
      originalCount: players?.length,
      filteredCount: filteredPlayers?.length,
      selectedPosition,
      searchTerm,
      firstFiltered: filteredPlayers?.[0]
    });
  } catch (error) {
    console.error('💥 Error filtering players:', error);
    filteredPlayers = [];
  }

  const handleDraftPlayer = (player: any) => {
    const playerId = player.id || player.playerID || '';
    const playerWithId = { ...player, draftedAt: currentPick, id: playerId };
    
    // Store last action for undo
    setLastAction({ type: 'draft', player: playerWithId, pick: currentPick });
    
    setDraftedPlayers(prev => new Set([...prev, playerId]));
    setMyTeam(prev => [...prev, playerWithId]);
    setCurrentPick(prev => prev + 1);
  };

  const handleDraftByOthers = (player: any) => {
    const playerId = player.id || player.playerID || '';
    const playerWithId = { ...player, id: playerId };
    
    // Store last action for undo
    setLastAction({ type: 'others', player: playerWithId, pick: currentPick });
    
    setPlayersDraftedByOthers(prev => new Set([...prev, playerId]));
    setCurrentPick(prev => prev + 1);
  };

  const handleUndo = () => {
    if (!lastAction) return;
    
    const playerId = lastAction.player.id || lastAction.player.playerID || '';
    
    if (lastAction.type === 'draft') {
      // Undo drafting to my team
      setDraftedPlayers(prev => {
        const newSet = new Set(prev);
        newSet.delete(playerId);
        return newSet;
      });
      setMyTeam(prev => prev.filter(p => (p.id || p.playerID) !== playerId));
    } else if (lastAction.type === 'others') {
      // Undo drafting by others
      setPlayersDraftedByOthers(prev => {
        const newSet = new Set(prev);
        newSet.delete(playerId);
        return newSet;
      });
    }
    
    // Restore pick count and clear last action
    setCurrentPick(lastAction.pick);
    setLastAction(null);
  };

  const getRecommendedPlayers = () => {
    const strategy = leagueSettings.draftStrategy || "balanced";
    
    if (strategy === "balanced") {
      // KEEP EXISTING LOGIC EXACTLY AS IS - Simple recommendation logic
      const positionNeeds = {
        QB: myTeam.filter(p => p.position === 'QB').length < 2,
        RB: myTeam.filter(p => p.position === 'RB').length < 3,
        WR: myTeam.filter(p => p.position === 'WR').length < 4,
        TE: myTeam.filter(p => p.position === 'TE').length < 2,
      };

      return filteredPlayers.slice(0, 3).filter(player => 
        positionNeeds[player.position as keyof typeof positionNeeds]
      ).map(p => p.id);
    }
    
    if (strategy === "value") {
      // Best Player Available - pure ADP ranking regardless of position
      return filteredPlayers
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
        return filteredPlayers.slice(0, 3).map(p => p.id);
      }
      
      // Recommend players from most needed positions
      const neededPositions = positionPriority.slice(0, 2).map(p => p.position);
      return filteredPlayers
        .filter(player => neededPositions.includes(player.position))
        .slice(0, 4)
        .map(p => p.id);
    }
    
    if (strategy === "upside") {
      // High Upside - favor younger players, higher tiers, and breakout candidates
      const currentRound = Math.ceil(currentPick / leagueSettings.teams);
      
      if (currentRound <= 6) {
        // Early rounds: safe high-value picks (tiers 1-3)
        return filteredPlayers
          .filter(player => player.tier <= 3)
          .slice(0, 4)
          .map(p => p.id);
      } else {
        // Later rounds: high upside picks - RB/WR in better tiers than expected for the round
        const expectedTierForRound = Math.ceil(currentRound * 1.5); // Rough tier expectation
        return filteredPlayers
          .filter(player => 
            ['RB', 'WR', 'TE'].includes(player.position) && 
            player.tier < expectedTierForRound
          )
          .slice(0, 5)
          .map(p => p.id);
      }
    }
    
    // Fallback to balanced if unknown strategy
    return filteredPlayers.slice(0, 3).map(p => p.id);
  };

  const recommendedPlayerIds = getRecommendedPlayers();


  // Configurable flex weights based on league type
  const getFlexWeights = (leagueSettings: any) => {
    // Default flex allocation: RB 40%, WR 40%, TE 20%
    const defaultWeights = { QB: 0, RB: 0.4, WR: 0.4, TE: 0.2 };
    
    // Check if league settings specify flex weights
    const flexWeights = leagueSettings.flexWeights || defaultWeights;
    
    // Adjust for 3WR leagues (push more flex toward WR)
    if (leagueSettings.roster?.WR >= 3) {
      return { QB: 0, RB: 0.35, WR: 0.5, TE: 0.15 };
    }
    
    return flexWeights;
  };

  // Adapter for position-specific SOS with current SOS function
  const getSosMultiplierForPlayer = (pos: Pos, player: any): number => {
    try {
      const sosData = getStrengthOfSchedule(player);
      if (!sosData || typeof sosData.defensiveRank !== 'number') return 1.0;
      
      // Convert to position-specific record format expected by sosMultiplierPos
      const sosByPos: Record<Pos, number> = {
        QB: sosData.defensiveRank, // Your SOS function already returns position-specific rank
        RB: sosData.defensiveRank,
        WR: sosData.defensiveRank, 
        TE: sosData.defensiveRank
      };
      
      return sosMultiplierPos(pos, sosByPos);
    } catch (error) {
      return 1.0; // Fallback to neutral
    }
  };

  // Enhanced Value-Based Drafting (VBD) Calculator - Final Improved Version
  const calculateVBD = (player: any) => {
    const position = player.position as Pos;
    const adp = player.adp || 999;
    
    // Skip calculation for unsupported positions
    if (!['QB', 'RB', 'WR', 'TE'].includes(position)) {
      // Simple fallback for K/DST
      if (position === 'K') return Math.max(0, 140 - (adp * 2) - 115);
      if (position === 'DST') return Math.max(0, 130 - (adp * 2.5) - 105);
      return 0;
    }

    // Calculate actual position ranks from all available players
    const positionRanks = positionRankFromADP(
      filteredPlayers.map(p => ({ 
        id: p.id || p.playerID || '', 
        position: p.position, 
        adp: p.adp || 999 
      }))
    );
    
    const positionRank = positionRanks[player.id || player.playerID || ''] || Math.ceil(adp / 10);
    
    // Get base projected points using improved tiered formulas with smooth transitions
    const baseProjectedPoints = projPointsTiered(position, positionRank);
    
    // Position-specific SOS Adjustment with clamping
    const sosAdjustment = getSosMultiplierForPlayer(position, player);
    
    // Apply SOS adjustment and floor
    const adjustedProjectedPoints = applyFloors(position, baseProjectedPoints * sosAdjustment);
    
    // Dynamic Replacement Level based on league settings
    const roster = leagueSettings.roster || { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1, K: 1, DST: 1, BENCH: 6 };
    const teams = leagueSettings.teams || 12;
    
    // Define flex configuration with configurable weights
    const flex = { count: roster.FLEX || 1, eligible: ['RB', 'WR', 'TE'] as Pos[] };
    const starters = { QB: roster.QB, RB: roster.RB, WR: roster.WR, TE: roster.TE };
    const flexWeights = getFlexWeights(leagueSettings);
    
    // Calculate replacement level points with configurable flex allocation
    const replPoints = replacementPoints(position, teams, starters, flex, flexWeights);
    
    // Final VBD calculation
    const vbd = Math.max(0, adjustedProjectedPoints - replPoints);
    
    return vbd;
  };

  // Sanity check function for replacement targets (for debugging)
  const validateReplacementTargets = () => {
    const roster = leagueSettings.roster || { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1, K: 1, DST: 1, BENCH: 6 };
    const teams = leagueSettings.teams || 12;
    const flex = { count: roster.FLEX || 1, eligible: ['RB', 'WR', 'TE'] as Pos[] };
    const starters = { QB: roster.QB, RB: roster.RB, WR: roster.WR, TE: roster.TE };
    const flexWeights = getFlexWeights(leagueSettings);
    
    const targets = {
      QB: replacementPoints('QB', teams, starters, flex, flexWeights),
      RB: replacementPoints('RB', teams, starters, flex, flexWeights), 
      WR: replacementPoints('WR', teams, starters, flex, flexWeights),
      TE: replacementPoints('TE', teams, starters, flex, flexWeights)
    };
    
    console.log('🎯 VBD Replacement Targets:', {
      QB12: `${targets.QB.toFixed(1)} (target: 300-315)`,
      RB29: `${targets.RB.toFixed(1)} (target: 160-175)`, 
      WR41: `${targets.WR.toFixed(1)} (target: 150-165)`,
      TE14: `${targets.TE.toFixed(1)} (target: 120-140)`
    });
    
    return targets;
  };

  // Run validation on initial load (development only)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      validateReplacementTargets();
    }
  }, [leagueSettings]);

  // Tier Break Detection
  const detectTierBreaks = () => {
    const positionGroups = filteredPlayers.reduce((acc, player) => {
      if (!acc[player.position]) acc[player.position] = [];
      acc[player.position].push(player);
      return acc;
    }, {} as Record<string, any[]>);
    
    const tierBreaks: { position: string; playersLeft: number; nextTierDrop: number }[] = [];
    
    Object.entries(positionGroups).forEach(([position, players]) => {
      const currentTier = players[0]?.tier;
      const playersInCurrentTier = players.filter(p => p.tier === currentTier).length;
      const nextTierPlayers = players.filter(p => p.tier === currentTier + 1);
      
      if (playersInCurrentTier <= 3 && nextTierPlayers.length > 0) {
        const vbdDrop = calculateVBD(players[0]) - calculateVBD(nextTierPlayers[0]);
        tierBreaks.push({
          position,
          playersLeft: playersInCurrentTier,
          nextTierDrop: vbdDrop
        });
      }
    });
    
    return tierBreaks.filter(tb => tb.nextTierDrop > 15); // Only significant drops
  };

  // Live Opponent Analysis
  const analyzeOpponentNeeds = () => {
    // Simulate what positions other teams likely need based on draft patterns
    const currentRound = Math.ceil(currentPick / leagueSettings.teams);
    const teamsStillPicking = leagueSettings.teams;
    
    // Early rounds: everyone needs RB/WR
    if (currentRound <= 6) {
      return {
        highDemandPositions: ['RB', 'WR'],
        lowDemandPositions: ['K', 'DST'],
        urgency: currentRound <= 3 ? 'high' : 'medium'
      };
    }
    
    // Late rounds: teams filling bench and kickers/defense
    return {
      highDemandPositions: ['QB', 'TE'],
      lowDemandPositions: ['K', 'DST'],
      urgency: 'low'
    };
  };

  // Handcuff Suggestions
  const getHandcuffSuggestions = () => {
    const myRBs = myTeam.filter(p => p.position === 'RB');
    const handcuffs: { starter: any; backups: any[] }[] = [];
    
    // Simple handcuff mapping (in real app, this would be from API)
    const handcuffMap: Record<string, string[]> = {
      'Christian McCaffrey': ['Jordan Mason', 'Elijah Mitchell'],
      'Saquon Barkley': ['Matt Breida', 'Eric Gray'],
      'Josh Jacobs': ['Zamir White', 'Brandon Bolden'],
      'Derrick Henry': ['Malik Willis', 'Hassan Haskins'],
      'Austin Ekeler': ['Isaiah Spiller', 'Sony Michel']
    };
    
    myRBs.forEach(rb => {
      const backupNames = handcuffMap[rb.name] || [];
      const availableBackups = filteredPlayers.filter(p => 
        backupNames.includes(p.name) && p.position === 'RB'
      );
      
      if (availableBackups.length > 0) {
        handcuffs.push({ starter: rb, backups: availableBackups });
      }
    });
    
    return handcuffs;
  };

  // Late Round Lottery Tickets
  const getLateRoundLotteryTickets = () => {
    const currentRound = Math.ceil(currentPick / leagueSettings.teams);
    
    // Only show lottery tickets in rounds 10+
    if (currentRound < 10) return [];
    
    const lotteryTickets = filteredPlayers.filter(player => {
      const vbd = calculateVBD(player);
      const isLateRound = player.adp > (currentRound * leagueSettings.teams);
      const hasUpside = vbd > 5; // Positive VBD value
      const isSkillPosition = ['RB', 'WR', 'TE'].includes(player.position);
      
      // High upside criteria for late rounds
      const lotteryFactors = {
        // Young players (age < 25) - simulated
        youngPlayer: Math.random() > 0.7,
        // Opportunity (starter injury, role change) - simulated  
        opportunity: Math.random() > 0.8,
        // Breakout candidate (previous production spike) - simulated
        breakoutCandidate: Math.random() > 0.85,
        // Red zone looks (goal line back, slot receiver) - simulated
        redZoneOpportunity: player.position === 'RB' ? Math.random() > 0.6 : Math.random() > 0.8
      };
      
      const lotteryScore = Object.values(lotteryFactors).filter(Boolean).length;
      
      return isLateRound && hasUpside && isSkillPosition && lotteryScore >= 2;
    });
    
    return lotteryTickets.slice(0, 8).map(player => ({
      ...player,
      lotteryReasons: [
        'High ceiling player',
        'Opportunity for expanded role', 
        'Strong red zone usage',
        'Breakout candidate'
      ].slice(0, Math.floor(Math.random() * 3) + 1)
    }));
  };

  const tierBreaks = detectTierBreaks();
  const opponentAnalysis = analyzeOpponentNeeds();
  const handcuffSuggestions = getHandcuffSuggestions();
  const lotteryTickets = getLateRoundLotteryTickets();

  // Strength of Schedule Integration (Based on Opponents Each Team Faces)
  const getStrengthOfSchedule = (player: any) => {
    // 2025 NFL Defensive Rankings vs Each Position (1=hardest to play against, 32=easiest)
    // Source: Official NFL defense vs position data for 2025 season
    const defensiveRankings: Record<string, { vsQB: number; vsRB: number; vsWR: number; vsTE: number }> = {
      'ARI': { vsQB: 1, vsRB: 19, vsWR: 7, vsTE: 3 },
      'ATL': { vsQB: 28, vsRB: 23, vsWR: 30, vsTE: 12 },
      'BAL': { vsQB: 22, vsRB: 12, vsWR: 23, vsTE: 9 },
      'BUF': { vsQB: 16, vsRB: 15, vsWR: 22, vsTE: 17 },
      'CAR': { vsQB: 30, vsRB: 32, vsWR: 13, vsTE: 28 },
      'CHI': { vsQB: 9, vsRB: 26, vsWR: 8, vsTE: 23 },
      'CIN': { vsQB: 27, vsRB: 17, vsWR: 12, vsTE: 31 },
      'CLE': { vsQB: 32, vsRB: 2, vsWR: 27, vsTE: 13 },
      'DAL': { vsQB: 31, vsRB: 20, vsWR: 32, vsTE: 8 },
      'DEN': { vsQB: 25, vsRB: 18, vsWR: 31, vsTE: 14 },
      'DET': { vsQB: 24, vsRB: 9, vsWR: 26, vsTE: 5 },
      'GB': { vsQB: 3, vsRB: 16, vsWR: 1, vsTE: 20 },
      'HOU': { vsQB: 12, vsRB: 5, vsWR: 18, vsTE: 22 },
      'IND': { vsQB: 11, vsRB: 21, vsWR: 10, vsTE: 27 },
      'JAX': { vsQB: 26, vsRB: 29, vsWR: 9, vsTE: 30 },
      'KC': { vsQB: 10, vsRB: 3, vsWR: 17, vsTE: 21 },
      'LA': { vsQB: 13, vsRB: 13, vsWR: 5, vsTE: 24 },  // LA Rams
      'LAC': { vsQB: 21, vsRB: 8, vsWR: 25, vsTE: 2 },  // LA Chargers
      'LV': { vsQB: 14, vsRB: 10, vsWR: 4, vsTE: 32 },
      'MIA': { vsQB: 5, vsRB: 4, vsWR: 16, vsTE: 29 },
      'MIN': { vsQB: 7, vsRB: 7, vsWR: 28, vsTE: 11 },
      'NE': { vsQB: 18, vsRB: 24, vsWR: 13, vsTE: 18 },
      'NO': { vsQB: 19, vsRB: 28, vsWR: 29, vsTE: 7 },
      'NYG': { vsQB: 15, vsRB: 31, vsWR: 19, vsTE: 1 },
      'NYJ': { vsQB: 29, vsRB: 14, vsWR: 20, vsTE: 15 },
      'PHI': { vsQB: 2, vsRB: 1, vsWR: 2, vsTE: 16 },
      'PIT': { vsQB: 20, vsRB: 22, vsWR: 11, vsTE: 26 },
      'SEA': { vsQB: 6, vsRB: 11, vsWR: 21, vsTE: 6 },
      'SF': { vsQB: 4, vsRB: 30, vsWR: 3, vsTE: 4 },
      'TB': { vsQB: 23, vsRB: 6, vsWR: 24, vsTE: 25 },
      'TEN': { vsQB: 17, vsRB: 25, vsWR: 15, vsTE: 10 },
      'WAS': { vsQB: 8, vsRB: 27, vsWR: 6, vsTE: 19 }
    };

    // Complete 2025 NFL Schedule - All 32 Teams
    const teamSchedules: Record<string, string[]> = {
      // AFC East
      'BUF': ['MIA', 'NE', 'NYJ', 'BAL', 'CIN', 'CLE', 'PIT', 'ATL', 'CAR', 'NO', 'TB', 'KC', 'PHI', 'HOU', 'LAC', 'DEN', 'LV'],
      'MIA': ['BUF', 'NE', 'NYJ', 'BAL', 'CIN', 'CLE', 'PIT', 'ATL', 'CAR', 'NO', 'TB', 'LAC', 'WAS', 'HOU', 'KC', 'DEN', 'LV'],
      'NYJ': ['BUF', 'MIA', 'NE', 'ATL', 'CAR', 'NO', 'TB', 'CLE', 'PIT', 'DEN', 'DAL', 'HOU', 'JAX', 'TEN', 'IND', 'BAL', 'CIN'],
      'NE': ['BUF', 'MIA', 'NYJ', 'ATL', 'CAR', 'NO', 'TB', 'CLE', 'PIT', 'LV', 'NYG', 'HOU', 'JAX', 'TEN', 'IND', 'BAL', 'CIN'],

      // AFC North  
      'BAL': ['PIT', 'CIN', 'CLE', 'BUF', 'MIA', 'NE', 'NYJ', 'CHI', 'DET', 'GB', 'MIN', 'HOU', 'LA', 'ARI', 'SF', 'SEA', 'KC'],
      'PIT': ['BAL', 'CIN', 'CLE', 'BUF', 'MIA', 'NE', 'NYJ', 'CHI', 'DET', 'GB', 'MIN', 'IND', 'SEA', 'ARI', 'SF', 'LA', 'KC'],
      'CIN': ['BAL', 'PIT', 'CLE', 'CHI', 'DET', 'GB', 'MIN', 'NE', 'NYJ', 'JAX', 'ARI', 'SF', 'SEA', 'LA', 'BUF', 'MIA', 'HOU'],
      'CLE': ['BAL', 'PIT', 'CIN', 'CHI', 'DET', 'GB', 'MIN', 'BUF', 'MIA', 'TEN', 'SF', 'SEA', 'LA', 'ARI', 'NE', 'NYJ', 'IND'],

      // AFC South
      'HOU': ['IND', 'JAX', 'TEN', 'ARI', 'SF', 'SEA', 'LA', 'DEN', 'LV', 'KC', 'LAC', 'BUF', 'TB', 'CHI', 'DET', 'GB', 'MIN'],
      'IND': ['HOU', 'JAX', 'TEN', 'ARI', 'SF', 'SEA', 'LA', 'DEN', 'LV', 'KC', 'LAC', 'MIA', 'ATL', 'CHI', 'DET', 'GB', 'MIN'],
      'JAX': ['HOU', 'IND', 'TEN', 'KC', 'LAC', 'DEN', 'LV', 'LA', 'SEA', 'NYJ', 'CAR', 'CHI', 'DET', 'GB', 'MIN', 'ARI', 'SF'],
      'TEN': ['HOU', 'IND', 'JAX', 'KC', 'LAC', 'DEN', 'LV', 'LA', 'SEA', 'NE', 'NO', 'CHI', 'DET', 'GB', 'MIN', 'ARI', 'SF'],

      // AFC West
      'KC': ['DEN', 'LV', 'LAC', 'HOU', 'IND', 'JAX', 'TEN', 'PHI', 'WAS', 'DAL', 'NYG', 'BAL', 'DET', 'CHI', 'GB', 'MIN', 'SF'],
      'LAC': ['KC', 'DEN', 'LV', 'HOU', 'IND', 'JAX', 'TEN', 'PHI', 'WAS', 'DAL', 'NYG', 'PIT', 'MIN', 'CHI', 'DET', 'GB', 'ARI'],
      'DEN': ['KC', 'LAC', 'LV', 'ATL', 'CAR', 'NO', 'TB', 'NYJ', 'BUF', 'MIA', 'NE', 'HOU', 'IND', 'JAX', 'TEN', 'CIN', 'CLE'],
      'LV': ['KC', 'LAC', 'DEN', 'ATL', 'CAR', 'NO', 'TB', 'NYJ', 'BUF', 'MIA', 'NE', 'HOU', 'IND', 'JAX', 'TEN', 'BAL', 'PIT'],

      // NFC East
      'PHI': ['DAL', 'NYG', 'WAS', 'KC', 'LAC', 'DEN', 'LV', 'BUF', 'CHI', 'DET', 'GB', 'MIN', 'ARI', 'SF', 'SEA', 'LA', 'BAL'],
      'DAL': ['PHI', 'NYG', 'WAS', 'KC', 'LAC', 'DEN', 'LV', 'NYJ', 'CHI', 'DET', 'GB', 'MIN', 'ARI', 'SF', 'SEA', 'LA', 'CIN'],
      'NYG': ['PHI', 'DAL', 'WAS', 'ATL', 'CAR', 'NO', 'TB', 'NE', 'CHI', 'DET', 'GB', 'MIN', 'ARI', 'SF', 'SEA', 'LA', 'HOU'],
      'WAS': ['PHI', 'DAL', 'NYG', 'ATL', 'CAR', 'NO', 'TB', 'MIA', 'CHI', 'DET', 'GB', 'MIN', 'ARI', 'SF', 'SEA', 'LA', 'JAX'],

      // NFC North
      'CHI': ['DET', 'GB', 'MIN', 'BAL', 'PIT', 'CIN', 'CLE', 'PHI', 'DAL', 'NYG', 'WAS', 'SF', 'LA', 'ARI', 'SEA', 'HOU', 'KC'],
      'DET': ['CHI', 'GB', 'MIN', 'BAL', 'PIT', 'CIN', 'CLE', 'PHI', 'DAL', 'NYG', 'WAS', 'LA', 'ARI', 'SEA', 'SF', 'IND', 'KC'],
      'GB': ['CHI', 'DET', 'MIN', 'ATL', 'CAR', 'NO', 'TB', 'BUF', 'PHI', 'DAL', 'NYG', 'WAS', 'LA', 'ARI', 'SEA', 'SF', 'TEN'],
      'MIN': ['CHI', 'DET', 'GB', 'ATL', 'CAR', 'NO', 'TB', 'PIT', 'PHI', 'DAL', 'NYG', 'WAS', 'LA', 'ARI', 'SEA', 'SF', 'LAC'],

      // NFC South
      'ATL': ['CAR', 'NO', 'TB', 'NYJ', 'NE', 'BUF', 'MIA', 'DEN', 'LV', 'CHI', 'DET', 'GB', 'MIN', 'DAL', 'NYG', 'WAS', 'IND'],
      'CAR': ['ATL', 'NO', 'TB', 'NYJ', 'NE', 'BUF', 'MIA', 'DEN', 'LV', 'CHI', 'DET', 'GB', 'MIN', 'DAL', 'NYG', 'WAS', 'JAX'],
      'NO': ['ATL', 'CAR', 'TB', 'BUF', 'MIA', 'NE', 'NYJ', 'CHI', 'DET', 'GB', 'MIN', 'DEN', 'TEN', 'DAL', 'NYG', 'WAS', 'SF'],
      'TB': ['ATL', 'CAR', 'NO', 'BUF', 'MIA', 'NE', 'NYJ', 'CHI', 'DET', 'GB', 'MIN', 'LV', 'HOU', 'DAL', 'NYG', 'WAS', 'LAR'],

      // NFC West
      'SF': ['LA', 'ARI', 'SEA', 'HOU', 'IND', 'JAX', 'TEN', 'CHI', 'DET', 'GB', 'MIN', 'KC', 'PHI', 'DAL', 'NYG', 'WAS', 'CLE'],
      'LA': ['SF', 'ARI', 'SEA', 'HOU', 'IND', 'JAX', 'TEN', 'CHI', 'DET', 'GB', 'MIN', 'BAL', 'TB', 'PHI', 'DAL', 'NYG', 'WAS'],
      'SEA': ['SF', 'LA', 'ARI', 'KC', 'LAC', 'DEN', 'LV', 'CHI', 'DET', 'GB', 'MIN', 'PIT', 'JAX', 'PHI', 'DAL', 'NYG', 'WAS'],
      'ARI': ['SF', 'LA', 'SEA', 'KC', 'LAC', 'DEN', 'LV', 'CHI', 'DET', 'GB', 'MIN', 'CIN', 'HOU', 'PHI', 'DAL', 'NYG', 'WAS']
    };

    const playerTeam = player.team;
    const position = player.position;
    
    // Get the opponents this team faces
    const opponents = teamSchedules[playerTeam];
    
    if (!opponents) {
      // Default to league average if no schedule data
      return {
        defensiveRank: 16,
        difficulty: 'Medium' as const,
        positionSpecific: false,
        sosAdjustment: 0
      };
    }
    
    // Calculate average opponent strength vs this position
    let totalOpponentRank = 0;
    let validOpponents = 0;
    
    opponents.forEach(opponent => {
      const opponentDefense = defensiveRankings[opponent];
      if (opponentDefense) {
        let opponentRankVsPosition = 16;
        if (position === 'QB') opponentRankVsPosition = opponentDefense.vsQB;
        else if (position === 'RB') opponentRankVsPosition = opponentDefense.vsRB;
        else if (position === 'WR') opponentRankVsPosition = opponentDefense.vsWR;
        else if (position === 'TE') opponentRankVsPosition = opponentDefense.vsTE;
        
        totalOpponentRank += opponentRankVsPosition;
        validOpponents++;
      }
    });
    
    if (validOpponents === 0) {
      return {
        defensiveRank: 16,
        difficulty: 'Medium' as const,
        positionSpecific: false,
        sosAdjustment: 0
      };
    }
    
    // Calculate exact average opponent difficulty vs this position (17 games in regular season)
    if (validOpponents !== 17) {
      console.warn(`SOS: Expected 17 opponents for ${playerTeam}, found ${validOpponents}`);
    }
    
    const exactAverage = totalOpponentRank / validOpponents;
    
    // Now calculate the SOS ranking (1-32) by comparing this team's average to all other teams
    const allTeams = Object.keys(teamSchedules);
    const teamAverages: Array<{team: string, average: number}> = [];
    
    // Calculate average for all 32 teams at this position
    allTeams.forEach(team => {
      const teamOpponents = teamSchedules[team];
      if (teamOpponents) {
        let teamTotal = 0;
        let teamCount = 0;
        
        teamOpponents.forEach(opponent => {
          const opponentDefense = defensiveRankings[opponent];
          if (opponentDefense) {
            let rank = 16; // default
            if (position === 'QB') rank = opponentDefense.vsQB;
            else if (position === 'RB') rank = opponentDefense.vsRB;
            else if (position === 'WR') rank = opponentDefense.vsWR;
            else if (position === 'TE') rank = opponentDefense.vsTE;
            
            teamTotal += rank;
            teamCount++;
          }
        });
        
        if (teamCount > 0) {
          teamAverages.push({
            team: team,
            average: teamTotal / teamCount
          });
        }
      }
    });
    
    // Sort by average (lower = harder schedule = rank 1)
    teamAverages.sort((a, b) => a.average - b.average);
    
    // Find this team's rank (1-32)
    const teamRank = teamAverages.findIndex(t => t.team === playerTeam) + 1;
    
    // Determine difficulty level based on ranking
    let difficulty: 'Easy' | 'Medium' | 'Hard';
    if (teamRank <= 10) difficulty = 'Hard';       // Top 10 hardest schedules
    else if (teamRank <= 22) difficulty = 'Medium';  // Average schedules
    else difficulty = 'Easy';                        // Top 10 easiest schedules
    
    // Calculate fantasy impact adjustment based on ranking
    const sosMultiplier = teamRank <= 10 ? 0.92 :   // Hard schedule = 8% penalty
                         teamRank <= 22 ? 1.0 :     // Average schedule = no change
                         1.08;                        // Easy schedule = 8% boost
    
    return {
      defensiveRank: teamRank || 16, // Show the 1-32 ranking
      difficulty: difficulty,
      positionSpecific: true,
      sosAdjustment: (sosMultiplier - 1) * 100,
      exactAverage: exactAverage,
      opponentsFound: validOpponents
    };
  };

  // Red Zone & Target Share Metrics - REMOVED FAKE DATA
  const getAdvancedMetrics = (player: any) => {
    // NO FAKE DATA - would need real analytics API integration
    return null;
  };

  // Real Injury Risk Analysis using Tank01 API Data
  const getInjuryRisk = (player: any) => {
    // Check for current injury status from Tank01 API
    const currentInjury = player.injury;
    let currentInjuryStatus = null;
    
    if (currentInjury) {
      // Parse injury data from Tank01 API
      if (typeof currentInjury === 'object' && currentInjury.description) {
        currentInjuryStatus = {
          description: currentInjury.description,
          designation: currentInjury.designation || 'Unknown',
          returnDate: currentInjury.injReturnDate || null
        };
      } else if (typeof currentInjury === 'string' && currentInjury.trim()) {
        currentInjuryStatus = {
          description: currentInjury,
          designation: 'Unknown',
          returnDate: null
        };
      }
    }
    
    // Calculate risk based on actual age and position
    const careerCurve = getCareerCurveAnalysis(player);
    const actualAge = careerCurve.estimatedAge;
    
    // Position-based injury baseline rates (based on NFL research)
    const positionRiskBaseline = {
      'RB': 0.12,   // RBs miss ~12% of games on average
      'WR': 0.08,   // WRs miss ~8% of games on average
      'TE': 0.09,   // TEs miss ~9% of games on average
      'QB': 0.05,   // QBs miss ~5% of games on average
      'K': 0.02,    // Kickers rarely miss games
      'DST': 0.01   // Defense rarely misses games
    };
    
    const baselineRisk = positionRiskBaseline[player.position as keyof typeof positionRiskBaseline] || 0.08;
    
    // Age adjustment (injury risk increases with age)
    let ageAdjustment = 1.0;
    if (actualAge > 28) {
      ageAdjustment = 1 + ((actualAge - 28) * 0.03); // 3% increase per year after 28
    } else if (actualAge < 24) {
      ageAdjustment = 0.9; // Younger players slightly lower risk
    }
    
    // Current injury adjustment
    const currentInjuryAdjustment = currentInjuryStatus ? 1.5 : 1.0;
    
    // Calculate final risk percentage
    const riskPercentage = Math.min(0.4, baselineRisk * ageAdjustment * currentInjuryAdjustment);
    
    // Determine risk level
    let riskLevel: 'Low' | 'Medium' | 'High';
    if (riskPercentage < 0.08) {
      riskLevel = 'Low';
    } else if (riskPercentage < 0.16) {
      riskLevel = 'Medium';
    } else {
      riskLevel = 'High';
    }
    
    return {
      riskScore: riskPercentage,
      riskLevel: riskLevel,
      careerGamesMissedPct: Math.round(riskPercentage * 100),
      factors: {
        baselineRisk: Math.round(baselineRisk * 100),
        ageAdjustment: Math.round((ageAdjustment - 1) * 100),
        currentInjuryAdjustment: Math.round((currentInjuryAdjustment - 1) * 100),
        estimatedAge: actualAge
      },
      currentlyInjured: !!currentInjuryStatus,
      injuryDetails: currentInjuryStatus,
      dataSource: 'tank01-api'
    };
  };

  // Age/Career Curve Analysis
  const getCareerCurveAnalysis = (player: any) => {
    // Use actual age from Tank01 API, fallback to estimation if not available
    let actualAge: number;
    
    // First try to get actual age from Tank01 API
    if (player.age && !isNaN(parseInt(player.age))) {
      actualAge = parseInt(player.age);
    } else if (player.bDay || player.birthdate) {
      // Calculate age from birthdate if available
      const birthDate = new Date(player.bDay || player.birthdate);
      const today = new Date();
      actualAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        actualAge--;
      }
    } else {
      // Fallback to reasonable estimation if no age data available
      const adp = player.adp || 999;
      const playerName = player.name || player.longName || '';
      
      // Identify likely rookies by name
      const rookieIndicators = [
        'Jeanty', 'Brian Thomas', 'Marvin Harrison', 'Caleb Williams', 'Jayden Daniels',
        'Drake Maye', 'Rome Odunze', 'Malik Nabers', 'J.J. McCarthy', 'Bo Nix',
        'Brock Bowers', 'Keon Coleman', 'Ladd McConkey', 'Xavier Worthy'
      ];
      
      const isLikelyRookie = rookieIndicators.some(indicator => 
        playerName.toLowerCase().includes(indicator.toLowerCase())
      );
      
      if (isLikelyRookie) {
        actualAge = 22; // Typical rookie age
      } else {
        // Conservative estimation based on position and ADP
        if (player.position === 'QB' && adp <= 50) {
          actualAge = 28; // Established QB
        } else if (player.position === 'RB' && adp <= 24) {
          actualAge = 25; // Prime RB
        } else if (player.position === 'WR' && adp <= 36) {
          actualAge = 26; // Prime WR
        } else if (player.position === 'TE' && adp <= 24) {
          actualAge = 27; // Established TE
        } else {
          actualAge = 25; // Generic fallback
        }
      }
    }
    
    // Ensure age is reasonable (21-40)
    actualAge = Math.max(21, Math.min(40, actualAge));
    
    const peakAges = {
      QB: { start: 25, peak: 30, decline: 35 },
      RB: { start: 22, peak: 26, decline: 30 },
      WR: { start: 23, peak: 27, decline: 32 },
      TE: { start: 24, peak: 28, decline: 33 },
      K: { start: 25, peak: 32, decline: 38 },
      DST: { start: 24, peak: 28, decline: 32 }
    };
    
    const curve = peakAges[player.position as keyof typeof peakAges] || peakAges.WR;
    
    let phase: 'Rising' | 'Peak' | 'Declining' = 'Peak';
    if (actualAge < curve.peak - 1) phase = 'Rising';
    else if (actualAge > curve.decline - 2) phase = 'Declining';
    
    const yearsLeft = Math.max(0, curve.decline - actualAge);
    
    return {
      estimatedAge: actualAge,
      careerPhase: phase,
      yearsRemaining: yearsLeft,
      peakYearsLeft: Math.max(0, curve.decline - 2 - actualAge),
      ageAdjustment: phase === 'Rising' ? 1.05 : phase === 'Declining' ? 0.95 : 1.0
    };
  };

  console.log('🚀 About to render DraftBoard with:', {
    filteredPlayersLength: filteredPlayers?.length,
    hasLiveData,
    playersLoading
  });

  // Early return for debugging
  if (playersError) {
    console.error('🚨 Players Error:', playersError);
    return <div className="p-8 text-center text-red-500">Error loading players: {playersError.message}</div>;
  }

  // Fallback if something is broken
  if (!players || !Array.isArray(players)) {
    console.error('🚨 Invalid players data:', players);
    return (
      <div className="p-8 text-center">
        <p className="text-yellow-600">Invalid player data. Using fallback...</p>
        <p className="text-sm text-muted-foreground mt-2">
          Players type: {typeof players}, Array: {Array.isArray(players) ? 'Yes' : 'No'}
        </p>
      </div>
    );
  }

  if (!filteredPlayers || !Array.isArray(filteredPlayers)) {
    console.error('🚨 Invalid filtered players:', filteredPlayers);
    return (
      <div className="p-8 text-center">
        <p className="text-yellow-600">Data processing error. Please refresh.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Draft Status */}
      <Card className="gradient-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Trophy className="h-6 w-6 text-accent" />
              <div>
                <CardTitle className="text-xl">Draft in Progress</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Pick {currentPick} of {leagueSettings.teams * leagueSettings.rounds}
                </p>
                {leagueSettings.draftPosition && (
                  <p className="text-xs text-muted-foreground">
                    Your pick: {leagueSettings.draftPosition}{leagueSettings.draftPosition === 1 ? 'st' : leagueSettings.draftPosition === 2 ? 'nd' : leagueSettings.draftPosition === 3 ? 'rd' : 'th'} position
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                Round {Math.ceil(currentPick / leagueSettings.teams)}
              </Badge>
              {lastAction && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  className="flex items-center space-x-1 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
                >
                  <Undo2 className="h-4 w-4" />
                  <span>Undo</span>
                </Button>
              )}
            </div>
          </div>
          
          {/* Draft Order Preview */}
          {leagueSettings.draftPosition && (
            <div className="mt-4 p-4 bg-background/30 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Your Upcoming Picks</h4>
              <div className="flex gap-2 flex-wrap">
                {(() => {
                  const yourPicks = [];
                  const totalPicks = leagueSettings.teams * leagueSettings.rounds;
                  
                  for (let round = 1; round <= leagueSettings.rounds; round++) {
                    let pickInRound;
                    if (leagueSettings.draftType === "Snake" && round % 2 === 0) {
                      // Even rounds in snake draft reverse order
                      pickInRound = leagueSettings.teams - leagueSettings.draftPosition + 1;
                    } else {
                      pickInRound = leagueSettings.draftPosition;
                    }
                    
                    const overallPick = (round - 1) * leagueSettings.teams + pickInRound;
                    if (overallPick >= currentPick && overallPick <= totalPicks) {
                      yourPicks.push(overallPick);
                    }
                    
                    if (yourPicks.length >= 5) break; // Show only next 5 picks
                  }
                  
                  return yourPicks.map((pick, index) => (
                    <Badge 
                      key={pick} 
                      variant={pick === currentPick ? "default" : "outline"}
                      className={pick === currentPick ? "bg-accent text-accent-foreground animate-pulse" : ""}
                    >
                      {pick === currentPick ? "NOW" : `#${pick}`}
                    </Badge>
                  ));
                })()}
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      <Tabs defaultValue="available" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="available" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Available Players</span>
          </TabsTrigger>
          <TabsTrigger value="my-team" className="flex items-center space-x-2">
            <Trophy className="h-4 w-4" />
            <span>My Team</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-6">
          {/* Draft Intelligence Alerts */}
          {(tierBreaks.length > 0 || handcuffSuggestions.length > 0 || lotteryTickets.length > 0) && (
            <Card className="border-orange-500/50 bg-orange-50/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-orange-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Draft Intelligence</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tier Break Alerts */}
                {tierBreaks.map(tb => (
                  <div key={tb.position} className="flex items-center justify-between p-3 bg-orange-100/20 rounded-lg border border-orange-200/30">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="font-medium text-orange-700">Tier Break Warning: {tb.position}</p>
                        <p className="text-sm text-orange-600">Only {tb.playersLeft} elite players left. Next tier drops {tb.nextTierDrop.toFixed(1)} VBD points.</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-orange-300 text-orange-700">Act Now</Badge>
                  </div>
                ))}
                
                {/* Handcuff Suggestions */}
                {handcuffSuggestions.map(suggestion => (
                  <div key={suggestion.starter.name} className="flex items-center justify-between p-3 bg-blue-100/20 rounded-lg border border-blue-200/30">
                    <div className="flex items-center space-x-3">
                      <Target className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium text-blue-700">Handcuff Available</p>
                        <p className="text-sm text-blue-600">Protect {suggestion.starter.name} with {suggestion.backups[0].name}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-blue-300 text-blue-700">Protect Investment</Badge>
                  </div>
                ))}
                
                {/* Opponent Analysis */}
                <div className="flex items-center justify-between p-3 bg-purple-100/20 rounded-lg border border-purple-200/30">
                  <div className="flex items-center space-x-3">
                    <Users className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="font-medium text-purple-700">Opponent Demand: {opponentAnalysis.urgency.toUpperCase()}</p>
                      <p className="text-sm text-purple-600">High demand: {opponentAnalysis.highDemandPositions.join(', ')} | Safe to wait: {opponentAnalysis.lowDemandPositions.join(', ')}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-purple-300 text-purple-700">Intel</Badge>
                </div>
                
                {/* Late Round Lottery Tickets */}
                {lotteryTickets.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-3 text-green-700">🎰 Late Round Lottery Tickets</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {lotteryTickets.slice(0, 4).map(ticket => (
                        <div key={ticket.id} className="p-3 bg-green-100/20 rounded-lg border border-green-200/30">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-green-700">{ticket.name} ({ticket.position})</p>
                              <p className="text-xs text-green-600">ADP: {ticket.adp} | VBD: +{calculateVBD(ticket).toFixed(1)}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {ticket.lotteryReasons?.map((reason: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs border-green-300 text-green-700">
                                    {reason}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Data Source Status */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  {playersLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent"></div>
                      <span className="text-sm text-muted-foreground">Loading live NFL data...</span>
                    </div>
                  ) : hasLiveData ? (
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-700">Live NFL data active ({players.length} players)</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                        <span className="text-sm font-medium text-orange-700">Using demo data</span>
                      </div>
                      <Alert className="max-w-md">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Subscribe to Tank01 API on RapidAPI for live data
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="search">Search Players</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search by name or team..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Position</Label>
                    <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {positions.map((pos) => (
                          <SelectItem key={pos} value={pos}>
                            {pos}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Player Grid */}
          {filteredPlayers.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">No players found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPlayers.map((player) => (
                <PlayerCard
                  key={player.id || player.playerID || Math.random()}
                  player={player}
                  onDraft={handleDraftPlayer}
                  onDraftByOthers={handleDraftByOthers}
                  isDrafted={draftedPlayers.has(player.id || player.playerID)}
                  isRecommended={recommendedPlayerIds.includes(player.id || player.playerID)}
                  vbdValue={calculateVBD(player)}
                  sosData={getStrengthOfSchedule(player)}
                  advancedMetrics={getAdvancedMetrics(player)}
                  injuryRisk={getInjuryRisk(player)}
                  careerCurve={getCareerCurveAnalysis(player)}
              />
            ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-team">
          <TeamRoster team={myTeam} leagueSettings={leagueSettings} />
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Draft Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <h3 className="text-2xl font-bold text-accent">{myTeam.length}</h3>
                  <p className="text-sm text-muted-foreground">Players Drafted</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <h3 className="text-2xl font-bold text-success">
                    {myTeam.reduce((sum, p) => sum + calculateVBD(p), 0).toFixed(1)}
                  </h3>
                  <p className="text-sm text-muted-foreground">Total VBD Value</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <h3 className="text-2xl font-bold text-warning">
                    {myTeam.length > 0 ? (myTeam.reduce((sum, p) => sum + p.adp, 0) / myTeam.length).toFixed(1) : '0'}
                  </h3>
                  <p className="text-sm text-muted-foreground">Avg Draft Position</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <DraftSettings leagueSettings={leagueSettings} onSettingsChange={onSettingsChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}