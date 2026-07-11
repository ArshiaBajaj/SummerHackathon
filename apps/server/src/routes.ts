import { Router } from "express";
import type { Request, Response } from "express";
import { PLAYERS, playerById, leaders, type LeaderCategory } from "./data/players.js";
import { TEAMS } from "./data/teams.js";
import { listFilms, filmDetail } from "./data/films.js";
import { getCard, listCards, saveCard } from "./services/store.js";
import {
  generateCommentary,
  generateScoutingReport,
  llmEnabled,
  type CommentaryRequest,
} from "./services/ai.js";
import type { ScoutCard } from "./types.js";

export const api = Router();

api.get("/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: "anact-ortho-server",
    version: "0.1.0",
    llm: llmEnabled() ? "enabled" : "offline-fallback",
    counts: { players: PLAYERS.length, teams: TEAMS.length, films: listFilms().length },
    time: new Date().toISOString(),
  });
});

// --- Real NBA data --------------------------------------------------------

api.get("/teams", (_req, res) => {
  res.json({ teams: TEAMS });
});

api.get("/players", (req, res) => {
  const q = String(req.query.search ?? "").toLowerCase().trim();
  const team = String(req.query.team ?? "").toUpperCase().trim();
  let out = PLAYERS;
  if (team) out = out.filter((p) => p.team === team);
  if (q) out = out.filter((p) => p.name.toLowerCase().includes(q) || p.team.toLowerCase().includes(q));
  res.json({ season: "2023-24", count: out.length, players: out });
});

api.get("/players/:id", (req, res) => {
  const p = playerById(req.params.id);
  if (!p) return res.status(404).json({ error: "player_not_found" });
  res.json({ player: p });
});

api.get("/leaders", (req, res) => {
  const valid: LeaderCategory[] = ["ppg", "rpg", "apg", "spg", "bpg"];
  const cat = String(req.query.category ?? "ppg") as LeaderCategory;
  const category = valid.includes(cat) ? cat : "ppg";
  const limit = Math.min(24, Math.max(1, Number(req.query.limit ?? 10)));
  res.json({ category, leaders: leaders(category, limit) });
});

// --- Film room (real games → Anact Ortho replay) --------------------------

api.get("/films", (_req, res) => {
  res.json({ films: listFilms() });
});

api.get("/films/:id", (req, res) => {
  const film = filmDetail(req.params.id);
  if (!film) return res.status(404).json({ error: "film_not_found" });
  res.json({ film });
});

// --- Commentary + scouting AI (optional LLM, deterministic fallback) ------

api.post("/commentary", async (req, res) => {
  const body = req.body as CommentaryRequest;
  if (!body || typeof body.event !== "string") {
    return res.status(400).json({ error: "event_required" });
  }
  const result = await generateCommentary(body);
  res.json(result);
});

api.post("/ai/scouting-report", async (req, res) => {
  const card = req.body as ScoutCard;
  if (!card || !card.player || typeof card.player.name !== "string") {
    return res.status(400).json({ error: "player_required" });
  }
  const result = await generateScoutingReport(card);
  res.json(result);
});

// --- Scout-card persistence + sharing -------------------------------------

api.post("/scout/profiles", async (req, res) => {
  const body = req.body as Omit<ScoutCard, "id" | "createdAt">;
  if (!body || !body.player || typeof body.player.name !== "string") {
    return res.status(400).json({ error: "invalid_card" });
  }
  // Attach a scouting report if one wasn't supplied.
  if (!body.report) {
    const report = await generateScoutingReport({ ...body, id: "tmp", createdAt: Date.now() } as ScoutCard);
    body.report = report.text;
    body.reportSource = report.source;
  }
  const saved = await saveCard(body);
  res.status(201).json({ card: saved });
});

api.get("/scout/profiles", async (_req, res) => {
  const cards = await listCards();
  res.json({ count: cards.length, cards });
});

api.get("/scout/profiles/:id", async (req, res) => {
  const card = await getCard(req.params.id);
  if (!card) return res.status(404).json({ error: "card_not_found" });
  res.json({ card });
});
