import { Badge } from "@/components/ui/badge";
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
  };
}

export function DraftSettings({ leagueSettings }: DraftSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Current League Settings */}
      <Card className="gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>League Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-accent" />
              <div className="text-lg font-bold">{leagueSettings.teams}</div>
              <p className="text-sm text-muted-foreground">Teams</p>
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
                <Select defaultValue="balanced">
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