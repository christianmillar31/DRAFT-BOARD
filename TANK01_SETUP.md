# Tank01 NFL API Setup Guide

## Overview
This application integrates with Tank01's NFL API via RapidAPI for real-time NFL stats, fantasy projections, ADP data, and injury reports.

## Getting Started

### 1. Get Your Free API Key
1. Visit [Tank01 NFL API on RapidAPI](https://rapidapi.com/tank01/api/tank01-nfl-live-in-game-real-time-statistics-nfl)
2. Click "Subscribe to Test" 
3. Create a free RapidAPI account if you don't have one
4. Select the "Basic" plan (Free - 1,000 requests/month)
5. Copy your API key from the "X-RapidAPI-Key" field

### 2. Configure Your Environment
1. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

2. Add your API key to `.env`:
```
TANK01_API_KEY=your_rapidapi_key_here
```

### 3. Restart the Backend Server
```bash
npm run server
```

You should see:
```
Backend server running on port 3000
Tank01 API integration enabled
```

## Available Endpoints

### Player Data
- `GET /api/tank01/players` - Get all NFL players
- `GET /api/tank01/player/:playerID` - Get specific player info

### Fantasy Data
- `GET /api/tank01/projections/:position` - Get fantasy projections (position: QB, RB, WR, TE, or all)
- `GET /api/tank01/adp` - Get Average Draft Position data
- `GET /api/tank01/injuries` - Get current injury reports

### Game Data
- `GET /api/tank01/games/:week` - Get games for a specific week (use "current" for current week)

## Frontend Integration

The app provides React hooks for easy data access:

```typescript
import { 
  useTank01Players, 
  useTank01ADP, 
  useTank01Projections,
  useTank01Injuries 
} from '@/hooks/useApi';

// In your component
const { data: players, isLoading } = useTank01Players();
const { data: adpData } = useTank01ADP();
const { data: projections } = useTank01Projections('RB');
const { data: injuries } = useTank01Injuries();
```

## API Limits

### Free Tier (Basic Plan)
- 1,000 requests per month
- No credit card required
- Perfect for development and testing

### Upgrading
If you need more requests, upgrade your plan on RapidAPI:
- Pro: ~10,000 requests/month
- Ultra: ~100,000 requests/month
- Mega: Unlimited requests

## Features

Tank01 API provides:
- ✅ Real-time in-game statistics
- ✅ Fantasy projections updated hourly
- ✅ ADP (Average Draft Position) updated hourly
- ✅ Player injuries updated with roster changes
- ✅ Betting odds updated every minute
- ✅ Play-by-play data (beta)
- ✅ 2025-2026 season data

## Troubleshooting

### "Unauthorized" Error
- Make sure your API key is correctly set in `.env`
- Verify your RapidAPI subscription is active

### Empty Data
- Check if you've exceeded your monthly API limit
- Ensure the backend server is running with the API key loaded

### Rate Limiting
- Free tier: Monitor your usage on RapidAPI dashboard
- Implement caching to reduce API calls
- Consider upgrading if you hit limits frequently

## Support

- Tank01 is active on their RapidAPI discussion board
- They accept feature requests and provide custom APIs for subscribers
- Check the [API documentation](https://rapidapi.com/tank01/api/tank01-nfl-live-in-game-real-time-statistics-nfl) for updates