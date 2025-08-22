const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
const TANK01_API_KEY = process.env.TANK01_API_KEY;
const TANK01_HOST = 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com';

if (!TANK01_API_KEY) {
  console.error('❌ Missing TANK01_API_KEY environment variable');
  process.exit(1);
}

const headers = {
  'X-RapidAPI-Key': TANK01_API_KEY,
  'X-RapidAPI-Host': TANK01_HOST
};

async function fetchAndCache() {
  console.log('🚀 Starting daily cache update...');
  
  const cacheData = {
    timestamp: new Date().toISOString(),
    lastUpdated: new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
    data: {}
  };

  try {
    // 1. Fetch all players
    console.log('📥 Fetching NFL players...');
    const playersResponse = await fetch(`https://${TANK01_HOST}/getNFLPlayerList`, { headers });
    const playersData = await playersResponse.json();
    cacheData.data.players = playersData.body || [];
    console.log(`✅ Fetched ${cacheData.data.players.length} players`);

    // 2. Fetch ADP data
    console.log('📥 Fetching ADP data...');
    const adpResponse = await fetch(`https://${TANK01_HOST}/getNFLADP?adpType=halfPPR`, { headers });
    const adpData = await adpResponse.json();
    cacheData.data.adp = adpData.body?.adpList || [];
    console.log(`✅ Fetched ${cacheData.data.adp.length} ADP entries`);

    // 3. Fetch projections for each position
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'DST'];
    cacheData.data.projections = {};
    
    for (const pos of positions) {
      console.log(`📥 Fetching ${pos} projections...`);
      const projResponse = await fetch(`https://${TANK01_HOST}/getNFLProjections?position=${pos}`, { headers });
      const projData = await projResponse.json();
      cacheData.data.projections[pos] = projData.body || [];
      console.log(`✅ Fetched ${cacheData.data.projections[pos].length} ${pos} projections`);
    }

    // 4. Write to cache file
    const cacheDir = path.join(__dirname, '..', 'public', 'cache');
    await fs.mkdir(cacheDir, { recursive: true });
    
    const cacheFile = path.join(cacheDir, 'tank01-data.json');
    await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
    
    console.log('✅ Cache updated successfully!');
    console.log(`📁 Cache file: ${cacheFile}`);
    console.log(`🕐 Last updated: ${cacheData.lastUpdated} PST`);
    
    // Also create a smaller metadata file
    const metaFile = path.join(cacheDir, 'cache-meta.json');
    await fs.writeFile(metaFile, JSON.stringify({
      lastUpdated: cacheData.timestamp,
      lastUpdatedPST: cacheData.lastUpdated,
      playerCount: cacheData.data.players.length,
      adpCount: cacheData.data.adp.length
    }, null, 2));

  } catch (error) {
    console.error('❌ Error updating cache:', error);
    process.exit(1);
  }
}

// Run the cache update
fetchAndCache();