"""Games endpoints: upload -> background processing -> results (+ simulate)."""
from __future__ import annotations

import json
import shutil
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app import config
from app.api import ws as ws_module
from app.api.common import (
    ApiError,
    event_row_to_dict,
    fetch_game,
    game_detail,
    game_summary,
    highlight_row_to_dict,
    player_row_to_dict,
)
from app.db import get_conn
from app.util import new_id

router = APIRouter(tags=["games"])

_ALLOWED_VIDEO_SUFFIXES = {".mp4", ".mov", ".avi", ".mkv", ".webm"}


@router.post("/games", status_code=201)
async def create_game(
    video: UploadFile = File(...),
    title: Optional[str] = Form(None),
    players: Optional[str] = Form(None),
    target_score: int = Form(config.DEFAULT_TARGET_SCORE),
    scoring: str = Form("1s_and_2s"),
) -> JSONResponse:
    """Upload a game video; processing starts in the background job queue."""
    suffix = Path(video.filename or "upload.mp4").suffix.lower()
    if suffix not in _ALLOWED_VIDEO_SUFFIXES:
        raise ApiError(422, "unsupported_video", f"Unsupported video type {suffix or '(none)'}")
    if scoring not in ("1s_and_2s", "2s_and_3s"):
        raise ApiError(422, "invalid_scoring", "scoring must be '1s_and_2s' or '2s_and_3s'")

    player_specs: list[dict[str, Any]] = []
    if players:
        try:
            parsed = json.loads(players)
            if not isinstance(parsed, list):
                raise ValueError
            player_specs = [p for p in parsed if isinstance(p, dict) and p.get("name")]
        except ValueError:
            raise ApiError(422, "invalid_players", "players must be a JSON array of objects")

    game_id = new_id("g")
    dest = config.UPLOAD_DIR / f"{game_id}.mp4"
    with dest.open("wb") as out:
        shutil.copyfileobj(video.file, out)

    with get_conn() as conn:
        conn.execute(
            "INSERT INTO games (game_id, title, status, target_score, scoring, video_path)"
            " VALUES (?, ?, 'queued', ?, ?, ?)",
            (game_id, title, target_score, scoring, str(dest)),
        )
        for spec in player_specs:
            player_id = new_id("p")
            conn.execute(
                "INSERT INTO players (player_id, name, position, height_cm, jersey_hint)"
                " VALUES (?,?,?,?,?)",
                (
                    player_id,
                    str(spec["name"]),
                    spec.get("position"),
                    spec.get("height_cm"),
                    spec.get("jersey_hint"),
                ),
            )
            conn.execute(
                "INSERT INTO game_players (game_id, player_id) VALUES (?, ?)",
                (game_id, player_id),
            )

    from app.workers.processor import submit_game

    submit_game(game_id)
    return JSONResponse(status_code=201, content={"game_id": game_id, "status": "queued"})


@router.get("/games")
def list_games() -> list[dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM games ORDER BY created_at DESC").fetchall()
    return [game_summary(r) for r in rows]


@router.get("/games/{game_id}")
def get_game(game_id: str) -> dict[str, Any]:
    with get_conn() as conn:
        row = fetch_game(conn, game_id)
        players = [
            player_row_to_dict(r)
            for r in conn.execute(
                "SELECT p.* FROM players p JOIN game_players gp ON gp.player_id = p.player_id"
                " WHERE gp.game_id = ? ORDER BY p.player_id",
                (game_id,),
            ).fetchall()
        ]
    return game_detail(row, players)


@router.get("/games/{game_id}/events")
def get_events(game_id: str) -> list[dict[str, Any]]:
    with get_conn() as conn:
        fetch_game(conn, game_id)
        rows = conn.execute(
            "SELECT * FROM events WHERE game_id = ? ORDER BY seq", (game_id,)
        ).fetchall()
    return [event_row_to_dict(r) for r in rows]


@router.get("/games/{game_id}/analytics")
def get_analytics(game_id: str) -> dict[str, Any]:
    with get_conn() as conn:
        fetch_game(conn, game_id)
        row = conn.execute(
            "SELECT json FROM analytics WHERE game_id = ?", (game_id,)
        ).fetchone()
    if row is None:
        # not processed yet: empty-but-valid blob
        return {
            "game_id": game_id,
            "team_stats": {},
            "players": [],
            "ball_heatmap": {"grid_w": config.HEATMAP_GRID_W, "grid_h": config.HEATMAP_GRID_H, "cells": []},
        }
    return json.loads(row["json"])


@router.get("/games/{game_id}/highlights")
def get_highlights(game_id: str) -> list[dict[str, Any]]:
    with get_conn() as conn:
        fetch_game(conn, game_id)
        rows = conn.execute(
            "SELECT * FROM highlights WHERE game_id = ? ORDER BY t_start", (game_id,)
        ).fetchall()
    return [highlight_row_to_dict(r) for r in rows]


@router.get("/games/{game_id}/boxscore")
def get_boxscore(game_id: str) -> dict[str, Any]:
    """Traditional box score: per player + per team, derived from analytics/events."""
    with get_conn() as conn:
        row = fetch_game(conn, game_id)
        analytics_row = conn.execute(
            "SELECT json FROM analytics WHERE game_id = ?", (game_id,)
        ).fetchone()
        event_rows = conn.execute(
            "SELECT * FROM events WHERE game_id = ? ORDER BY seq", (game_id,)
        ).fetchall()

    # team totals, best run, and plus-minus from the score timeline
    teams: dict[str, dict[str, Any]] = {
        k: {"points": 0, "fg_made": 0, "fg_attempts": 0, "best_streak": 0, "plus_minus": 0}
        for k in ("a", "b")
    }
    has_attempt_events = any(ev["type"] == "shot_attempt" for ev in event_rows)
    run_team, run_n = None, 0
    for ev in event_rows:
        if ev["type"] == "shot_attempt" and ev["team"] in teams:
            teams[ev["team"]]["fg_attempts"] += 1
        if ev["type"] != "score" or ev["team"] not in teams:
            continue
        t = ev["team"]
        teams[t]["points"] += ev["points"] or 0
        teams[t]["fg_made"] += 1
        if not has_attempt_events:
            teams[t]["fg_attempts"] += 1  # every make is at least an attempt
        run_n = run_n + 1 if run_team == t else 1
        run_team = t
        teams[t]["best_streak"] = max(teams[t]["best_streak"], run_n)
    diff = teams["a"]["points"] - teams["b"]["points"]
    teams["a"]["plus_minus"] = diff
    teams["b"]["plus_minus"] = -diff
    for t in teams.values():
        if t["fg_attempts"] < t["fg_made"]:
            t["fg_attempts"] = t["fg_made"]

    players = []
    if analytics_row is not None:
        blob = json.loads(analytics_row["json"])
        for p in blob.get("players", []):
            players.append(
                {
                    "player_id": p.get("player_id"),
                    "name": p.get("name"),
                    "points": p.get("points", 0),
                    "fg_made": p.get("shots_made", 0),
                    "fg_attempts": p.get("shot_attempts", 0),
                    "best_streak": None,
                    "plus_minus": None,
                }
            )
    return {
        "game_id": game_id,
        "final_score": {"team_a": row["score_a"] or 0, "team_b": row["score_b"] or 0},
        "teams": teams,
        "players": players,
    }


@router.delete("/games/{game_id}")
def delete_game(game_id: str) -> dict[str, Any]:
    with get_conn() as conn:
        row = fetch_game(conn, game_id)
        video_path = row["video_path"]
        for table in ("events", "highlights", "analytics", "game_players"):
            conn.execute(f"DELETE FROM {table} WHERE game_id = ?", (game_id,))
        conn.execute("DELETE FROM games WHERE game_id = ?", (game_id,))
    if video_path:
        Path(video_path).unlink(missing_ok=True)
    for sub in ("audio", "highlights"):
        shutil.rmtree(config.MEDIA_DIR / sub / game_id, ignore_errors=True)
    return {"deleted": True, "game_id": game_id}


class SimulateBody(BaseModel):
    speed: float = 4.0


@router.post("/games/{game_id}/simulate")
async def simulate_game(game_id: str, body: Optional[SimulateBody] = None) -> dict[str, Any]:
    """Replay a finished game's stored events over the WebSocket, time-scaled."""
    speed = body.speed if body else 4.0
    with get_conn() as conn:
        row = fetch_game(conn, game_id)
        n_events = conn.execute(
            "SELECT COUNT(*) AS n FROM events WHERE game_id = ?", (game_id,)
        ).fetchone()["n"]
    if row["status"] not in ("done", "error") or n_events == 0:
        raise ApiError(409, "not_replayable", "Game has no stored events to replay yet")
    if not ws_module.start_simulation(game_id, speed):
        raise ApiError(409, "already_simulating", "A replay is already running for this game")
    return {"game_id": game_id, "status": "replaying", "speed": speed, "events": n_events}
