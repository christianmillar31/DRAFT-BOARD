import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DraftBoard } from "@/components/DraftBoard";
import { Zap, Target, BarChart3, Users, Trophy, Gamepad2 } from "lucide-react";

const Index = () => {
  const [draftStarted, setDraftStarted] = useState(false);
  const [leagueSettings, setLeagueSettings] = useState({
    teams: 12,
    rounds: 16,
    scoringType: "PPR",
    draftType: "Snake",
    draftPosition: 1,
    roster: {
      QB: 1,
      RB: 2,
      WR: 3,
      TE: 1,
      FLEX: 1,
      K: 1,
      DST: 1,
      BENCH: 6
    },
    draftStrategy: "balanced" as "value" | "balanced" | "need" | "upside"
  });

  const handleSettingsChange = (newSettings: Partial<typeof leagueSettings>) => {
    setLeagueSettings(prev => ({ ...prev, ...newSettings }));
  };

  if (draftStarted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-accent/20 rounded-lg">
                  <Gamepad2 className="h-8 w-8 text-accent" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
                    Fantasy Draft Pro
                  </h1>
                  <p className="text-muted-foreground">
                    Advanced analytics for championship teams
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setDraftStarted(false)}
              >
                End Draft
              </Button>
            </div>
          </div>
          
          <DraftBoard leagueSettings={leagueSettings} onSettingsChange={handleSettingsChange} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-primary/5" />
        <div className="container mx-auto px-4 py-24 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="flex justify-center mb-8">
              <div className="p-4 bg-accent/20 rounded-xl shadow-glow animate-float">
                <Gamepad2 className="h-16 w-16 text-accent" />
              </div>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              <span className="gradient-primary bg-clip-text text-transparent">
                Fantasy Draft
              </span>
              <br />
              <span className="text-foreground">Pro Dashboard</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Leverage advanced analytics, historical data, and real-time insights to build championship-caliber fantasy football teams with intelligent draft recommendations.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="gradient-accent text-accent-foreground hover:shadow-glow transition-all duration-300"
                onClick={() => setDraftStarted(true)}
              >
                <Zap className="mr-2 h-5 w-5" />
                Start Draft
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-accent/50 hover:bg-accent/10"
                  >
                    <BarChart3 className="mr-2 h-5 w-5" />
                    View Analytics
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Value-Based Drafting (VBD) Analytics</DialogTitle>
                    <DialogDescription>
                      Understanding how VBD works and why it gives you a competitive edge in fantasy football drafts
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 text-sm">
                    {/* What is VBD Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-primary">What is Value-Based Drafting?</h3>
                      <p className="mb-3">
                        VBD measures how much more valuable a player is compared to a "replacement level" player at their position. 
                        Instead of just looking at projected points, VBD shows you which players provide the most advantage over what you could get later in the draft.
                      </p>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="font-medium">Formula: VBD = Player's Projected Points - Replacement Level Points</p>
                      </div>
                    </div>

                    {/* Static vs Dynamic VBD */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-primary">Static vs Dynamic VBD</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                          <h4 className="font-semibold text-blue-400 mb-2">Static VBD</h4>
                          <p className="text-sm text-foreground">Uses fixed replacement levels (QB12, RB24, WR36, TE12) throughout the entire draft. Doesn't change based on who gets drafted.</p>
                        </div>
                        <div className="p-4 rounded-lg border border-green-200 dark:border-green-800">
                          <h4 className="font-semibold text-green-400 mb-2">Dynamic VBD (Recommended)</h4>
                          <p className="text-sm text-foreground">Adjusts replacement levels in real-time as players get drafted. As top RBs get taken, remaining RBs become more valuable!</p>
                        </div>
                      </div>
                    </div>

                    {/* How Dynamic VBD Works */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-primary">How Dynamic VBD Works</h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">1</div>
                          <p className="text-foreground"><strong>Tracks Draft State:</strong> Monitors which players have been drafted at each position</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">2</div>
                          <p className="text-foreground"><strong>Calculates Scarcity:</strong> As more top players get drafted, remaining players become scarcer and more valuable</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">3</div>
                          <p className="text-foreground"><strong>Adjusts Values:</strong> Increases VBD scores for remaining players at positions with high scarcity</p>
                        </div>
                      </div>
                    </div>

                    {/* Example Scenario */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-primary">Example Scenario</h3>
                      <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                        <p className="font-medium mb-2 text-foreground">Round 3: Multiple top RBs have been drafted</p>
                        <ul className="space-y-1 text-sm text-foreground">
                          <li>• <strong>Static VBD:</strong> Shows remaining RBs with same values as pre-draft</li>
                          <li>• <strong>Dynamic VBD:</strong> Boosts remaining RB values because they're now scarcer</li>
                          <li>• <strong>Result:</strong> Dynamic VBD correctly identifies that you should prioritize RBs over WRs</li>
                        </ul>
                      </div>
                    </div>

                    {/* Sort Options */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-primary">Sort Options Explained</h3>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="p-3 border rounded-lg">
                          <h4 className="font-semibold mb-1">ADP (Format-Specific)</h4>
                          <p className="text-xs text-muted-foreground">Average Draft Position from real drafts in your scoring format (PPR/Standard/Half-PPR)</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <h4 className="font-semibold mb-1 text-green-400">Dynamic VBD</h4>
                          <p className="text-xs text-muted-foreground">Real-time value considering current draft state (RECOMMENDED)</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <h4 className="font-semibold mb-1">Projected Points</h4>
                          <p className="text-xs text-muted-foreground">Season-long fantasy point projections based on your scoring settings</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <h4 className="font-semibold mb-1">Best Value</h4>
                          <p className="text-xs text-muted-foreground">Same as Dynamic VBD - finds the highest value player available across all positions</p>
                        </div>
                      </div>
                    </div>

                    {/* Data Sources */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-primary">Data Sources</h3>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="space-y-2 text-sm">
                          <div className="flex items-start gap-2">
                            <div className="text-blue-500">•</div>
                            <p className="text-foreground"><strong>ADP Data:</strong> Format-specific averages from Fantasy Football Calculator (FFC) based on thousands of real mock drafts</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="text-blue-500">•</div>
                            <p className="text-foreground"><strong>Projections:</strong> Professional analyst projections from Tank01 API, updated regularly</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="text-blue-500">•</div>
                            <p className="text-foreground"><strong>VBD Calculations:</strong> Custom algorithms that adapt to your league's roster settings and scoring format</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pro Tips */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-primary">Pro Tips</h3>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="text-green-500">✓</div>
                          <p className="text-sm text-foreground">Use Dynamic VBD as your primary sorting method</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="text-green-500">✓</div>
                          <p className="text-sm text-foreground">Check "Best Value" when deciding between positions</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="text-green-500">✓</div>
                          <p className="text-sm text-foreground">Use position filters to compare players within the same position</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="text-green-500">✓</div>
                          <p className="text-sm text-foreground">Pay attention to the VBD breakdown in player card tooltips</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="text-green-500">✓</div>
                          <p className="text-sm text-foreground">Don't draft kickers or defenses early - they have minimal VBD impact</p>
                        </div>
                      </div>
                    </div>

                    {/* Getting Started */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-primary">Getting Started</h3>
                      <div className="bg-accent/10 p-4 rounded-lg border border-accent/20">
                        <p className="mb-3 text-foreground">Ready to use advanced VBD analytics in your draft?</p>
                        <Button 
                          className="w-full" 
                          onClick={() => setDraftStarted(true)}
                        >
                          <Gamepad2 className="mr-2 h-4 w-4" />
                          Start Your Draft Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Advanced Draft Intelligence
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to dominate your fantasy league
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-fantasy transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="p-3 bg-accent/20 rounded-lg w-fit mb-4 group-hover:shadow-glow transition-all duration-300">
                  <Target className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Smart Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  AI-powered draft suggestions based on your team needs, league settings, and advanced player analytics.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-fantasy transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="p-3 bg-accent/20 rounded-lg w-fit mb-4 group-hover:shadow-glow transition-all duration-300">
                  <BarChart3 className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Historical Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Deep dive into multi-year player performance data, injury history, and trend analysis for informed decisions.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-fantasy transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="p-3 bg-accent/20 rounded-lg w-fit mb-4 group-hover:shadow-glow transition-all duration-300">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Live Draft Board</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Real-time draft tracking with team roster management and position-based recommendations.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-fantasy transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="p-3 bg-accent/20 rounded-lg w-fit mb-4 group-hover:shadow-glow transition-all duration-300">
                  <Trophy className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Custom Scoring</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Adapt to any league format with customizable scoring systems and position requirements.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-fantasy transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="p-3 bg-accent/20 rounded-lg w-fit mb-4 group-hover:shadow-glow transition-all duration-300">
                  <Zap className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Real-Time Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Stay current with live injury reports, depth chart changes, and breaking news that affects player value.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-fantasy transition-all duration-300 hover:scale-105">
              <CardHeader>
                <div className="p-3 bg-accent/20 rounded-lg w-fit mb-4 group-hover:shadow-glow transition-all duration-300">
                  <BarChart3 className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Trade Analyzer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Evaluate trade opportunities with advanced metrics and projected impact on your team's performance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-muted/20 py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-accent mb-2">2.3M+</div>
                <p className="text-muted-foreground">Player Data Points</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-accent mb-2">95%</div>
                <p className="text-muted-foreground">Prediction Accuracy</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-accent mb-2">24/7</div>
                <p className="text-muted-foreground">Live Updates</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-accent mb-2">50K+</div>
                <p className="text-muted-foreground">Championships Won</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="gradient-card p-8">
            <CardContent className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Dominate Your League?
              </h2>
              <p className="text-xl text-muted-foreground">
                Join thousands of fantasy champions using advanced analytics to build winning teams.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  className="gradient-accent text-accent-foreground hover:shadow-glow transition-all duration-300"
                  onClick={() => setDraftStarted(true)}
                >
                  <Gamepad2 className="mr-2 h-5 w-5" />
                  Start Your Draft
                </Button>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">Free Trial</Badge>
                  <Badge variant="outline">No Credit Card</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;