# CourtVision AI — Backend API Contract

Base URL (local dev): `http://localhost:8787`
Run: `uvicorn app.main:app --port 8787` (from `backend/`, venv active).
The web frontend (`apps/web`) defaults to `http://localhost:8787`, so this server is a
drop-in replacement for the old `apps/server` Express stub.

Interactive docs: `http://localhost:8787/docs` (auto-generated, always current)

CORS is open for `http://localhost:*` dev servers (Vite/Next/CRA all work).

All timestamps in events are **seconds from the start of the game video** (float).
All IDs are short strings. All responses are JSON unless noted.

---

## 1. Games (upload → process → results)

### POST `/api/games`
Upload a game video for processing. `multipart/form-data`:

| field | type | required | notes |
|---|---|---|---|
| `video` | file | yes | mp4/mov/avi/mkv/webm |
| `title` | str | no | display name |
| `players` | str (JSON array) | no | `[{"name":"Vihan","jersey_hint":"red shirt"}]` |
| `target_score` | int | no | game ends at this score (default 21) |
| `scoring` | str | no | `"1s_and_2s"` (default) or `"2s_and_3s"` |

Response `201`:
```json
{ "game_id": "g_ab12cd", "status": "queued" }
```
Jobs run one at a time (FIFO). Progress is visible on GET `/api/games/{id}`
and streamed over the WebSocket.

### GET `/api/games`
List all games. Response: `[{ "game_id", "title", "status", "created_at", "duration_s", "final_score" }]`

### GET `/api/games/{game_id}`
```json
{
  "game_id": "g_ab12cd",
  "title": "Sat pickup run",
  "status": "queued | processing | done | error",
  "progress": 0.42,
  "error": null,
  "created_at": "2026-07-11T15:00:00Z",
  "duration_s": 612.5,
  "final_score": {"team_a": 21, "team_b": 17},
  "target_score": 21,
  "scoring": "1s_and_2s",
  "players": [{"player_id": "p_1", "name": "Vihan"}]
}
```

### GET `/api/games/{game_id}/events`
Every event the engine emitted, in order. Event shape:
```json
{
  "event_id": "e_0001",
  "t": 34.2,
  "type": "score | out_of_bounds | whistle | streak | commentary | game_start | game_end | possession_change | shot_attempt",
  "team": "a | b | null",
  "player_id": "p_1 | null",
  "points": 2,
  "score_after": {"team_a": 4, "team_b": 2},
  "text": "Bucket! Get that man some water. Team A — 4-2.",
  "audio_url": "/media/audio/g_ab12cd/e_0001.wav"
}
```
Fields not relevant to a given type are `null`. `text` is the commentary line;
`audio_url` is present when offline TTS audio was rendered. On events emitted by
CV processing, `player_id` follows the convention `p_{track_id}` of the CV player track.

### GET `/api/games/{game_id}/analytics`
```json
{
  "game_id": "g_ab12cd",
  "team_stats": {"team_a": {"points": 21, "fg_attempts": 30, "fg_made": 12}, "team_b": {}},
  "players": [
    {
      "player_id": "p_1",
      "name": "Vihan",
      "points": 9,
      "shot_attempts": 11,
      "shots_made": 5,
      "max_vertical_jump_cm": 48.2,
      "avg_shot_release_velocity_ms": 6.1,
      "top_speed_ms": 5.4,
      "distance_covered_m": 1240.0,
      "heatmap": {"grid_w": 30, "grid_h": 17, "cells": [[0,0,3], [4,2,11]]}
    }
  ],
  "ball_heatmap": {"grid_w": 30, "grid_h": 17, "cells": [[x, y, count]]}
}
```
Heatmap `cells` are sparse `[grid_x, grid_y, count]` triples over a court-space grid
(grid_w × grid_h, half-court length × width). Render however you like.
If the game has not finished processing this returns an empty-but-valid blob.

### GET `/api/games/{game_id}/highlights`
```json
[
  {"highlight_id": "hl_000", "t_start": 30.1, "t_end": 38.4, "label": "Score (+2) by p_1",
   "video_url": "/media/highlights/g_ab12cd/hl_000.mp4", "thumb_url": "/media/highlights/g_ab12cd/hl_000.jpg"}
]
```

### GET `/api/games/{game_id}/boxscore`
```json
{
  "game_id": "g_ab12cd",
  "final_score": {"team_a": 21, "team_b": 14},
  "teams": {
    "a": {"points": 21, "fg_made": 18, "fg_attempts": 20, "best_streak": 6, "plus_minus": 7},
    "b": {"points": 14, "fg_made": 11, "fg_attempts": 13, "best_streak": 3, "plus_minus": -7}
  },
  "players": [{"player_id", "name", "points", "fg_made", "fg_attempts", "best_streak", "plus_minus"}]
}
```
Per-player `best_streak`/`plus_minus` are `null` when attribution is unavailable.

### DELETE `/api/games/{game_id}` — remove a game, its rows, and its media. → `{"deleted": true, "game_id": ...}`

---

## 2. Live event stream (WebSocket)

### WS `/ws/games/{game_id}`
Connect any time. Messages are JSON, one event per message (same shape as `/events`
above), plus status frames:
```json
{"type": "status", "status": "processing", "progress": 0.42}
```
- While a game is `queued`/`processing`: already-stored events are replayed first
  (catch-up), then new events stream live as the engine finds them.
- If the game is already `done` (and no simulation is running): all stored events are
  replayed instantly, then `{"type": "status", "status": "done"}` is sent and the
  socket closes.
- If a **simulation** is running for the game, the socket stays open and receives the
  time-scaled replay.
- Unknown game: one `{"type": "status", "status": "error", "error": "..."}` frame, then close.

### POST `/api/games/{game_id}/simulate`
**Demo mode for frontend dev.** Replays a finished game's stored events over the
WebSocket with real-time pacing. Body: `{"speed": 4.0}` (default 4.0; game-time seconds
per wall-clock second scale factor). Response:
```json
{"game_id": "g_sample", "status": "replaying", "speed": 4.0, "events": 100}
```
Call order: **POST simulate first, then open the WebSocket** — the replay waits ~1.5 s
before the first event so the socket can attach. `409` with code `already_simulating`
if a replay is active; `409` `not_replayable` if the game has no stored events.

A built-in sample game **`g_sample`** always exists (seeded at startup): a completed
10-minute pickup game to 21 with a ~100-event scripted timeline (scores, whistles,
streaks, commentary) and a plausible analytics blob. Build the whole live UI with
`POST /api/games/g_sample/simulate` + the WebSocket, no video needed.

---

## 3. Roster & scouting share links

> **Renamed:** our tracked-player CRUD lives under **`/api/roster`** (it was
> `/api/players` in an earlier draft). `GET /api/players` now serves the canned NBA
> dataset the frontend expects — see section 6.

### POST `/api/roster` — `{"name": "Vihan", "position": "PG", "height_cm": 180, "jersey_hint": "red shirt"}` → `201 {"player_id": "p_1"}`
### GET `/api/roster` — list of player profiles.
### GET `/api/roster/{player_id}` — profile + `career` (aggregated across processed games) + `games` (summaries).
### PATCH `/api/roster/{player_id}` — partial update of `name/position/height_cm/jersey_hint`.

### POST `/api/roster/{player_id}/share`
Create a public scouting link → `201 {"share_token": "s_9fk2", "share_url": "/api/share/s_9fk2"}`

### GET `/api/share/{share_token}` *(no auth — public)*
```json
{
  "share_token": "s_9fk2",
  "player": {"player_id", "name", "position", "height_cm", "jersey_hint"},
  "career": {"games_played", "points", "shot_attempts", "shots_made", "fg_pct",
             "max_vertical_jump_cm", "top_speed_ms", "distance_covered_m", "avg_points_per_game"},
  "games": [{ ...game summaries... }],
  "highlights": [ ...best 5 highlight objects... ]
}
```
This is the page recruiters see.

---

## 4. Media

`GET /media/...` serves generated files (highlight mp4s, thumbs, commentary wavs).
Plain static files, no auth.

## 5. Health & meta

### GET `/api/health`
Union of the contract shape and the frontend-client shape:
```json
{
  "ok": true,
  "status": "ok",
  "service": "courtvision-server",
  "version": "0.1.0",
  "llm": "enabled | offline-fallback",
  "counts": {"players": 24, "teams": 19, "films": 5},
  "time": "2026-07-11T19:33:47.856Z",
  "features": {"pose_enabled": true, "tts_enabled": true}
}
```

### GET `/api/config`
Scoring rules, court grid dims, feature flags (`pose_enabled`, `tts_enabled`) so the
frontend can adapt.

---

## 6. Frontend-compat endpoints (canned NBA data + AI)

These mirror the old `apps/server` Express stub **exactly** (camelCase keys, same
wrapper objects) so `apps/web/src/lib/api.ts` works unchanged. Error payloads here are
flat strings, e.g. `404 {"error": "film_not_found"}` — not the nested shape below.

| endpoint | response |
|---|---|
| GET `/api/teams` | `{"teams": [{tricode, name, city, conference, primary, secondary}]}` |
| GET `/api/players?search=&team=` | `{"season": "2023-24", "count", "players": [NbaPlayer]}` |
| GET `/api/players/{id}` | `{"player": NbaPlayer}` / `404 {"error":"player_not_found"}` |
| GET `/api/leaders?category=ppg&limit=10` | `{"category", "leaders": [NbaPlayer]}` (categories: ppg/rpg/apg/spg/bpg, limit 1-24) |
| GET `/api/films` | `{"films": [FilmGame]}` — 5 real 2023-24 games |
| GET `/api/films/{id}` | `{"film": FilmGameDetail}` incl. deterministic replay `timeline` / `404 {"error":"film_not_found"}` |
| POST `/api/commentary` | `{"text", "source": "llm"\|"engine"}`; body `{event, team?, teamName?, value?, scoreA?, scoreB?, style?}`; `400 {"error":"event_required"}` |
| POST `/api/ai/scouting-report` | `{"text", "source"}`; body = ScoutCard; `400 {"error":"player_required"}` |
| POST `/api/scout/profiles` | `201 {"card": {...saved card, id, createdAt}}` — auto-generates `report` if missing; `400 {"error":"invalid_card"}` |
| GET `/api/scout/profiles` | `{"count", "cards": [...]}` (newest first, persisted in SQLite) |
| GET `/api/scout/profiles/{id}` | `{"card"}` / `404 {"error":"card_not_found"}` |

`NbaPlayer` fields: `id, name, team, teamName, position, jersey, heightCm, ppg, rpg,
apg, spg, bpg, fgPct, tpPct, ftPct, gamesPlayed`.

Commentary + scouting reports use a deterministic phrase engine offline; set
`OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) to upgrade both to LLM generation with
automatic fallback. `/api/health` reports which mode is active via `llm`.

## Error shape (contract endpoints)
```json
{ "error": {"code": "game_not_found", "message": "No game g_zzz"} }
```
HTTP status matches (404, 409, 422, 500...). Validation errors use FastAPI's standard
422 shape. Compat endpoints (section 6) use flat string errors as noted.
