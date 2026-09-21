import uuid
from sqlalchemy.future import select
from spin_agents.db import AsyncSessionLocal
from spin_agents.models import Grievance
from spin_agents.runner import run_pipeline
from spin_agents.tools.bhashini import bhashini_asr, bhashini_translate

HITL_PROMPT = "Where is the issue located? Share GPS pin or nearest landmark."

async def translate_text(text: str, source_language: str) -> dict[str, str]:
    if source_language != "en":
        return await bhashini_translate(text, source_language, "en")
    return {
        "original_text": text,
        "english_translation": text,
        "source_language": "en",
    }

def build_intake(translation: dict[str, str], user_id: str, media_url: str | None, location: dict | None, source_language: str) -> dict:
    return {
        "original_text": translation["original_text"],
        "english_translation": translation["english_translation"],
        "user_id": user_id,
        "media_url": media_url,
        "location_data": location,
        "source_language": source_language,
        "hitl_required": location is None,
    }

async def process_citizen_webhook(payload: dict) -> dict:
    session_id = str(uuid.uuid4())
    audio_url = payload.get("audio_url")
    text = payload.get("text")
    source_language = payload.get("source_language", "hi")
    
    if audio_url:
        translation = await bhashini_asr(audio_url, source_language)
    elif text:
        translation = await translate_text(text, source_language)
    else:
        return {"error": "text or audio_url required", "session_id": session_id}

    intake = build_intake(
        translation, payload.get("user_id"), payload.get("media_url"),
        payload.get("location"), source_language,
    )

    return {
        "session_id": session_id,
        "intake_payload": intake,
        "next_step": "awaiting_location" if intake["hitl_required"] else "run_pipeline",
        "prompt": HITL_PROMPT if intake["hitl_required"] else None,
    }

async def process_pipeline_run(payload: dict) -> dict:
    translation = await translate_text(payload["text"], payload["source_language"])
    intake = build_intake(
        translation, payload["user_id"], payload.get("media_url"),
        payload.get("location"), payload["source_language"]
    )

    if not payload.get("run_adk", True):
        return {"intake_payload": intake, "status": "intake_only"}

    if intake["hitl_required"]:
        return {
            "status": "awaiting_location",
            "intake_payload": intake,
            "prompt": HITL_PROMPT,
        }

    result = await run_pipeline(
        user_message=translation["english_translation"],
        intake_payload=intake,
    )
    return {"status": "completed", **result}

async def get_grievances_list(limit: int = 50) -> dict:
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
                }
                for g in grievances
            ],
        }

async def persist_grievance_to_db(
    grievance_id: str, payload: dict, lat: float, lng: float
) -> None:
    """Attempt SQLite persistence; log and continue on failure — never raises."""
    try:
        async with AsyncSessionLocal() as session:
            new_g = Grievance(
                grievance_id=grievance_id,
                user_id=payload["user_id"],
                domain=payload["domain"],
                category=payload["category"],
                severity=payload["severity"],
                priority=payload["priority"],
                latitude=lat,
                longitude=lng,
                original_text=payload["original_text"],
                english_translation=payload["english_translation"],
                district=payload["district"],
                state=payload["state"],
            )
            session.add(new_g)
            await session.commit()
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("SQLite persistence failed (non-fatal): %s", e)
