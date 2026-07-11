"""SQLite persistence — stdlib sqlite3, no ORM, thread-safe via per-call connections.

Tables:
  games(game_id, title, status, progress, error, created_at, duration_s,
        score_a, score_b, target_score, scoring, video_path)
  players(player_id, name, position, height_cm, jersey_hint)
  game_players(game_id, player_id)
  events(event_id, game_id, seq, t, type, team, player_id, points,
         score_a, score_b, text, audio_url)
  highlights(highlight_id, game_id, t_start, t_end, label, video_url, thumb_url)
  analytics(game_id, json)            -- full GameAnalytics blob
  shares(share_token, player_id, created_at)
"""
from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from typing import Any, Iterator

from app import config

_SCHEMA = """
CREATE TABLE IF NOT EXISTS games (
  game_id TEXT PRIMARY KEY,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  progress REAL NOT NULL DEFAULT 0,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  duration_s REAL,
  score_a INTEGER,
  score_b INTEGER,
  target_score INTEGER NOT NULL DEFAULT 21,
  scoring TEXT NOT NULL DEFAULT '1s_and_2s',
  video_path TEXT
);
CREATE TABLE IF NOT EXISTS players (
  player_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT,
  height_cm REAL,
  jersey_hint TEXT
);
CREATE TABLE IF NOT EXISTS game_players (
  game_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  PRIMARY KEY (game_id, player_id)
);
CREATE TABLE IF NOT EXISTS events (
  event_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  t REAL NOT NULL,
  type TEXT NOT NULL,
  team TEXT,
  player_id TEXT,
  points INTEGER,
  score_a INTEGER,
  score_b INTEGER,
  text TEXT,
  audio_url TEXT,
  PRIMARY KEY (game_id, event_id)
);
CREATE TABLE IF NOT EXISTS highlights (
  highlight_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  t_start REAL NOT NULL,
  t_end REAL NOT NULL,
  label TEXT NOT NULL,
  video_url TEXT,
  thumb_url TEXT,
  PRIMARY KEY (game_id, highlight_id)
);
CREATE TABLE IF NOT EXISTS analytics (
  game_id TEXT PRIMARY KEY,
  json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS shares (
  share_token TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
"""


@contextmanager
def get_conn() -> Iterator[sqlite3.Connection]:
    conn = sqlite3.connect(config.DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript(_SCHEMA)


def row_to_dict(row: sqlite3.Row | None) -> dict[str, Any] | None:
    return dict(row) if row is not None else None


def dump_json(obj: Any) -> str:
    return json.dumps(obj, default=str)
