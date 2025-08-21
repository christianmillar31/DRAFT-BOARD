// Simple VBD Backtest Utility
// Validates VBD system against historical data

export interface HistoricalPlayer {
  id: string;
  name: string;
  position: string;
  adp: number;
  actualPoints: number;
  year: number;
}

export interface BacktestResult {
  correlation: number;
  vbdWinRate: number;
  adpWinRate: number;
  averageRegret: number;
  summary: string;
}

// Calculate correlation between VBD and actual points above replacement
export const calculateVBDCorrelation = (
  historicalPlayers: HistoricalPlayer[],
  replacementLevels: Record<string, number>
): number => {
  const vbdValues: number[] = [];
  const actualVBD: number[] = [];
  
  historicalPlayers.forEach(player => {
    // Simple VBD estimation based on ADP (using our tiered approach)
    const estimatedPoints = estimatePointsFromADP(player.position, player.adp);
    const replacement = replacementLevels[player.position] || 100;
    const estimatedVBD = Math.max(0, estimatedPoints - replacement);
    
    // Actual VBD
    const actualPoints = player.actualPoints;
    const actualVBDValue = Math.max(0, actualPoints - replacement);
    
    vbdValues.push(estimatedVBD);
    actualVBD.push(actualVBDValue);
  });
  
  return calculateCorrelation(vbdValues, actualVBD);
};

// Simple points estimation based on ADP (matches our tiered approach)
const estimatePointsFromADP = (position: string, adp: number): number => {
  const positionRank = Math.ceil(adp / getPositionDraftRate(position));
  
  if (position === 'QB') {
    if (positionRank <= 6) return 380 - 2.0 * positionRank;
    if (positionRank <= 15) return 372 - 3.25 * positionRank;
    return 350 - 2.5 * positionRank;
  }
  if (position === 'RB') {
    if (positionRank <= 6) return 315 - 5.5 * positionRank;
    if (positionRank <= 18) return 325 - 7.0 * positionRank;
    return 235 - 2.4 * positionRank;
  }
  if (position === 'WR') {
    if (positionRank <= 8) return 290 - 4.0 * positionRank;
    if (positionRank <= 28) return 300 - 5.0 * positionRank;
    return 160 - 0.25 * positionRank;
  }
  if (position === 'TE') {
    if (positionRank <= 3) return 220 - 8.0 * positionRank;
    if (positionRank <= 10) return 215 - 6.5 * positionRank;
    return 150 - 0.5 * positionRank;
  }
  return 100;
};

const getPositionDraftRate = (position: string): number => {
  if (position === 'QB') return 15;
  if (position === 'RB') return 3.5;
  if (position === 'WR') return 3;
  if (position === 'TE') return 20;
  return 10;
};

// Calculate Pearson correlation coefficient
const calculateCorrelation = (x: number[], y: number[]): number => {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
};

// Simulate draft regret: VBD vs ADP for first 3 rounds
export const simulateDraftRegret = (
  historicalPlayers: HistoricalPlayer[],
  numberOfSimulations = 1000
): { vbdWins: number; adpWins: number; ties: number } => {
  let vbdWins = 0;
  let adpWins = 0;
  let ties = 0;
  
  const replacementLevels = { QB: 315, RB: 165, WR: 150, TE: 136 };
  
  for (let sim = 0; sim < numberOfSimulations; sim++) {
    // Randomly sample 36 players (3 rounds * 12 teams)
    const samplePlayers = [...historicalPlayers]
      .sort(() => Math.random() - 0.5)
      .slice(0, 36);
    
    // VBD strategy: pick by estimated VBD
    const vbdPicks = samplePlayers
      .map(p => ({
        ...p,
        estimatedVBD: Math.max(0, estimatePointsFromADP(p.position, p.adp) - (replacementLevels[p.position as keyof typeof replacementLevels] || 100))
      }))
      .sort((a, b) => b.estimatedVBD - a.estimatedVBD)
      .slice(0, 3);
    
    // ADP strategy: pick by ADP
    const adpPicks = samplePlayers
      .sort((a, b) => a.adp - b.adp)
      .slice(0, 3);
    
    // Calculate actual value
    const vbdValue = vbdPicks.reduce((sum, p) => sum + Math.max(0, p.actualPoints - (replacementLevels[p.position as keyof typeof replacementLevels] || 100)), 0);
    const adpValue = adpPicks.reduce((sum, p) => sum + Math.max(0, p.actualPoints - (replacementLevels[p.position as keyof typeof replacementLevels] || 100)), 0);
    
    if (vbdValue > adpValue) vbdWins++;
    else if (adpValue > vbdValue) adpWins++;
    else ties++;
  }
  
  return { vbdWins, adpWins, ties };
};

// Run full backtest
export const runBacktest = (historicalPlayers: HistoricalPlayer[]): BacktestResult => {
  const replacementLevels = { QB: 315, RB: 165, WR: 150, TE: 136 };
  
  // Calculate correlation
  const correlation = calculateVBDCorrelation(historicalPlayers, replacementLevels);
  
  // Run regret simulation
  const { vbdWins, adpWins, ties } = simulateDraftRegret(historicalPlayers);
  const totalSims = vbdWins + adpWins + ties;
  
  const vbdWinRate = vbdWins / totalSims;
  const adpWinRate = adpWins / totalSims;
  
  // Calculate average regret (simplified)
  const averageRegret = Math.abs(correlation - 0.7) * 100; // Target correlation of 0.7
  
  let summary = '';
  if (correlation > 0.6) {
    summary = `✅ Strong VBD correlation (${(correlation * 100).toFixed(1)}%)`;
  } else if (correlation > 0.4) {
    summary = `⚠️ Moderate VBD correlation (${(correlation * 100).toFixed(1)}%)`;
  } else {
    summary = `❌ Weak VBD correlation (${(correlation * 100).toFixed(1)}%)`;
  }
  
  if (vbdWinRate > 0.55) {
    summary += ` | VBD beats ADP ${(vbdWinRate * 100).toFixed(1)}% of the time ✅`;
  } else {
    summary += ` | VBD beats ADP ${(vbdWinRate * 100).toFixed(1)}% of the time ❌`;
  }
  
  return {
    correlation,
    vbdWinRate,
    adpWinRate,
    averageRegret,
    summary
  };
};

// Mock historical data for demo (in real app, this would come from API)
export const mockHistoricalData: HistoricalPlayer[] = [
  // 2023 season examples
  { id: '1', name: 'Josh Allen', position: 'QB', adp: 45, actualPoints: 387, year: 2023 },
  { id: '2', name: 'Christian McCaffrey', position: 'RB', adp: 3, actualPoints: 325, year: 2023 },
  { id: '3', name: 'Tyreek Hill', position: 'WR', adp: 8, actualPoints: 285, year: 2023 },
  { id: '4', name: 'Travis Kelce', position: 'TE', adp: 15, actualPoints: 245, year: 2023 },
  { id: '5', name: 'Derrick Henry', position: 'RB', adp: 25, actualPoints: 195, year: 2023 },
  // Add more players as needed...
];

// Quick validation function for development
export const validateVBDSystem = (): BacktestResult => {
  console.log('🧪 Running VBD Backtest...');
  const result = runBacktest(mockHistoricalData);
  console.log('📊 Backtest Results:', result);
  return result;
};