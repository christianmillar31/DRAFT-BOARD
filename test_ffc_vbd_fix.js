// Test how FFC API fixes the VBD calculation issues
import { projPointsTiered, replacementPoints, getFlexWeights } from './src/lib/vbd.ts';

console.log('🎯 TESTING FFC DATA FIXES FOR VBD');
console.log('='.repeat(50));

async function testVBDFix() {
  try {
    // 1. Fetch FFC PPR data
    console.log('\n🌐 Fetching FFC PPR ADP data...');
    const response = await fetch('https://fantasyfootballcalculator.com/api/v1/adp/ppr?teams=12');
    const data = await response.json();
    
    // 2. Find key players
    const chase = data.players.find(p => p.name.includes('Chase'));
    const jefferson = data.players.find(p => p.name.includes('Jefferson'));
    const achane = data.players.find(p => p.name.includes('Achane'));
    const bijan = data.players.find(p => p.name.includes('Bijan'));
    const cmc = data.players.find(p => p.name.includes('McCaffrey'));
    
    console.log('\n📊 FFC ADP vs TANK01 COMPARISON:');
    console.log('Player                | FFC ADP  | Tank01 ADP | Difference');
    console.log('---------------------|----------|------------|----------');
    console.log(`Chase                | ${chase.adp.toString().padEnd(8)} | 9.1        | ${(9.1 - chase.adp).toFixed(1)}`);
    console.log(`Jefferson            | ${jefferson.adp.toString().padEnd(8)} | 5.3        | ${(5.3 - jefferson.adp).toFixed(1)}`);
    console.log(`Achane               | ${achane.adp.toString().padEnd(8)} | 17.2       | ${(17.2 - achane.adp).toFixed(1)}`);
    console.log(`Bijan                | ${bijan.adp.toString().padEnd(8)} | ~2.0       | Similar`);
    console.log(`CMC                  | ${cmc.adp.toString().padEnd(8)} | 10.8       | ${(10.8 - cmc.adp).toFixed(1)}`);
    
    // 3. Calculate position ranks from FFC data
    console.log('\n📈 POSITION RANKS FROM FFC ADP:');
    
    const wrPlayers = data.players.filter(p => p.position === 'WR').sort((a, b) => a.adp - b.adp);
    const rbPlayers = data.players.filter(p => p.position === 'RB').sort((a, b) => a.adp - b.adp);
    
    const chaseRank = wrPlayers.findIndex(p => p.name.includes('Chase')) + 1;
    const jeffersonRank = wrPlayers.findIndex(p => p.name.includes('Jefferson')) + 1;
    const achaneRank = rbPlayers.findIndex(p => p.name.includes('Achane')) + 1;
    const bijanRank = rbPlayers.findIndex(p => p.name.includes('Bijan')) + 1;
    
    console.log(`Chase: WR${chaseRank} (was using higher rank from Tank01)`);
    console.log(`Jefferson: WR${jeffersonRank} (was using higher rank from Tank01)`);  
    console.log(`Achane: RB${achaneRank} (was using lower rank from Tank01)`);
    console.log(`Bijan: RB${bijanRank}`);
    
    // 4. Calculate VBD using corrected projections and FFC ranks
    console.log('\n🧮 VBD CALCULATION WITH FFC DATA:');
    
    const league = { teams: 12, roster: { QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1 } };
    const flexWeights = getFlexWeights(league);
    
    const rbReplacement = replacementPoints('RB', 12, league.roster, {count: 1, eligible: ['RB','WR','TE']}, flexWeights);
    const wrReplacement = replacementPoints('WR', 12, league.roster, {count: 1, eligible: ['RB','WR','TE']}, flexWeights);
    
    console.log(`RB replacement: ${rbReplacement.toFixed(1)} points`);
    console.log(`WR replacement: ${wrReplacement.toFixed(1)} points`);
    
    // Use FFC ranks for projections
    const chaseProj = projPointsTiered('WR', chaseRank);
    const jeffersonProj = projPointsTiered('WR', jeffersonRank);
    const achaneProj = projPointsTiered('RB', achaneRank);
    const bijanProj = projPointsTiered('RB', bijanRank);
    
    console.log('\n📊 PROJECTED POINTS (from FFC ranks):');
    console.log(`Chase (WR${chaseRank}): ${chaseProj.toFixed(1)} points`);
    console.log(`Jefferson (WR${jeffersonRank}): ${jeffersonProj.toFixed(1)} points`);
    console.log(`Achane (RB${achaneRank}): ${achaneProj.toFixed(1)} points`);
    console.log(`Bijan (RB${bijanRank}): ${bijanProj.toFixed(1)} points`);
    
    // Calculate VBD
    const chaseVBD = chaseProj - wrReplacement;
    const jeffersonVBD = jeffersonProj - wrReplacement;
    const achaneVBD = achaneProj - rbReplacement;
    const bijanVBD = bijanProj - rbReplacement;
    
    console.log('\n🎯 VBD RANKINGS (with FFC data):');
    const vbdRankings = [
      { name: 'Chase', vbd: chaseVBD, adp: chase.adp },
      { name: 'Jefferson', vbd: jeffersonVBD, adp: jefferson.adp },
      { name: 'Achane', vbd: achaneVBD, adp: achane.adp },
      { name: 'Bijan', vbd: bijanVBD, adp: bijan.adp }
    ].sort((a, b) => b.vbd - a.vbd);
    
    vbdRankings.forEach((player, i) => {
      console.log(`${i+1}. ${player.name}: ${player.vbd.toFixed(1)} VBD (ADP ${player.adp.toFixed(1)})`);
    });
    
    console.log('\n✅ VERIFICATION:');
    if (jeffersonVBD > achaneVBD) {
      console.log(`✅ FIXED: Jefferson (${jeffersonVBD.toFixed(1)}) > Achane (${achaneVBD.toFixed(1)}) VBD`);
      console.log(`   Difference: ${(jeffersonVBD - achaneVBD).toFixed(1)} VBD points`);
    } else {
      console.log(`❌ STILL BROKEN: Achane (${achaneVBD.toFixed(1)}) > Jefferson (${jeffersonVBD.toFixed(1)}) VBD`);
    }
    
    const vbdRange = Math.max(...vbdRankings.map(p => p.vbd)) - Math.min(...vbdRankings.map(p => p.vbd));
    console.log(`📊 VBD Range: ${vbdRange.toFixed(1)} points (was ~32, should be 60+)`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testVBDFix();