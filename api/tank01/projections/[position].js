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
    const { position = 'all' } = req.query;
    
    // Read cache file from the filesystem (included in deployment)
    const cacheFilePath = path.join(process.cwd(), 'public', 'cache', 'tank01-data.json');
    
    console.log(`📁 Attempting to read ${position} projections from filesystem cache...`);
    
    if (!fs.existsSync(cacheFilePath)) {
      throw new Error('Cache file not found in deployment');
    }
    
    const cacheData = JSON.parse(fs.readFileSync(cacheFilePath, 'utf8'));
    
    // Validate cache structure
    if (!cacheData.data || !cacheData.data.projections) {
      throw new Error('Invalid cache structure - missing projections data');
    }
    
    // Check cache age
    const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();
    const maxAge = 30 * 60 * 60 * 1000; // 30 hours (give some buffer)
    
    if (cacheAge > maxAge) {
      console.log(`⚠️ Cache is ${Math.round(cacheAge / (60 * 60 * 1000))}h old (max: 30h), but still serving it`);
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
      // If no cached projections, try API fallback
      throw new Error(`No projections found for position: ${position}`);
    }
    
    // Return cached data with proper headers
    console.log(`📦 CACHE HIT: Serving ${projections.length} ${position} projections from filesystem cache`);
    res.setHeader('X-Data-Source', 'filesystem-cache');
    res.setHeader('X-Cache-Age-Hours', Math.round(cacheAge / (60 * 60 * 1000)));
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
    res.status(200).json(projections);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Fallback: Try to fetch from Tank01 API directly
    try {
      const { position = 'all' } = req.query;
      console.log(`🌐 Attempting fallback to Tank01 API for ${position} projections...`);
      const fetch = require('node-fetch');
      
      const TANK01_API_KEY = process.env.TANK01_API_KEY || '293521c39dmshd34917039531846p115b84jsnd13efd600b8c';
      
      const response = await fetch(`https://tank01-nfl-live-in-game-real-time-statistics-nfl.p.rapidapi.com/getNFLProjections?position=${position}`, {
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
      let projections = [];
      
      // Extract player projections from API response
      if (data.body?.playerProjections) {
        projections = Object.values(data.body.playerProjections);
      }
      
      console.log(`✅ FALLBACK SUCCESS: Serving ${projections.length} ${position} projections from Tank01 API`);
      res.setHeader('X-Data-Source', 'tank01-api-fallback');
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600');
      res.status(200).json(projections);
      
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