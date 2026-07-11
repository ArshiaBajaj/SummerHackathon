"""API layer. register_routes() wires every router onto the app."""
from __future__ import annotations

from fastapi import FastAPI


def register_routes(app: FastAPI) -> None:
    from app.api.routes_meta import router as meta_router
    from app.api.routes_games import router as games_router
    from app.api.routes_players import router as players_router
    from app.api.routes_share import router as share_router
    from app.api.ws import router as ws_router

    app.include_router(meta_router, prefix="/api")
    app.include_router(games_router, prefix="/api")
    app.include_router(players_router, prefix="/api")
    app.include_router(share_router, prefix="/api")
    app.include_router(ws_router)
