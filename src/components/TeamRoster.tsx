import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Trophy, AlertTriangle } from "lucide-react";

interface TeamRosterProps {
  team: any[];
  leagueSettings: {
    teams: number;
    rounds: number;
    scoringType: string;
    draftType: string;
  };
}

export function TeamRoster({ team, leagueSettings }: TeamRosterProps) {
  const positionCounts = team.reduce((acc, player) => {
    acc[player.position] = (acc[player.position] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const positionLimits = {
    QB: { min: 1, max: 3, starter: 1 },
    RB: { min: 2, max: 6, starter: 2 },
    WR: { min: 2, max: 6, starter: 2 },
    TE: { min: 1, max: 3, starter: 1 },
    K: { min: 1, max: 2, starter: 1 },
    DST: { min: 1, max: 2, starter: 1 }
  };

  const getPositionStatus = (position: string) => {
    const count = positionCounts[position] || 0;
    const limits = positionLimits[position as keyof typeof positionLimits];
    
    if (count < limits.min) return { status: 'need', color: 'text-destructive' };
    if (count >= limits.starter) return { status: 'good', color: 'text-success' };
    return { status: 'okay', color: 'text-warning' };
  };

  const totalProjectedPoints = team.reduce((sum, player) => sum + player.projectedPoints, 0);

  return (
    <div className="space-y-6">
      {/* Team Summary */}
      <Card className="gradient-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Trophy className="h-6 w-6 text-accent" />
              <div>
                <CardTitle className="text-xl">My Team</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {team.length} / {leagueSettings.rounds} players drafted
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-accent">
                {totalProjectedPoints.toFixed(1)}
              </div>
              <p className="text-sm text-muted-foreground">Projected Points</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Position Needs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Position Breakdown</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(positionLimits).map(([position, limits]) => {
              const count = positionCounts[position] || 0;
              const status = getPositionStatus(position);
              
              return (
                <div key={position} className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center space-x-1 mb-2">
                    <h3 className="font-semibold">{position}</h3>
                    {status.status === 'need' && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div className={`text-lg font-bold ${status.color}`}>
                    {count} / {limits.max}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Need {Math.max(0, limits.min - count)} more
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Drafted Players */}
      <Card>
        <CardHeader>
          <CardTitle>Drafted Players</CardTitle>
        </CardHeader>
        <CardContent>
          {team.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No players drafted yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {team
                .sort((a, b) => a.draftedAt - b.draftedAt)
                .map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline" className="min-w-12 justify-center">
                        {player.position}
                      </Badge>
                      <div>
                        <h4 className="font-semibold">{player.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {player.team} • Pick #{player.draftedAt}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {player.projectedPoints} pts
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Rank #{player.rank}
                      </div>
                    </div>
                    {player.trending && (
                      <TrendingUp 
                        className={`h-4 w-4 ${
                          player.trending === 'up' ? 'text-success' : 'text-destructive'
                        }`} 
                      />
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}