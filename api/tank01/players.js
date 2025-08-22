export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // First, try to serve from cache
    console.log('📁 Attempting to serve players from cache...');
    
    const cacheUrl = `${req.headers.origin || 'https://draftboardlive.online'}/cache/tank01-data.json`;
    
    try {
      const cacheResponse = await fetch(cacheUrl);
      if (cacheResponse.ok) {
        const cacheData = await cacheResponse.json();
        
        // Check if cache is less than 25 hours old
        const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();
        const maxAge = 25 * 60 * 60 * 1000; // 25 hours
        
        if (cacheAge < maxAge && cacheData.data && Array.isArray(cacheData.data.players) && cacheData.data.players.length > 0) {
          console.log(`📦 CACHE HIT: Serving ${cacheData.data.players.length} players from cache (age: ${Math.round(cacheAge / 1000 / 60)} minutes)`);
          res.setHeader('X-Data-Source', 'cache');
          res.setHeader('X-Cache-Age-Minutes', Math.round(cacheAge / 1000 / 60));
          res.status(200).json(cacheData.data.players);
          return;
        } else {
          console.log('⚠️ Cache exists but is stale or invalid format - age:', Math.round(cacheAge / 1000 / 60), 'minutes');
        }
      }
    } catch (cacheError) {
      console.log('⚠️ Cache not available, falling back to API:', cacheError.message);
    }

    // STOP: Cache should always work in production
    console.error('❌ CACHE MISS: Players API should never hit Tank01 in production');
    res.status(503).json({ 
      error: 'Cache service unavailable',
      message: 'Players data should be served from cache only'
    });
    return;
    
  } catch (error) {
    console.error('❌ Tank01 players API error:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
}