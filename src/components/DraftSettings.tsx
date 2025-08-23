import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Settings, Clock, Users, Calculator } from "lucide-react";

interface DraftSettingsProps {
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
  onSettingsChange?: (settings: Partial<DraftSettingsProps['leagueSettings']>) => void;
}

export function DraftSettings({ leagueSettings, onSettingsChange }: DraftSettingsProps) {
  const presets = {
    standard: {
      name: "Standard",
      roster: { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DST: 1, BENCH: 6 },
      rounds: 15
    },
    halfppr: {
      name: "Half-PPR",
      roster: { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1, K: 1, DST: 1, BENCH: 6 },
      rounds: 16
    },
    ppr: {
      name: "PPR",
      roster: { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1, K: 1, DST: 1, BENCH: 6 },
      rounds: 16
    },
    superflex: {
      name: "Superflex",
      roster: { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 2, K: 1, DST: 1, BENCH: 5 },
      rounds: 16
    },
    dynasty: {
      name: "Dynasty",
      roster: { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 2, K: 0, DST: 0, BENCH: 15 },
      rounds: 24
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Setup Presets */}
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Quick Setup</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(presets).map(([key, preset]) => (
              <Button
                key={key}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
                onClick={() => onSettingsChange?.({ 
                  roster: preset.roster,
                  rounds: preset.rounds,
                  scoringType: key === 'ppr' ? 'PPR' : 
                               key === 'halfppr' ? 'Half-PPR' :
                               key === 'standard' ? 'Standard' : 
                               key === 'superflex' ? 'Superflex' : 'Dynasty'
                })}
              >
                <span className="font-semibold">{preset.name}</span>
                <span className="text-xs text-muted-foreground text-center">
                  {preset.rounds} rounds, {Object.values(preset.roster).reduce((a, b) => a + b, 0)} roster spots
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* League Setup */}
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>League Setup</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label>Number of Teams</Label>
              <Select 
                value={leagueSettings.teams.toString()} 
                onValueChange={(value) => onSettingsChange?.({ teams: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[8, 10, 12, 14, 16].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} Teams
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Draft Rounds</Label>
              <Select 
                value={leagueSettings.rounds.toString()} 
                onValueChange={(value) => onSettingsChange?.({ rounds: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 10).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} Rounds
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Your Draft Position</Label>
              <Select 
                value={leagueSettings.draftPosition?.toString() || "1"} 
                onValueChange={(value) => onSettingsChange?.({ draftPosition: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: leagueSettings.teams }, (_, i) => i + 1).map((pos) => (
                    <SelectItem key={pos} value={pos.toString()}>
                      {pos}{pos === 1 ? 'st' : pos === 2 ? 'nd' : pos === 3 ? 'rd' : 'th'} Pick
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Draft Type</Label>
              <Select 
                value={leagueSettings.draftType} 
                onValueChange={(value) => onSettingsChange?.({ draftType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Snake">Snake Draft</SelectItem>
                  <SelectItem value="Linear">Linear Draft</SelectItem>
                  <SelectItem value="Auction">Auction Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roster Configuration */}
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Roster Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {Object.entries({
              QB: 'Quarterbacks',
              RB: 'Running Backs', 
              WR: 'Wide Receivers',
              TE: 'Tight Ends',
              FLEX: 'Flex (RB/WR/TE)',
              K: 'Kickers',
              DST: 'Defense/ST',
              BENCH: 'Bench Spots'
            }).map(([position, label]) => (
              <div key={position} className="space-y-2">
                <Label className="text-xs">{position}</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={leagueSettings.roster?.[position as keyof typeof leagueSettings.roster] || 
                    (position === 'QB' ? 1 : 
                     position === 'RB' ? 2 : 
                     position === 'WR' ? 3 : 
                     position === 'TE' ? 1 : 
                     position === 'FLEX' ? 1 : 
                     position === 'K' ? 1 : 
                     position === 'DST' ? 1 : 
                     position === 'BENCH' ? 6 : 0)}
                  onChange={(e) => {
                    const newRoster = { 
                      ...leagueSettings.roster,
                      [position]: parseInt(e.target.value) || 0 
                    };
                    const totalStarters = newRoster.QB + newRoster.RB + newRoster.WR + newRoster.TE + newRoster.FLEX + newRoster.K + newRoster.DST;
                    const totalRounds = totalStarters + newRoster.BENCH;
                    onSettingsChange?.({ 
                      roster: newRoster,
                      rounds: totalRounds
                    });
                  }}
                  className="h-8"
                />
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-background/30 rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span>Total Roster Size:</span>
              <span className="font-semibold">
                {(() => {
                  const roster = leagueSettings.roster || {QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1, K: 1, DST: 1, BENCH: 6};
                  return roster.QB + roster.RB + roster.WR + roster.TE + roster.FLEX + roster.K + roster.DST + roster.BENCH;
                })()} spots
              </span>
            </div>
            <div className="flex justify-between items-center text-sm mt-1">
              <span>Suggested Draft Rounds:</span>
              <span className="font-semibold text-accent">
                {(() => {
                  const roster = leagueSettings.roster || {QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1, K: 1, DST: 1, BENCH: 6};
                  return roster.QB + roster.RB + roster.WR + roster.TE + roster.FLEX + roster.K + roster.DST + roster.BENCH;
                })()} rounds
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current League Settings */}
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>League Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-accent" />
              <div className="text-lg font-bold">{leagueSettings.teams}</div>
              <p className="text-sm text-muted-foreground">Teams</p>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-lg font-bold text-accent">
                {leagueSettings.draftPosition || 1}
                {(leagueSettings.draftPosition || 1) === 1 ? 'st' : 
                 (leagueSettings.draftPosition || 1) === 2 ? 'nd' : 
                 (leagueSettings.draftPosition || 1) === 3 ? 'rd' : 'th'}
              </div>
              <p className="text-sm text-muted-foreground">Pick</p>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-accent" />
              <div className="text-lg font-bold">{leagueSettings.rounds}</div>
              <p className="text-sm text-muted-foreground">Rounds</p>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <Calculator className="h-6 w-6 mx-auto mb-2 text-accent" />
              <div className="text-lg font-bold">{leagueSettings.scoringType}</div>
              <p className="text-sm text-muted-foreground">Scoring</p>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <Badge variant="secondary" className="text-sm">
                {leagueSettings.draftType}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">Draft Type</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scoring Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Scoring Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-accent">Passing</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Passing Yards</Label>
                  <Input className="w-20" defaultValue="25" />
                  <span className="text-sm text-muted-foreground">per yard</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Passing TDs</Label>
                  <Input className="w-20" defaultValue="4" />
                  <span className="text-sm text-muted-foreground">points</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Interceptions</Label>
                  <Input className="w-20" defaultValue="-1" />
                  <span className="text-sm text-muted-foreground">points</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-accent">Rushing/Receiving</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Rushing/Rec Yards</Label>
                  <Input className="w-20" defaultValue="10" />
                  <span className="text-sm text-muted-foreground">per yard</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Rushing/Rec TDs</Label>
                  <Input className="w-20" defaultValue="6" />
                  <span className="text-sm text-muted-foreground">points</span>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Receptions (PPR)</Label>
                  <Input className="w-20" defaultValue="1" />
                  <span className="text-sm text-muted-foreground">points</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Draft Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Draft Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Auto-draft best available</Label>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <Label>Prioritize need over value</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>Avoid injured players</Label>
                <Switch defaultChecked />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Draft strategy</Label>
                <Select 
                  value={leagueSettings.draftStrategy || "balanced"}
                  onValueChange={(value) => onSettingsChange?.({ draftStrategy: value as "value" | "balanced" | "need" | "upside" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="value">Best Player Available</SelectItem>
                    <SelectItem value="balanced">Balanced Approach</SelectItem>
                    <SelectItem value="need">Fill Roster Needs</SelectItem>
                    <SelectItem value="upside">High Upside</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Risk tolerance</Label>
                <Select defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Conservative</SelectItem>
                    <SelectItem value="medium">Moderate</SelectItem>
                    <SelectItem value="high">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Position Targets */}
      <Card>
        <CardHeader>
          <CardTitle>Position Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['QB', 'RB', 'WR', 'TE', 'K', 'DST'].map((position) => (
              <div key={position} className="space-y-2">
                <Label>{position}</Label>
                <Input 
                  type="number" 
                  defaultValue={
                    position === 'QB' ? '2' :
                    position === 'RB' ? '4' :
                    position === 'WR' ? '5' :
                    position === 'TE' ? '2' :
                    '1'
                  }
                  min="0"
                  max="8"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}