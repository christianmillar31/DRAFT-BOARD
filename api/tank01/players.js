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
    
    console.log(`✅ Tank01 API returned ${players.length} players`);
    res.status(200).json(players);
    
  } catch (error) {
    console.error('❌ Tank01 players API error:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
}