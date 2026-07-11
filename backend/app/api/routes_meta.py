from __future__ import annotations

from fastapi import APIRouter

from app import config

router = APIRouter(tags=["meta"])


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "version": config.VERSION}


@router.get("/config")
def get_config() -> dict:
    return {
        "version": config.VERSION,
        "heatmap_grid": {"w": config.HEATMAP_GRID_W, "h": config.HEATMAP_GRID_H},
        "default_target_score": config.DEFAULT_TARGET_SCORE,
        "features": {
            "pose_enabled": config.pose_available(),
            "tts_enabled": config.tts_available(),
        },
    }
