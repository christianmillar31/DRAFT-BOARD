const fs = require('fs');
const path = require('path');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Read cache file from the filesystem (included in deployment)
    const cacheFilePath = path.join(process.cwd(), 'public', 'cache', 'tank01-data.json');
    
    console.log('📁 Attempting to read cache from filesystem...');
    
    if (!fs.existsSync(cacheFilePath)) {
      throw new Error('Cache file not found in deployment');
    }
    
    const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
    
    // Validate cache structure
    if (!cacheData.data || !Array.isArray(cacheData.data.players)) {
      throw new Error('Invalid cache structure');
    }
    
    // Check cache age
    const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();
    const maxAge = 30 * 60 * 60 * 1000; // 30 hours (give some buffer)
    
    if (cacheAge > maxAge) {
      console.log(`⚠️ Cache is ${Math.round(cacheAge / (60 * 60 * 1000))}h old (max: 30h), but still serving it`);
    }
    
    // Return cached data with proper headers
    console.log(`📦 CACHE HIT: Serving ${cacheData.data.players.length} players from filesystem cache`);
    res.setHeader('X-Data-Source', 'filesystem-cache');
    res.setHeader('X-Cache-Age-Hours', Math.round(cacheAge / (60 * 60 * 1000)));
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
    res.status(200).json(cacheData.data.players);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Fallback: Try to fetch from Tank01 API directly
    try {
      console.log('🌐 Attempting fallback to Tank01 API...');
      const fetch = require('node-fetch');
      
      const TANK01_API_KEY = process.env.TANK01_API_KEY || '293521c39dmshd34917039531846p115b84jsnd13efd600b8c';
      
      const response = await fetch('https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLPlayerList', {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': TANK01_API_KEY,
          'X-RapidAPI-Host': 'tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Tank01 API error: ${response.status}`);
      }
      
      const data = await response.json();
      const players = data.body || [];
      
      console.log(`✅ FALLBACK SUCCESS: Serving ${players.length} players from Tank01 API`);
      res.setHeader('X-Data-Source', 'tank01-api-fallback');
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600');
      res.status(200).json(players);
      
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError.message);
      res.setHeader('X-Data-Source', 'error');
      res.setHeader('X-Error', error.message);
      res.status(503).json({ 
        error: 'Service temporarily unavailable',
        message: 'Cache not found and API fallback failed',
        details: error.message
      });
    }
  }
}