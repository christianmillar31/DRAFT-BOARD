import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Settings, Clock, Users, Calculator, Save, AlertCircle, ArrowLeft } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { validateRosterConfig, VALID_ROSTER_CONFIGS } from "@/lib/roster-configs";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      SUPERFLEX?: number;
      K: number;
      DST: number;
      BENCH: number;
    };
  };
  onSettingsChange?: (settings: Partial<DraftSettingsProps['leagueSettings']>) => void;
  onBack?: () => void;
}

export function DraftSettings({ leagueSettings, onSettingsChange, onBack }: DraftSettingsProps) {
  // Local state for immediate UI updates
  const [localRosterStrings, setLocalRosterStrings] = useState(() => {
    const roster = leagueSettings.roster || {QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1, SUPERFLEX: 0, K: 1, DST: 1, BENCH: 6};
    return Object.fromEntries(Object.entries(roster).map(([k, v]) => [k, v.toString()]));
  });
  
  const [validationError, setValidationError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Convert to numbers for calculations
  const localRoster = useMemo(() => {
    return Object.fromEntries(
      Object.entries(localRosterStrings).map(([k, v]) => [k, parseInt(v) || 0])
    );
  }, [localRosterStrings]);

  // Total roster spots
  const totalRoster = Object.values(localRoster).reduce((sum, val) => sum + val, 0);
  
  // Validate on roster change
  useEffect(() => {
    const validation = validateRosterConfig(localRoster);
    setValidationError(validation.error || null);
    setHasUnsavedChanges(true);
  }, [localRoster]);

  const handleRosterChange = (position: string, value: string) => {
    setLocalRosterStrings(prev => ({...prev, [position]: value}));
  };

  const handleSave = () => {
    const validation = validateRosterConfig(localRoster);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid roster configuration');
      return;
    }
    
    // Save the settings
    onSettingsChange?.({ roster: localRoster });
    setHasUnsavedChanges(false);
    setValidationError(null);
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to go back?');
      if (!confirmed) return;
    }
    onBack?.();
  };

  // Get valid roster configs for display
  const validRosterExamples = VALID_ROSTER_CONFIGS.map(c => 
    `${c.QB}QB/${c.RB}RB/${c.WR}WR/${c.TE}TE/${c.FLEX}FLEX${c.SUPERFLEX ? `/${c.SUPERFLEX}SF` : ''}`
  );

  return (
    <div className="space-y-6">
      {/* Header with Back and Save buttons */}
      <div className="flex justify-between items-center mb-6">
        <Button variant="ghost" onClick={handleBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Draft
        </Button>
        <Button 
          onClick={handleSave} 
          className="gap-2"
          variant={hasUnsavedChanges ? "default" : "outline"}
          disabled={!!validationError}
        >
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>

      {/* Validation Error */}
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {validationError}
          </AlertDescription>
        </Alert>
      )}

      {/* League Configuration */}
      <Card>
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

      {/* Roster Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Roster Configuration</CardTitle>
          <p className="text-sm text-muted-foreground">
            Valid configurations: {validRosterExamples.join(', ')}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="QB">Quarterbacks (QB)</Label>
              <Input 
                id="QB"
                type="number" 
                min="0" 
                max="2"
                value={localRosterStrings.QB}
                onChange={(e) => handleRosterChange('QB', e.target.value)}
                className={validationError ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="RB">Running Backs (RB)</Label>
              <Input 
                id="RB"
                type="number" 
                min="0" 
                max="4"
                value={localRosterStrings.RB}
                onChange={(e) => handleRosterChange('RB', e.target.value)}
                className={validationError ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="WR">Wide Receivers (WR)</Label>
              <Input 
                id="WR"
                type="number" 
                min="0" 
                max="5"
                value={localRosterStrings.WR}
                onChange={(e) => handleRosterChange('WR', e.target.value)}
                className={validationError ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="TE">Tight Ends (TE)</Label>
              <Input 
                id="TE"
                type="number" 
                min="0" 
                max="2"
                value={localRosterStrings.TE}
                onChange={(e) => handleRosterChange('TE', e.target.value)}
                className={validationError ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="FLEX">Flex Spots</Label>
              <Input 
                id="FLEX"
                type="number" 
                min="0" 
                max="3"
                value={localRosterStrings.FLEX}
                onChange={(e) => handleRosterChange('FLEX', e.target.value)}
                className={validationError ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="SUPERFLEX">Superflex</Label>
              <Input 
                id="SUPERFLEX"
                type="number" 
                min="0" 
                max="1"
                value={localRosterStrings.SUPERFLEX || "0"}
                onChange={(e) => handleRosterChange('SUPERFLEX', e.target.value)}
                className={validationError ? "border-red-500" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="K">Kickers (K)</Label>
              <Input 
                id="K"
                type="number" 
                min="0" 
                max="2"
                value={localRosterStrings.K}
                onChange={(e) => handleRosterChange('K', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="DST">Defense/ST</Label>
              <Input 
                id="DST"
                type="number" 
                min="0" 
                max="2"
                value={localRosterStrings.DST}
                onChange={(e) => handleRosterChange('DST', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="BENCH">Bench</Label>
              <Input 
                id="BENCH"
                type="number" 
                min="0" 
                max="10"
                value={localRosterStrings.BENCH}
                onChange={(e) => handleRosterChange('BENCH', e.target.value)}
              />
            </div>
          </div>
          
          <div className="p-4 bg-accent/10 rounded-lg">
            <div className="text-lg font-semibold">Total Roster Size: {totalRoster}</div>
            <div className="text-sm text-muted-foreground">
              {totalRoster * leagueSettings.teams} total players will be drafted
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Draft Strategy */}
      <Card>
        <CardHeader>
          <CardTitle>Draft Strategy</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                onValueChange={(value) => onSettingsChange?.({ draftStrategy: value as any })}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}