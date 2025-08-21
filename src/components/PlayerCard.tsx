import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, TrendingDown, Star, Info } from "lucide-react";

interface Player {
  id: string;
  name: string;
  position: string;
  team: string;
  rank: number;
  projectedPoints: number;
  lastYearPoints: number;
  adp: number;
  tier: number;
  injury?: string | { description?: string; injDate?: string; injReturnDate?: string; designation?: string };
  trending?: 'up' | 'down';
}

interface VBDBreakdown {
  rawPoints: number;
  sosMultiplier: number;
  sosAdjustedPoints: number;
  floorApplied: boolean;
  finalPoints: number;
  replacementPoints: number;
  vbd: number;
}

interface PlayerCardProps {
  player: Player;
  onDraft?: (player: Player) => void;
  onDraftByOthers?: (player: Player) => void;
  isDrafted?: boolean;
  isRecommended?: boolean;
  vbdValue?: number;
  vbdBreakdown?: VBDBreakdown | null;
  sosData?: any;
  advancedMetrics?: any;
  injuryRisk?: any;
  careerCurve?: any;
}

export function PlayerCard({ player, onDraft, onDraftByOthers, isDrafted, isRecommended, vbdValue, vbdBreakdown, sosData, advancedMetrics, injuryRisk, careerCurve }: PlayerCardProps) {
  const getPositionColor = (position: string) => {
    switch (position) {
      case 'QB': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'RB': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'WR': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'TE': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'K': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'DST': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-muted/20 text-muted-foreground border-border';
    }
  };

  const getTierColor = (tier: number) => {
    if (tier <= 1) return 'text-yellow-400';
    if (tier <= 3) return 'text-green-400';
    if (tier <= 5) return 'text-blue-400';
    return 'text-gray-400';
  };

  return (
    <Card 
      className={`relative transition-all duration-300 hover:shadow-fantasy ${
        isDrafted ? 'opacity-50 grayscale' : 'hover:scale-105'
      } ${isRecommended ? 'ring-2 ring-accent shadow-glow' : ''}`}
    >
      {isRecommended && (
        <div className="absolute -top-2 -right-2 z-10">
          <Star className="h-6 w-6 fill-accent text-accent animate-pulse" />
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-lg leading-none">{player.name}</h3>
            <p className="text-sm text-muted-foreground">{player.team}</p>
          </div>
          <div className="flex flex-col items-end space-y-1">
            <Badge className={getPositionColor(player.position)}>
              {player.position}
            </Badge>
            <span className="text-xs text-muted-foreground">#{player.rank}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Projected</p>
            <p className="font-semibold text-lg">{player.projectedPoints}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <p className="text-muted-foreground">VBD Value</p>
              {vbdBreakdown && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-64">
                      <div className="space-y-1 text-xs">
                        <div className="font-semibold">VBD Breakdown</div>
                        <div>Raw Points: {vbdBreakdown.rawPoints.toFixed(1)}</div>
                        <div>SOS Multiplier: {vbdBreakdown.sosMultiplier.toFixed(3)}</div>
                        <div>SOS Adjusted: {vbdBreakdown.sosAdjustedPoints.toFixed(1)}</div>
                        {vbdBreakdown.floorApplied && <div className="text-orange-400">Floor Applied: {vbdBreakdown.finalPoints.toFixed(1)}</div>}
                        <div className="border-t pt-1">Replacement: {vbdBreakdown.replacementPoints.toFixed(1)}</div>
                        <div className="font-semibold text-green-400">Final VBD: +{vbdBreakdown.vbd.toFixed(1)}</div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="font-semibold text-green-600">+{(vbdValue || 0).toFixed(1)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">ADP</p>
            <p className="font-semibold">{player.adp}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Tier</p>
            <p className={`font-semibold ${getTierColor(player.tier)}`}>
              {player.tier}
            </p>
          </div>
        </div>

        {/* Advanced Metrics Display */}
        <div className="flex flex-wrap gap-1 mb-2">
          {sosData && (
            <Badge variant="outline" className={`text-xs ${
              sosData.difficulty === 'Easy' ? 'border-green-300 text-green-700' :
              sosData.difficulty === 'Hard' ? 'border-red-300 text-red-700' :
              'border-yellow-300 text-yellow-700'
            }`}>
              SOS: {sosData.difficulty} (#{sosData.defensiveRank})
            </Badge>
          )}
          {injuryRisk && (
            <Badge variant="outline" className={`text-xs ${
              injuryRisk.riskLevel === 'Low' ? 'border-green-300 text-green-700' :
              injuryRisk.riskLevel === 'High' ? 'border-red-300 text-red-700' :
              'border-yellow-300 text-yellow-700'
            }`}>
              Risk: {injuryRisk.riskLevel} ({injuryRisk.careerGamesMissedPct}% missed)
            </Badge>
          )}
          {careerCurve && (
            <Badge variant="outline" className={`text-xs ${
              careerCurve.careerPhase === 'Rising' ? 'border-green-300 text-green-700' :
              careerCurve.careerPhase === 'Declining' ? 'border-red-300 text-red-700' :
              'border-blue-300 text-blue-700'
            }`}>
              {careerCurve.careerPhase} ({careerCurve.estimatedAge}y)
            </Badge>
          )}
          {advancedMetrics && ['WR', 'TE'].includes(player.position) && advancedMetrics.targetShare > 0.15 && (
            <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
              {(advancedMetrics.targetShare * 100).toFixed(0)}% Targets
            </Badge>
          )}
        </div>

        {player.injury && (
          typeof player.injury === 'string' 
            ? player.injury.trim() 
            : player.injury.description?.trim()
        ) && (
          <Badge variant="destructive" className="w-full justify-center">
            {typeof player.injury === 'string' ? player.injury : player.injury.description || 'Injured'}
          </Badge>
        )}

        <div className="space-y-2">
          {player.trending && (
            <div className="flex items-center space-x-1">
              {player.trending === 'up' ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
              <span className="text-xs text-muted-foreground">Trending</span>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onDraft?.(player)}
              disabled={isDrafted}
              className={`flex-1 ${
                isRecommended 
                  ? 'bg-accent hover:bg-accent/90 text-accent-foreground' 
                  : ''
              }`}
            >
              {isDrafted ? 'Drafted' : 'Draft'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDraftByOthers?.(player)}
              disabled={isDrafted}
              className="flex-1"
            >
              Others
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}