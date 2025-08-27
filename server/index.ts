// Load environment variables FIRST
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { fetchPlayerStats } from "./pfr";
import { fetchPositionProjections } from "./projections";
import { 
  getNFLPlayers, 
  getNFLFantasyProjections, 
  getNFLPlayerADP, 
  getNFLPlayerInfo,
  getNFLGamesForWeek,
  getNFLTeamRoster,
  getNFLPlayerGames,
  getNFLPlayerStats
} from "./tank01";

const app = express();
app.use(cors());
app.use(express.json());

interface Player {
  id: string;
  name: string;
  position: string;
}

const players: Player[] = [
  { id: "1", name: "Patrick Mahomes", position: "QB" },
  { id: "2", name: "Christian McCaffrey", position: "RB" },
  { id: "3", name: "Justin Jefferson", position: "WR" },
  { id: "4", name: "Travis Kelce", position: "TE" },
  { id: "5", name: "Jalen Hurts", position: "QB" }
];

interface Pick {
  team: string;
  playerId: string;
}

const picks: Pick[] = [];

app.get("/api/players", (_req, res) => {
  res.json(players);
});

app.get("/api/draft", (_req, res) => {
  res.json({ picks });
});

app.post("/api/draft/pick", (req, res) => {
  const { team, playerId } = req.body as Pick;
  if (!team || !playerId) {
    return res.status(400).json({ message: "team and playerId are required" });
  }
  if (picks.find((p) => p.playerId === playerId)) {
    return res.status(409).json({ message: "Player already drafted" });
  }
  picks.push({ team, playerId });
  return res.status(201).json({ picks });
});

app.get("/api/stats/:pfrId/:season", async (req, res) => {
  const { pfrId, season } = req.params;
  try {
    const stats = await fetchPlayerStats(pfrId, season);
    return res.json(stats);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ message });
  }
});

app.get("/api/projections/:position", async (req, res) => {
  const { position } = req.params;
  try {
    const projections = await fetchPositionProjections(position);
    return res.json(projections);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ message });
  }
});

// Tank01 API endpoints
app.get("/api/tank01/players", async (_req, res) => {
  try {
    const players = await getNFLPlayers();
    return res.json(players);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ message });
  }
});

app.get("/api/tank01/projections/:position?", async (req, res) => {
  const { position = 'all' } = req.params;
  try {
    const projections = await getNFLFantasyProjections(position);
    return res.json(projections);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ message });
  }
});

app.get("/api/tank01/adp", async (req, res) => {
  try {
    const scoringType = req.query.scoringType as string;
    const adp = await getNFLPlayerADP(scoringType);
    return res.json(adp);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ message });
  }
});

// Get team roster (includes injury data)
app.get("/api/tank01/roster/:teamID", async (req, res) => {
  const { teamID } = req.params;
  try {
    const roster = await getNFLTeamRoster(teamID);
    return res.json(roster);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ message });
  }
});

// Get player games history for injury analysis
app.get("/api/tank01/player/:playerID/games/:season?", async (req, res) => {
  const { playerID, season } = req.params;
  try {
    const games = await getNFLPlayerGames(playerID, season);
    return res.json(games);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ message });
  }
});

// Get player stats with injury data
app.get("/api/tank01/player/:playerID/stats", async (req, res) => {
  const { playerID } = req.params;
  try {
    const stats = await getNFLPlayerStats(playerID);
    return res.json(stats);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ message });
  }
});

app.get("/api/tank01/player/:playerID", async (req, res) => {
  const { playerID } = req.params;
  try {
    const player = await getNFLPlayerInfo(playerID);
    return res.json(player);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ message });
  }
});

app.get("/api/tank01/games/:week?", async (req, res) => {
  const { week = 'current' } = req.params;
  try {
    const games = await getNFLGamesForWeek(week);
    return res.json(games);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Tank01 API integration ${process.env.TANK01_API_KEY ? 'enabled' : 'disabled (set TANK01_API_KEY env var)'}`);
});
