import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
              <Button 
                size="lg" 
                variant="outline"
                className="border-accent/50 hover:bg-accent/10"
              >
                <BarChart3 className="mr-2 h-5 w-5" />
                View Analytics
              </Button>
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