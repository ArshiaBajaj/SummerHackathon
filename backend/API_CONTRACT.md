# CourtVision AI — Backend API Contract

Base URL (local dev): `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs` (auto-generated, always current)

CORS is open for `http://localhost:*` dev servers (Vite/Next/CRA all work).

All timestamps in events are **seconds from the start of the game video** (float).
All IDs are short strings. All responses are JSON unless noted.

---

## 1. Games (upload → process → results)

### POST `/api/games`
Upload a game video for processing. `multipart/form-data`:

| field | type | required | notes |
|---|---|---|---|
| `video` | file | yes | mp4/mov/avi |
| `title` | str | no | display name |
| `players` | str (JSON array) | no | `[{"name":"Vihan","jersey_hint":"red shirt"}]` |
| `target_score` | int | no | game ends at this score (default 21) |
| `scoring` | str | no | `"1s_and_2s"` (default) or `"2s_and_3s"` |

Response `201`:
```json
{ "game_id": "g_ab12cd", "status": "queued" }
```

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
  "players": [{"player_id": "p_1", "name": "Vihan"}]
}
```

### GET `/api/games/{game_id}/events`
Every event the engine emitted, in order. Event shape:
```json
{
  "event_id": "e_001",
  "t": 34.2,
  "type": "score | out_of_bounds | whistle | streak | commentary | game_start | game_end | possession_change | shot_attempt",
  "team": "a | b | null",
  "player_id": "p_1 | null",
  "points": 2,
  "score_after": {"team_a": 4, "team_b": 2},
  "text": "Bucket! Vihan pulls up from deep — count it!",
  "audio_url": "/media/audio/g_ab12cd/e_001.wav"
}
```
Fields not relevant to a given type are `null`. `text` is the commentary line; `audio_url` is present when TTS audio was rendered.

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
Heatmap `cells` are sparse `[grid_x, grid_y, count]` triples over a court-space grid (grid_w × grid_h, court length × width). Render however you like.

### GET `/api/games/{game_id}/highlights`
```json
[
  {"highlight_id": "h_1", "t_start": 30.1, "t_end": 38.4, "label": "3-pointer by Vihan",
   "video_url": "/media/highlights/g_ab12cd/h_1.mp4", "thumb_url": "/media/highlights/g_ab12cd/h_1.jpg"}
]
```

### GET `/api/games/{game_id}/boxscore`
Traditional box score table, per player: points, FG made/attempted, streak-best, plus-minus.

### DELETE `/api/games/{game_id}` — remove a game and its media.

---

## 2. Live event stream (WebSocket)

### WS `/ws/games/{game_id}`
Connect any time. Messages are JSON, one event per message (same shape as `/events` above), plus:
```json
{"type": "status", "status": "processing", "progress": 0.42}
```
- While a game is `processing`, events stream as the engine finds them.
- When `done`, the socket sends `{"type": "status", "status": "done"}` and closes.

### POST `/api/games/{game_id}/simulate`
**Demo mode for frontend dev.** Replays a finished (or built-in sample) game's events over the WebSocket in real time (time-scaled; body: `{"speed": 4.0}`). Frontend can build the whole live UI without a real video. A built-in sample game `g_sample` always exists.

---

## 3. Players & scouting profiles

### POST `/api/players` — `{"name": "Vihan", "position": "PG", "height_cm": 180}` → `{ "player_id": "p_1" }`
### GET `/api/players` / GET `/api/players/{player_id}` — profile + aggregated career stats across games.
### PATCH `/api/players/{player_id}` — update fields.

### POST `/api/players/{player_id}/share`
Create a public scouting link → `{"share_token": "s_9fk2", "share_url": "/api/share/s_9fk2"}`

### GET `/api/share/{share_token}` *(no auth — public)*
Full scouting profile: bio, per-game history, aggregate metrics, best highlights. This is the page recruiters see.

---

## 4. Media

`GET /media/...` serves generated files (highlight mp4s, thumbs, commentary wavs). Plain static files, no auth.

## 5. Health & meta

- `GET /api/health` → `{"status": "ok", "version": "..."}`
- `GET /api/config` → scoring rules, court grid dims, feature flags (`pose_enabled`, `tts_enabled`) so the frontend can adapt.

## Error shape (all endpoints)
```json
{ "error": {"code": "game_not_found", "message": "No game g_zzz"} }
```
HTTP status matches (404, 422, 500...). Validation errors use FastAPI's standard 422 shape.
