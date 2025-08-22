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
    console.log('📁 Attempting to serve from cache...');
    
    // In production, fetch from the public cache file
    const cacheUrl = `${req.headers.origin || 'https://draftboardlive.online'}/cache/tank01-data.json`;
    
    try {
      const cacheResponse = await fetch(cacheUrl);
      if (cacheResponse.ok) {
        const cacheData = await cacheResponse.json();
        
        // Check if cache is less than 24 hours old
        const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (cacheAge < maxAge && cacheData.data.players) {
          console.log(`✅ CACHE HIT: Serving ${cacheData.data.players.length} players from cache (age: ${Math.round(cacheAge / 1000 / 60)} minutes)`);
          // Add response header to prove cache usage
          res.setHeader('X-Data-Source', 'cache');
          res.setHeader('X-Cache-Age-Minutes', Math.round(cacheAge / 1000 / 60));
          res.status(200).json(cacheData.data.players);
          return;
        }
      }
    } catch (cacheError) {
      console.log('⚠️ Cache not available, falling back to API');
    }

    // Fallback to direct API call if cache fails
    const TANK01_API_KEY = process.env.TANK01_API_KEY;
    
    if (!TANK01_API_KEY) {
      console.error('❌ Missing TANK01_API_KEY environment variable');
      res.status(500).json({ error: 'API key not configured' });
      return;
    }

    console.log('🌐 Fetching players from Tank01 API...');
    const response = await fetch('https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLPlayerList', {
      headers: {
        'X-RapidAPI-Key': TANK01_API_KEY,
        'X-RapidAPI-Host': 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      console.error('❌ Tank01 API error:', response.status, response.statusText);
      res.status(response.status).json({ error: `Tank01 API error: ${response.status}` });
      return;
    }

    const data = await response.json();
    const players = data.body || [];
    
    console.log(`✅ API HIT: Tank01 API returned ${players.length} players`);
    res.setHeader('X-Data-Source', 'api');
    res.status(200).json(players);
    
  } catch (error) {
    console.error('❌ Tank01 players API error:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
}