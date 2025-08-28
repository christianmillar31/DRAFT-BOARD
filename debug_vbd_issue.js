// Debug the VBD compression issue
import { 
  replacementRank,
  replacementPoints,
  getFlexWeights,
  projPointsTiered
} from './src/lib/vbd.ts';

console.log('🔍 DEBUGGING VBD COMPRESSION ISSUE');
console.log('Achane (ADP 17) > Jefferson (ADP 5.3) in VBD = BROKEN SYSTEM');
console.log('='.repeat(60));

// Test league: 3WR/2RB/1FLEX PPR
const league = {
  teams: 12,
  roster: { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1 },
  scoring: { ppr: 1 }
};

console.log('\n📊 LEAGUE: 12-team 3WR/2RB/1TE/1FLEX PPR');

const flexWeights = getFlexWeights(league);
console.log('Flex weights:', flexWeights);

console.log('\n🎯 REPLACEMENT CALCULATIONS:');

// Calculate replacement ranks
const rbRank = replacementRank('RB', 12, league.roster, {count: 1, eligible: ['RB','WR','TE']}, flexWeights);
const wrRank = replacementRank('WR', 12, league.roster, {count: 1, eligible: ['RB','WR','TE']}, flexWeights);

console.log(`RB replacement rank: RB${rbRank} (should be ~RB28-30)`);
console.log(`WR replacement rank: WR${wrRank} (should be ~WR40-42)`);

// Calculate replacement points
const rbPoints = replacementPoints('RB', 12, league.roster, {count: 1, eligible: ['RB','WR','TE']}, flexWeights);
const wrPoints = replacementPoints('WR', 12, league.roster, {count: 1, eligible: ['RB','WR','TE']}, flexWeights);

console.log(`RB replacement points: ${rbPoints.toFixed(1)}`);
console.log(`WR replacement points: ${wrPoints.toFixed(1)}`);

console.log('\n🧮 MANUAL VERIFICATION:');
// Manual calculation for RB
const rbDedicated = league.roster.RB * league.teams; // 2 * 12 = 24
const rbFlex = flexWeights.RB * league.roster.FLEX * league.teams;
const rbTotal = rbDedicated + rbFlex;
const rbWithBuffer = Math.round(rbTotal * 1.15);
console.log(`RB Manual: ${rbDedicated} dedicated + ${rbFlex.toFixed(1)} flex = ${rbTotal.toFixed(1)} total, ${rbWithBuffer} with buffer`);

// Manual calculation for WR  
const wrDedicated = league.roster.WR * league.teams; // 3 * 12 = 36
const wrFlex = flexWeights.WR * league.roster.FLEX * league.teams;
const wrTotal = wrDedicated + wrFlex;
const wrWithBuffer = Math.round(wrTotal * 1.15);
console.log(`WR Manual: ${wrDedicated} dedicated + ${wrFlex.toFixed(1)} flex = ${wrTotal.toFixed(1)} total, ${wrWithBuffer} with buffer`);

console.log('\n📈 VBD EXAMPLES (what your system produces):');
console.log(`Bijan (297 proj): ${(297 - rbPoints).toFixed(1)} VBD`);
console.log(`CMC (265.9 proj): ${(265.9 - rbPoints).toFixed(1)} VBD`);
console.log(`Achane (267.7 proj): ${(267.7 - rbPoints).toFixed(1)} VBD`);
console.log('');
console.log(`Chase (303.3 proj): ${(303.3 - wrPoints).toFixed(1)} VBD`);
console.log(`Jefferson (261.1 proj): ${(261.1 - wrPoints).toFixed(1)} VBD`);

console.log('\n❌ PROBLEM DIAGNOSIS:');
const vbdRange = Math.max(
  (297 - rbPoints), (265.9 - rbPoints), (267.7 - rbPoints),
  (303.3 - wrPoints), (261.1 - wrPoints)
) - Math.min(
  (297 - rbPoints), (265.9 - rbPoints), (267.7 - rbPoints),
  (303.3 - wrPoints), (261.1 - wrPoints)
);

console.log(`VBD range: ${vbdRange.toFixed(1)} points (should be ~120 points)`);
console.log(`VBD compression: ${((120 - vbdRange) / 120 * 100).toFixed(0)}% too compressed`);

if (rbRank < 28 || wrRank < 40) {
  console.log('\n🚨 ROOT CAUSE: Replacement ranks too low!');
  console.log(`  RB${rbRank} should be RB28-30`);
  console.log(`  WR${wrRank} should be WR40-42`);
  console.log('  Low replacement ranks = high replacement points = compressed VBD');
} else {
  console.log('\n✅ Replacement ranks look correct');
}

if ((267.7 - rbPoints) > (261.1 - wrPoints)) {
  console.log('\n🚨 CATASTROPHIC: Achane VBD > Jefferson VBD');
  console.log('  This would draft Achane over Jefferson = league-losing decision');
}