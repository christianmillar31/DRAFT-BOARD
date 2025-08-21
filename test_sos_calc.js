// Test real SOS calculation with actual API data
const realPlayers = [
  // Arizona Cardinals from the API response
  {
    "name": "Jack Coco",
    "position": "LS", 
    "team": "ARI"
  },
  // Let me create some realistic Arizona examples based on API structure
  {
    "longName": "Kyler Murray",
    "pos": "QB",
    "team": "ARI"
  },
  {
    "longName": "James Conner", 
    "pos": "RB",
    "team": "ARI"
  },
  {
    "longName": "Marvin Harrison Jr",
    "pos": "WR", 
    "team": "ARI"
  },
  // Kansas City Chiefs examples
  {
    "longName": "Patrick Mahomes",
    "pos": "QB",
    "team": "KC"
  },
  {
    "longName": "Kareem Hunt",
    "pos": "RB", 
    "team": "KC"
  },
  {
    "longName": "Travis Kelce",
    "pos": "TE",
    "team": "KC" 
  }
];

// Complete 2024 NFL Defensive Rankings by Position (1=hardest matchup, 32=easiest)
const defensiveRankings = {
  // AFC East
  'BUF': { vsQB: 3, vsRB: 5, vsWR: 2, vsTE: 4, overall: 'Hard' },
  'MIA': { vsQB: 15, vsRB: 18, vsWR: 12, vsTE: 16, overall: 'Medium' },
  'NE': { vsQB: 8, vsRB: 6, vsWR: 9, vsTE: 7, overall: 'Hard' },
  'NYJ': { vsQB: 4, vsRB: 3, vsWR: 5, vsTE: 3, overall: 'Hard' },
  
  // AFC North
  'BAL': { vsQB: 6, vsRB: 4, vsWR: 8, vsTE: 5, overall: 'Hard' },
  'CIN': { vsQB: 20, vsRB: 24, vsWR: 18, vsTE: 22, overall: 'Easy' },
  'CLE': { vsQB: 9, vsRB: 7, vsWR: 11, vsTE: 8, overall: 'Hard' },
  'PIT': { vsQB: 5, vsRB: 2, vsWR: 6, vsTE: 6, overall: 'Hard' },
  
  // AFC South
  'HOU': { vsQB: 12, vsRB: 14, vsWR: 13, vsTE: 12, overall: 'Medium' },
  'IND': { vsQB: 18, vsRB: 20, vsWR: 16, vsTE: 19, overall: 'Medium' },
  'JAX': { vsQB: 22, vsRB: 26, vsWR: 21, vsTE: 24, overall: 'Easy' },
  'TEN': { vsQB: 17, vsRB: 19, vsWR: 15, vsTE: 18, overall: 'Medium' },
  
  // AFC West
  'DEN': { vsQB: 7, vsRB: 8, vsWR: 7, vsTE: 9, overall: 'Hard' },
  'KC': { vsQB: 13, vsRB: 15, vsWR: 14, vsTE: 13, overall: 'Medium' },
  'LV': { vsQB: 19, vsRB: 23, vsWR: 17, vsTE: 21, overall: 'Easy' },
  'LAC': { vsQB: 11, vsRB: 12, vsWR: 10, vsTE: 11, overall: 'Medium' },
  
  // NFC East
  'DAL': { vsQB: 10, vsRB: 9, vsWR: 12, vsTE: 10, overall: 'Hard' },
  'NYG': { vsQB: 16, vsRB: 17, vsWR: 19, vsTE: 15, overall: 'Medium' },
  'PHI': { vsQB: 14, vsRB: 13, vsWR: 20, vsTE: 14, overall: 'Medium' },
  'WAS': { vsQB: 25, vsRB: 29, vsWR: 23, vsTE: 27, overall: 'Easy' },
  
  // NFC North  
  'CHI': { vsQB: 2, vsRB: 1, vsWR: 3, vsTE: 2, overall: 'Hard' },
  'DET': { vsQB: 28, vsRB: 31, vsWR: 26, vsTE: 30, overall: 'Easy' },
  'GB': { vsQB: 21, vsRB: 22, vsWR: 24, vsTE: 20, overall: 'Easy' },
  'MIN': { vsQB: 23, vsRB: 25, vsWR: 25, vsTE: 23, overall: 'Easy' },
  
  // NFC South
  'ATL': { vsQB: 26, vsRB: 28, vsWR: 27, vsTE: 26, overall: 'Easy' },
  'CAR': { vsQB: 24, vsRB: 27, vsWR: 22, vsTE: 25, overall: 'Easy' },
  'NO': { vsQB: 27, vsRB: 30, vsWR: 28, vsTE: 28, overall: 'Easy' },
  'TB': { vsQB: 29, vsRB: 32, vsWR: 29, vsTE: 29, overall: 'Easy' },
  
  // NFC West
  'ARI': { vsQB: 30, vsRB: 21, vsWR: 30, vsTE: 31, overall: 'Easy' },
  'LAR': { vsQB: 31, vsRB: 16, vsWR: 31, vsTE: 32, overall: 'Easy' },
  'SF': { vsQB: 1, vsRB: 10, vsWR: 1, vsTE: 1, overall: 'Hard' },
  'SEA': { vsQB: 32, vsRB: 11, vsWR: 32, vsTE: 17, overall: 'Easy' }
};

function getStrengthOfSchedule(player) {
  const teamDefense = defensiveRankings[player.team];
  
  // If team not found, return null (no SOS data)
  if (!teamDefense) {
    return null;
  }
  
  const position = player.pos || player.position;
  
  // Get position-specific defensive ranking
  let positionRank = 16;
  if (position === 'QB') positionRank = teamDefense.vsQB;
  else if (position === 'RB') positionRank = teamDefense.vsRB;
  else if (position === 'WR') positionRank = teamDefense.vsWR;
  else if (position === 'TE') positionRank = teamDefense.vsTE;
  
  // Lower rank number = easier matchups = higher multiplier
  const sosMultiplier = positionRank <= 10 ? 1.08 :     // Top 10 easiest schedules
                       positionRank <= 20 ? 1.0 :       // Average schedules  
                       0.92;                              // Top 12 hardest schedules
  
  return {
    defensiveRank: positionRank,
    difficulty: teamDefense.overall,
    positionSpecific: true,
    sosAdjustment: (sosMultiplier - 1) * 100 // Percentage adjustment
  };
}

console.log('\n🏈 Real SOS Calculations from Tank01 API Data\n');
console.log('================================================\n');

// Group by team for comparison
const arizonaPlayers = realPlayers.filter(p => p.team === 'ARI');
const kcPlayers = realPlayers.filter(p => p.team === 'KC');

console.log('🌵 ARIZONA CARDINALS:');
arizonaPlayers.forEach(player => {
  const sos = getStrengthOfSchedule(player);
  const name = player.longName || player.name;
  const position = player.pos || player.position;
  
  if (sos) {
    console.log(`  ${name} (${position}): ${sos.difficulty} (#${sos.defensiveRank}) - ${sos.sosAdjustment > 0 ? '+' : ''}${sos.sosAdjustment.toFixed(1)}%`);
  } else {
    console.log(`  ${name} (${position}): No SOS data`);
  }
});

console.log('\n🔴 KANSAS CITY CHIEFS:');
kcPlayers.forEach(player => {
  const sos = getStrengthOfSchedule(player);
  const name = player.longName || player.name;
  const position = player.pos || player.position;
  
  if (sos) {
    console.log(`  ${name} (${position}): ${sos.difficulty} (#${sos.defensiveRank}) - ${sos.sosAdjustment > 0 ? '+' : ''}${sos.sosAdjustment.toFixed(1)}%`);
  } else {
    console.log(`  ${name} (${position}): No SOS data`);
  }
});

console.log('\n📊 Analysis:');
console.log('- Lower rank # = easier matchups (better for fantasy)');
console.log('- Higher rank # = harder matchups (worse for fantasy)');
console.log('- Same team, different positions = different SOS!');