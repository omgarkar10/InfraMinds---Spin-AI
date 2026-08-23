"""FastAPI webhook server for Citizen Edge (WhatsApp/Telegram/Firebase)."""

from __future__ import annotations

import json
import os
import uuid

from fastapi import FastAPI, Request, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from spin_agents.tools.bhashini import bhashini_asr, bhashini_translate
from spin_agents.tools.bigquery import query_red_zones, query_weekly_summary
from spin_agents.runner import run_pipeline
from spin_agents.auth import router as auth_router
from spin_agents.config_routes import router as config_router
from spin_agents.db import Base, engine
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from translate_service import translate_to_english

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app = FastAPI(title="SPIN Citizen Edge API", version="1.0.0")

@app.on_event("startup")
async def on_startup():
    await init_db()

app.include_router(auth_router)
app.include_router(config_router)

app.add_middleware(
    CORSMiddleware,

    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CitizenMessage(BaseModel):
    user_id: str
    text: str | None = None
    audio_url: str | None = None
    media_url: str | None = None
    source_language: str = "hi"
    location: dict | None = None


class PolicyAction(BaseModel):
    grievance_id: str
    user_id: str
    target_language: str = "hi"
    action: str = Field(description="approved|rejected|reallocated")
    budget_cr: float | None = None
    message_en: str = "Your infrastructure grievance has been approved for action."


class PipelineRequest(BaseModel):
    user_id: str = "anonymous"
    text: str
    source_language: str = "hi"
    location: dict | None = None
    media_url: str | None = None
    run_adk: bool = True

class TranslateRequest(BaseModel):
    text: str


@app.get("/health")
async def health():
    return {"status": "ok", "service": "spin-citizen-edge"}


@app.post("/api/translate")
async def translate_text(payload: TranslateRequest):
    """Translates text to English using Google Cloud Translate."""
    result = translate_to_english(payload.text)
    return {
        "original_text": payload.text,
        "english_translation": result.get("translated_text", payload.text),
        "source_language": result.get("source_language", "unknown")
    }


@app.post("/webhook/citizen")
async def citizen_webhook(payload: CitizenMessage):
    """Firebase/WhatsApp/Telegram webhook — prepares intake JSON for ADK pipeline."""
    session_id = str(uuid.uuid4())

    if payload.audio_url:
        translation = await bhashini_asr(payload.audio_url, payload.source_language)
    elif payload.text:
        if payload.source_language != "en":
            translation = await bhashini_translate(
                payload.text, payload.source_language, "en"
            )
        else:
            translation = {
                "original_text": payload.text,
                "english_translation": payload.text,
                "source_language": "en",
            }
    else:
        return {"error": "text or audio_url required", "session_id": session_id}

    intake = {
        "original_text": translation["original_text"],
        "english_translation": translation["english_translation"],
        "user_id": payload.user_id,
        "media_url": payload.media_url,
        "location_data": payload.location,
        "source_language": payload.source_language,
        "hitl_required": payload.location is None,
    }

    return {
        "session_id": session_id,
        "intake_payload": intake,
        "next_step": "awaiting_location" if intake["hitl_required"] else "run_pipeline",
        "prompt": (
            "Where is the issue located? Share GPS pin or nearest landmark."
            if intake["hitl_required"]
            else None
        ),
    }


@app.post("/api/pipeline/run")
async def pipeline_run(payload: PipelineRequest):
    """Run full ADK pipeline when location is available (skips HITL if missing)."""
    if payload.source_language != "en":
        translation = await bhashini_translate(
            payload.text, payload.source_language, "en"
        )
    else:
        translation = {
            "original_text": payload.text,
            "english_translation": payload.text,
            "source_language": "en",
        }

    intake = {
        "original_text": translation["original_text"],
        "english_translation": translation["english_translation"],
        "user_id": payload.user_id,
        "media_url": payload.media_url,
        "location_data": payload.location,
        "source_language": payload.source_language,
        "hitl_required": payload.location is None,
    }

    if not payload.run_adk:
        return {"intake_payload": intake, "status": "intake_only"}

    if intake["hitl_required"]:
        return {
            "status": "awaiting_location",
            "intake_payload": intake,
            "prompt": "Where is the issue located? Share GPS pin or nearest landmark.",
        }

    result = await run_pipeline(
        user_message=translation["english_translation"],
        intake_payload=intake,
    )
    return {"status": "completed", **result}


@app.get("/api/dashboard/summary")
async def dashboard_summary(district: str | None = None):
    raw_stats = query_weekly_summary(district)
    if isinstance(raw_stats, list):
        stats = raw_stats[0] if raw_stats else {}
    else:
        stats = raw_stats or {}
    total = stats.get("total_complaints", 1240)
    domain = stats.get("top_domain", "Infrastructure")
    dist = stats.get("district", district or "National")
    red_count = stats.get("red_zone_count", 14)
    summary = (
        f"{total:,} verified complaints in {dist} over the last 7 days. "
        f"{domain} infrastructure dominates grievance volume. "
        f"{red_count} Red Zone clusters require immediate policy action."
    )
    return {"executive_summary": summary, "weekly_stats": stats or {"total_complaints": total, "top_domain": domain, "district": dist, "red_zone_count": red_count}}


@app.get("/api/dashboard/red-zones")
async def dashboard_red_zones(min_severity: int = 8):
    zones = query_red_zones(min_severity)
    return {"red_zones": zones, "count": len(zones)}


@app.post("/api/dashboard/policy-action")
async def policy_action(action: PolicyAction):
    from spin_agents.tools.bhashini import bhashini_notify_citizen

    notification = await bhashini_notify_citizen(
        action.message_en, action.target_language, action.user_id
    )
    return {
        "status": "approved" if action.action == "approved" else action.action,
        "notification": notification,
        "budget_reallocated_cr": action.budget_cr,
    }


@app.post("/webhook/firebase")
async def firebase_webhook(request: Request):
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
    return await citizen_webhook(message)

from sqlalchemy.future import select
from spin_agents.db import AsyncSessionLocal
from spin_agents.models import Grievance

@app.get("/api/grievances")
async def list_grievances(limit: int = 50):
    """Retrieve all recorded grievances from the SQLite database."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Grievance).order_by(Grievance.created_at.desc()).limit(limit)
        )
        grievances = result.scalars().all()
        return {
            "count": len(grievances),
            "grievances": [
                {
                    "id": g.id,
                    "grievance_id": g.grievance_id,
                    "user_id": g.user_id,
                    "domain": g.domain,
                    "category": g.category,
                    "severity": g.severity,
                    "priority": g.priority,
                    "latitude": g.latitude,
                    "longitude": g.longitude,
                    "landmark": g.landmark,
                    "original_text": g.original_text,
                    "district": g.district,
                    "status": g.status,
                    "created_at": g.created_at.isoformat() if g.created_at else None,
                }
                for g in grievances
            ],
        }

