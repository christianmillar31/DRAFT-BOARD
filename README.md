# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/ca04f24f-9748-400c-ba94-7b99b91e379b

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/ca04f24f-9748-400c-ba94-7b99b91e379b) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Backend server

Run `npm run server` to start the Express backend providing draft endpoints and NFL data.

### API Endpoints:

**Draft Management:**
- `GET /api/players` returns available players (mock data)
- `GET /api/draft` returns current picks
- `POST /api/draft/pick` adds a pick `{ team, playerId }`

**Historical Data (Pro-Football-Reference):**
- `GET /api/stats/:pfrId/:season` returns a player's game log from Pro-Football-Reference
- `GET /api/projections/:position` returns FantasyPros projections for a position

**Live NFL Data (Tank01 API):**
- `GET /api/tank01/players` - All NFL players with current rosters
- `GET /api/tank01/projections/:position` - Fantasy projections (QB, RB, WR, TE, or all)
- `GET /api/tank01/adp` - Average Draft Position data (updated hourly)
- `GET /api/tank01/injuries` - Current injury reports
- `GET /api/tank01/player/:playerID` - Detailed player information
- `GET /api/tank01/games/:week` - Game schedules (use "current" for current week)

### Setup Tank01 API (Optional but Recommended):

1. Get free API key from [Tank01 on RapidAPI](https://rapidapi.com/tank01/api/tank01-nfl-live-in-game-real-time-statistics-nfl)
2. Create `.env` file: `cp .env.example .env`
3. Add your key: `TANK01_API_KEY=your_key_here`
4. Restart server: `npm run server`

**Tank01 Features:**
- ✅ Free tier: 1,000 requests/month
- ✅ Real-time game stats
- ✅ Fantasy projections updated hourly
- ✅ ADP data updated hourly
- ✅ Injury reports with roster updates
- ✅ 2025 season data

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/ca04f24f-9748-400c-ba94-7b99b91e379b) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
