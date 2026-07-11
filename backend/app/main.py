"""CourtVision AI backend — FastAPI app factory.

Run locally:
    uvicorn app.main:app --reload --port 8000
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app import config
from app.db import init_db


def create_app() -> FastAPI:
    app = FastAPI(
        title="CourtVision AI",
        version=config.VERSION,
        description="On-device AI referee, commentator, and scout — backend API.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    init_db()

    # Routers are registered here by the API layer.
    from app.api import register_routes

    register_routes(app)

    app.mount("/media", StaticFiles(directory=str(config.MEDIA_DIR)), name="media")
    return app


app = create_app()
