// COMPLETE REWRITE v4 - Force Vercel to update
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Add debug headers to prove this version is deployed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Function-Version', 'v4-complete-rewrite');
  res.setHeader('X-Deployment-Test', new Date().toISOString());
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('🚀 [V4] Starting players request...');
    
    // Build cache URL
    const origin = req.headers.origin || 'https://draftboardlive.online';
    const cacheUrl = `${origin}/cache/tank01-data.json`;
    
    console.log('📦 [V4] Fetching cache from:', cacheUrl);
    
    // Fetch cache file
    const cacheResponse = await fetch(cacheUrl);
    
    if (!cacheResponse.ok) {
      throw new Error(`Cache fetch failed: ${cacheResponse.status}`);
    }
    
    const cacheData = await cacheResponse.json();
    
    // Validate cache structure
    if (!cacheData.data || !Array.isArray(cacheData.data.players)) {
      throw new Error('Invalid cache structure');
    }
    
    // Check cache age
    const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();
    const maxAge = 25 * 60 * 60 * 1000; // 25 hours
    
    if (cacheAge > maxAge) {
      throw new Error(`Cache too old: ${Math.round(cacheAge / 1000 / 60)} minutes`);
    }
    
    // SUCCESS - Return cached data
    console.log(`✅ [V4] Cache hit! Serving ${cacheData.data.players.length} players`);
    
    res.setHeader('X-Data-Source', 'cache');
    res.setHeader('X-Cache-Age-Minutes', Math.round(cacheAge / 1000 / 60).toString());
    res.setHeader('X-Player-Count', cacheData.data.players.length.toString());
    
    return res.status(200).json(cacheData.data.players);
    
  } catch (error) {
    console.error('❌ [V4] Cache error:', error.message);
    
    // Return error instead of hitting Tank01
    res.setHeader('X-Data-Source', 'error');
    res.setHeader('X-Error-Message', error.message);
    
    return res.status(503).json({ 
      error: 'Cache service unavailable',
      message: error.message,
      version: 'v4-complete-rewrite'
    });
  }
}