# Setting Up Daily Cache System

## Overview
This system fetches Tank01 API data once per day at 12AM PST and caches it, reducing API calls from thousands per day to just a few.

## Setup Instructions

### 1. Add GitHub Secret
1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add a secret named `TANK01_API_KEY` with your API key value

### 2. Enable GitHub Actions
1. Go to the "Actions" tab in your repository
2. Enable workflows if prompted

### 3. Manual Cache Update (First Time)
To populate the cache immediately without waiting for midnight:

1. Go to Actions tab
2. Click "Update Tank01 Data Cache" workflow
3. Click "Run workflow" → "Run workflow"

### 4. Verify Cache
After the workflow runs:
1. Check the `public/cache/` directory in your repo
2. You should see `tank01-data.json` and `cache-meta.json`

## How It Works

1. **Daily Update**: GitHub Actions runs at 12AM PST every day
2. **Fetch Data**: Script fetches all needed data from Tank01 API
3. **Store Cache**: Data is saved to `public/cache/tank01-data.json`
4. **Serve Cached**: Your API endpoints check cache first, only calling Tank01 if cache is missing/old

## Cost Savings

- **Before**: ~1000+ API calls per day (every user refresh)
- **After**: ~10 API calls per day (once at midnight)
- **Savings**: 99% reduction in API usage

## Monitoring

- Check GitHub Actions tab to see run history
- View `cache-meta.json` to see last update time
- API endpoints log whether they're serving from cache or API