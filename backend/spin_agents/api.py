"""FastAPI webhook server for Citizen Edge (WhatsApp/Telegram/Firebase).

Error handling contract:
  - HTTPException propagates as-is (structured JSON with 'detail').
  - Unhandled exceptions return 500 with a safe generic message.
  - Raw exception messages are NEVER returned to the client in production.
  - All unhandled exceptions are logged server-side with traceback.
"""

from __future__ import annotations

import logging
import os
import sys
import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from spin_agents.auth import router as auth_router
from spin_agents.config import CONFIG
from spin_agents.config_routes import router as config_router
from spin_agents.db import Base, engine
from spin_agents.routers.dashboard_router import router as dashboard_router
from spin_agents.routers.grievance_router import router as grievance_router
from spin_agents.schemas import CitizenMessage, TranslateRequest
from spin_agents.services.grievance_service import process_citizen_webhook

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from translate_service import translate_to_english as _translate_to_english
except ImportError:
    _translate_to_english = None  # type: ignore

logger = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="SPIN Citizen Edge API", version="1.0.0")

# ── Global error handler ──────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler: logs full traceback server-side, returns safe 500 to client."""
    logger.error(
        "Unhandled exception on %s %s\n%s",
        request.method,
        request.url.path,
        traceback.format_exc(),
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again later."},
    )

# ── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")  # TODO: migrate to lifespan= when ADK runner supports it
async def on_startup() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# ── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=CONFIG.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(auth_router)
app.include_router(config_router)
app.include_router(grievance_router)
app.include_router(dashboard_router)

# ── Standalone endpoints ──────────────────────────────────────────────────────

@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "spin-citizen-edge"}


@app.post("/api/translate")
async def translate_text(payload: TranslateRequest) -> dict:
    """Translates text to English using Google Cloud Translate."""
    if _translate_to_english is None:
        return {
            "original_text": payload.text,
            "english_translation": payload.text,
            "source_language": "unknown",
            "error": "translate_service not available",
        }
    result = _translate_to_english(payload.text)
    return {
        "original_text": payload.text,
        "english_translation": result.get("translated_text", payload.text),
        "source_language": result.get("source_language", "unknown"),
    }


@app.post("/webhook/firebase")
async def firebase_webhook(request: Request) -> dict:
    """Generic Firebase Cloud Messaging / Firestore trigger adapter."""
    body = await request.json()
    message = CitizenMessage(
        user_id=body.get("userId", body.get("user_id", "anonymous")),
        text=body.get("text"),
        audio_url=body.get("audioUrl"),
        media_url=body.get("mediaUrl"),
        source_language=body.get("language", "hi"),
        location=body.get("location"),
    )
    return await process_citizen_webhook(message.model_dump())
