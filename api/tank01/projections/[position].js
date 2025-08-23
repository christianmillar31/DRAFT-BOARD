const https = require('https');

export default async function handler(req, res) {
  // v6 - Using native https instead of fetch
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Function-Version', 'v6-https-native');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { position = 'all' } = req.query;
    console.log(`📁 [v6] Attempting to serve ${position} projections from cache...`);
    
    // Fetch cache file using native https
    const cacheData = await new Promise((resolve, reject) => {
      https.get('https://draftboardlive.online/cache/tank01-data.json', (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            reject(new Error('Invalid JSON in cache file'));
          }
        });
      }).on('error', reject);
    });
    
    // Validate cache structure
    if (!cacheData.data || !cacheData.data.projections) {
      throw new Error('Invalid cache structure - missing projections data');
    }
    
    // Check cache age
    const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();
    const maxAge = 25 * 60 * 60 * 1000; // 25 hours
    
    if (cacheAge > maxAge) {
      throw new Error(`Cache too old: ${Math.round(cacheAge / 1000 / 60)} minutes`);
    }
    
    // Handle position-specific requests
    let projections;
    
    if (position.toLowerCase() === 'all') {
      // Return all projections
      const allProjections = [];
      for (const pos of ['QB', 'RB', 'WR', 'TE', 'K', 'DST']) {
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
    
    if (!Array.isArray(projections) || projections.length === 0) {
      throw new Error(`No projections found for position: ${position}`);
    }
    
    // Return cached data with proper headers
    console.log(`📦 CACHE HIT: Serving ${projections.length} ${position} projections from cache`);
    res.setHeader('X-Data-Source', 'cache');
    res.setHeader('X-Cache-Age-Minutes', Math.round(cacheAge / 1000 / 60));
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
    res.status(200).json(projections);
    
  } catch (error) {
    console.error('❌ Cache error:', error.message);
    res.setHeader('X-Data-Source', 'error');
    res.setHeader('X-Error', error.message);
    res.status(503).json({ 
      error: 'Cache service unavailable',
      message: error.message,
      version: 'v6-https-native'
    });
  }
}