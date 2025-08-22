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
    const TANK01_API_KEY = process.env.TANK01_API_KEY;
    
    if (!TANK01_API_KEY) {
      console.error('❌ Missing TANK01_API_KEY environment variable');
      res.status(500).json({ error: 'API key not configured' });
      return;
    }

    // First, try to serve from cache
    console.log('📁 Attempting to serve ADP from cache...');
    
    const cacheUrl = `${req.headers.origin || 'https://draftboardlive.online'}/cache/tank01-data.json`;
    
    try {
      const cacheResponse = await fetch(cacheUrl);
      if (cacheResponse.ok) {
        const cacheData = await cacheResponse.json();
        
        const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (cacheAge < maxAge && cacheData.data.adp) {
          console.log(`✅ Serving ${cacheData.data.adp.length} ADP entries from cache`);
          res.status(200).json(cacheData.data.adp);
          return;
        }
      }
    } catch (cacheError) {
      console.log('⚠️ Cache not available, falling back to API');
    }

    console.log('🌐 Fetching ADP from Tank01 API...');
    const response = await fetch('https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLADP?adpType=halfPPR', {
      headers: {
        'X-RapidAPI-Key': TANK01_API_KEY,
        'X-RapidAPI-Host': 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      console.error('❌ Tank01 ADP API error:', response.status, response.statusText);
      res.status(response.status).json({ error: `Tank01 API error: ${response.status}` });
      return;
    }

    const data = await response.json();
    const adpData = data.body?.adpList || [];
    
    console.log(`✅ Tank01 ADP API returned ${adpData.length} records`);
    res.status(200).json(adpData);
    
  } catch (error) {
    console.error('❌ Tank01 ADP API error:', error);
    res.status(500).json({ error: 'Failed to fetch ADP data' });
  }
}