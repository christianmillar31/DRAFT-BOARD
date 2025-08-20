import { useState, useEffect } from "react";
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
import { Search, Filter, Users, Trophy, BarChart3, AlertCircle, Undo2 } from "lucide-react";
import { 
  usePlayersQuery, 
  useDraftQuery, 
  useDraftPick,
  useTank01Players,
  useTank01ADP,
  useTank01Projections,
  useTank01Injuries
} from "@/hooks/useApi";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    team: "LAR",
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
  const { data: tank01Injuries } = useTank01Injuries();

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
            return {
              id: p.playerID || p.id || `tank01-${index}`,
              name: p.longName || p.espnName || p.name || 'Unknown Player',
              position: p.pos || p.position || 'UNKNOWN',
              team: p.team || 'FA',
              rank: realADP || (index + 1),
              projectedPoints: Math.round(Math.random() * 300 + 50), // Mock projections for now
              lastYearPoints: Math.round(Math.random() * 250 + 25),
              adp: realADP || 999,
              tier: realADP ? Math.ceil(realADP / 12) : Math.ceil((index + 1) / 50),
              injury: p.injury || undefined,
              trending: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'up' : 'down') : undefined
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
                    {myTeam.reduce((sum, p) => sum + p.projectedPoints, 0).toFixed(1)}
                  </h3>
                  <p className="text-sm text-muted-foreground">Projected Points</p>
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