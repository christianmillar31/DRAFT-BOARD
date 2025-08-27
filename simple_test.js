// Simple test of core VBD fixes
import { 
  calculateDynamicFlexWeights, 
  replacementRank
} from './src/lib/vbd.ts';

// Test league: 2WR/2FLEX (the problematic format)
const testLeague = {
  teams: 12,
  roster: {
    QB: 1,
    RB: 2, 
    WR: 2,  // Only 2 dedicated WR slots
    TE: 1,
    FLEX: 2  // 2 flex slots
  }
};

console.log('🧪 TESTING CRITICAL VBD FIXES');
console.log('='.repeat(40));

// Test 1: Flex weight calculation
console.log('\n1️⃣ PROPORTIONAL FLEX WEIGHTS:');
const flexWeights = calculateDynamicFlexWeights(testLeague);
console.log('Result:', flexWeights);
console.log(`WR flex weight: ${(flexWeights.WR * 100).toFixed(1)}% (should be ~50-60%)`);

// Test 2: WR replacement rank (THE CRITICAL FIX)
console.log('\n2️⃣ WR REPLACEMENT RANK:');
const wrRank = replacementRank(
  'WR',
  testLeague.teams,
  testLeague.roster,
  { count: testLeague.roster.FLEX, eligible: ['RB', 'WR', 'TE'] },
  flexWeights
);

console.log(`WR replacement rank: ${wrRank}`);
console.log('Expected: ~30-34 for 2WR/2FLEX format');
console.log('OLD BROKEN: Would have been ~24, causing massive WR undervaluation');

// Test 3: Compare to RB replacement
const rbRank = replacementRank(
  'RB',
  testLeague.teams,
  testLeague.roster,
  { count: testLeague.roster.FLEX, eligible: ['RB', 'WR', 'TE'] },
  flexWeights
);

console.log(`\nRB replacement rank: ${rbRank}`);
console.log(`Difference: WR${wrRank} vs RB${rbRank}`);

console.log('\n' + '='.repeat(40));
console.log('✅ CRITICAL FIX STATUS:');
console.log(`   WR replacement properly accounts for 2WR format: ${wrRank > 28 ? 'SUCCESS' : 'NEEDS MORE WORK'}`);
console.log(`   WR flex weight reasonable for 2WR/2FLEX: ${flexWeights.WR > 0.5 ? 'SUCCESS' : 'NEEDS MORE WORK'}`);