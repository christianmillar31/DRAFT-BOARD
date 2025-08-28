// Test Fantasy Football Calculator API
console.log('🧪 TESTING FANTASY FOOTBALL CALCULATOR API');
console.log('='.repeat(50));

async function testFFCAPI() {
  try {
    // Test PPR ADP for 12-team league
    console.log('\n🌐 Fetching PPR ADP data...');
    const response = await fetch('https://fantasyfootballcalculator.com/api/v1/adp/ppr?teams=12');
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Success: ${data.players.length} players loaded`);
    
    // Show top 20 players
    console.log('\n📊 TOP 20 PPR ADP:');
    data.players
      .sort((a, b) => a.adp - b.adp)
      .slice(0, 20)
      .forEach(player => {
        console.log(`${player.adp.toFixed(1)}: ${player.name} (${player.position}, ${player.team})`);
      });
    
    // Find specific players we care about
    console.log('\n🎯 KEY PLAYERS:');
    const keyPlayers = ['Ja\'Marr Chase', 'Justin Jefferson', 'De\'Von Achane', 'Bijan Robinson', 'Christian McCaffrey'];
    
    keyPlayers.forEach(name => {
      const player = data.players.find(p => 
        p.name.toLowerCase().includes(name.toLowerCase().split(' ').pop().toLowerCase())
      );
      
      if (player) {
        console.log(`${player.name}: ADP ${player.adp.toFixed(1)} (${player.position})`);
      } else {
        console.log(`${name}: NOT FOUND`);
      }
    });
    
    // Compare formats
    console.log('\n🔄 COMPARING STANDARD vs PPR ADP...');
    const standardResponse = await fetch('https://fantasyfootballcalculator.com/api/v1/adp/standard?teams=12');
    const standardData = await standardResponse.json();
    
    console.log('Format differences for key WRs:');
    ['Chase', 'Jefferson'].forEach(lastName => {
      const pprPlayer = data.players.find(p => p.name.includes(lastName));
      const stdPlayer = standardData.players.find(p => p.name.includes(lastName));
      
      if (pprPlayer && stdPlayer) {
        const diff = stdPlayer.adp - pprPlayer.adp;
        console.log(`${pprPlayer.name}: Standard ${stdPlayer.adp.toFixed(1)} -> PPR ${pprPlayer.adp.toFixed(1)} (${diff > 0 ? '+' : ''}${diff.toFixed(1)})`);
      }
    });
    
  } catch (error) {
    console.error('❌ FFC API Test Failed:', error.message);
  }
}

testFFCAPI();