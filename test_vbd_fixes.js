// Test VBD fixes for non-standard formats (2WR/2FLEX)
import { 
  calculateDynamicFlexWeights, 
  replacementRank, 
  calculateBEERPlus, 
  calculateBEERPlusScore,
  applyPPRConversion 
} from './src/lib/vbd.ts';

// Test league configuration: 2WR/2FLEX (the problematic format)
const testLeague = {
  teams: 12,
  roster: {
    QB: 1,
    RB: 2, 
    WR: 2,  // Critical: only 2 dedicated WR slots
    TE: 1,
    FLEX: 2  // Critical: 2 flex slots
  },
  scoring: {
    ppr: 0.5  // Half-PPR
  }
};

console.log('🧪 TESTING VBD FIXES FOR 2WR/2FLEX FORMAT');
console.log('='.repeat(50));

// Test 1: Flex weight calculation
console.log('\n1️⃣  TESTING PROPORTIONAL FLEX WEIGHTS');
const flexWeights = calculateDynamicFlexWeights(testLeague);
console.log('Expected: WR should get significant flex allocation (~40-60%)');
console.log('Actual flex weights:', flexWeights);

// Test 2: Replacement rank calculation  
console.log('\n2️⃣  TESTING REPLACEMENT RANKS');
const positions = ['QB', 'RB', 'WR', 'TE'];
positions.forEach(pos => {
  const rank = replacementRank(
    pos,
    testLeague.teams,
    testLeague.roster,
    { count: testLeague.roster.FLEX, eligible: ['RB', 'WR', 'TE'] },
    flexWeights
  );
  console.log(`${pos} replacement rank: ${rank} (12-team 2WR/2FLEX)`);
});

// Test 3: PPR conversion
console.log('\n3️⃣  TESTING PPR CONVERSION');
const testPoints = 250;
positions.forEach(pos => {
  const converted = applyPPRConversion(pos, testPoints, 'half-ppr');
  const multiplier = (converted / testPoints).toFixed(3);
  console.log(`${pos}: ${testPoints} -> ${converted.toFixed(1)} (${multiplier}x)`);
});

// Test 4: Mock BEER+ calculation for WR1 vs RB22
console.log('\n4️⃣  TESTING WR1 vs RB22 VALUATION');

const mockWR1 = {
  id: 'wr1',
  position: 'WR',
  adp: 9.1,
  projectedPoints: 280
};

const mockRB22 = {
  id: 'rb22', 
  position: 'RB',
  adp: 65.0,
  projectedPoints: 180
};

const mockPlayers = [mockWR1, mockRB22];

const wr1Components = calculateBEERPlus(
  mockWR1,
  mockPlayers,
  null,
  testLeague.teams,
  testLeague.roster,
  { count: testLeague.roster.FLEX, eligible: ['RB', 'WR', 'TE'] },
  flexWeights,
  'half-ppr'
);

const rb22Components = calculateBEERPlus(
  mockRB22,
  mockPlayers,
  null,
  testLeague.teams,
  testLeague.roster,
  { count: testLeague.roster.FLEX, eligible: ['RB', 'WR', 'TE'] },
  flexWeights,
  'half-ppr'
);

const wr1Score = calculateBEERPlusScore(wr1Components);
const rb22Score = calculateBEERPlusScore(rb22Components);

console.log('WR1 (Chase) components:', wr1Components);
console.log('WR1 BEER+ Score:', wr1Score.toFixed(2));
console.log();
console.log('RB22 components:', rb22Components);
console.log('RB22 BEER+ Score:', rb22Score.toFixed(2));
console.log();
console.log(`✅ RESULT: WR1 ${wr1Score > rb22Score ? 'PROPERLY' : 'STILL'} outranks RB22`);
console.log(`   Score difference: ${(wr1Score - rb22Score).toFixed(2)}`);

console.log('\n' + '='.repeat(50));
console.log('🎯 CRITICAL FIX VERIFICATION:');
console.log(`   WR replacement rank: ${replacementRank('WR', 12, testLeague.roster, {count: 2, eligible: ['RB','WR','TE']}, flexWeights)}`);
console.log(`   Expected ~30-34 for 2WR/2FLEX (was ~24 causing undervaluation)`);