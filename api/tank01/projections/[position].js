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
    const { position = 'all' } = req.query;
    
    // First, try to serve from cache
    console.log(`📁 Attempting to serve ${position} projections from cache...`);
    
    const cacheUrl = `${req.headers.origin || 'https://draftboardlive.online'}/cache/tank01-data.json`;
    
    try {
      const cacheResponse = await fetch(cacheUrl);
      if (cacheResponse.ok) {
        const cacheData = await cacheResponse.json();
        
        const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();
        const maxAge = 25 * 60 * 60 * 1000; // 25 hours
        
        if (cacheAge < maxAge && cacheData.data && cacheData.data.projections) {
          // Handle position-specific requests
          let projections;
          
          if (position.toLowerCase() === 'all') {
            // Return all projections
            const allProjections = [];
            for (const pos of ['QB', 'RB', 'WR', 'TE', 'K', 'DEF']) {
              if (Array.isArray(cacheData.data.projections[pos])) {
                allProjections.push(...cacheData.data.projections[pos]);
              }
            }
            projections = allProjections;
          } else {
            // Return position-specific projections
            const posKey = position.toUpperCase();
            projections = cacheData.data.projections[posKey] || [];
          }
          
          if (Array.isArray(projections) && projections.length > 0) {
            console.log(`📦 CACHE HIT: Serving ${projections.length} ${position} projections from cache (age: ${Math.round(cacheAge / 1000 / 60)} minutes)`);
            res.setHeader('X-Data-Source', 'cache');
            res.setHeader('X-Cache-Age-Minutes', Math.round(cacheAge / 1000 / 60));
            res.status(200).json(projections);
            return;
          }
        } else {
          console.log('⚠️ Cache exists but is stale or invalid format - age:', Math.round(cacheAge / 1000 / 60), 'minutes');
        }
      }
    } catch (cacheError) {
      console.log('⚠️ Cache not available, falling back to API:', cacheError.message);
    }

    // STOP: Cache should always work in production
    console.error(`❌ CACHE MISS: ${position} projections API should never hit Tank01 in production`);
    res.status(503).json({ 
      error: 'Cache service unavailable',
      message: `${position} projections data should be served from cache only`
    });
    return;
    
  } catch (error) {
    console.error('❌ Tank01 projections API error:', error);
    res.status(500).json({ error: 'Failed to fetch projections' });
  }
}