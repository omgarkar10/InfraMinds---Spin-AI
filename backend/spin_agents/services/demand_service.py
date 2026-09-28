import uuid
import logging
from typing import Optional
from google.cloud import firestore

from spin_agents.db import get_firestore_db
from spin_agents.runner import run_pipeline
from spin_agents.tools.bhashini import bhashini_asr, bhashini_translate

logger = logging.getLogger(__name__)
HITL_PROMPT = "Where is the issue located? Share GPS pin or nearest landmark."

async def translate_text(text: str, source_language: str) -> dict[str, str]:
    if source_language != "en":
        return await bhashini_translate(text, source_language, "en")
    return {
        "original_text": text,
        "english_translation": text,
        "source_language": "en",
    }

def build_intake(translation: dict[str, str], user_id: str, media_url: Optional[str], location: Optional[dict], source_language: str) -> dict:
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

def get_demands_list(limit: int = 50) -> dict:
    db = get_firestore_db()
    demands_ref = db.collection("demands").order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit)
    docs = demands_ref.stream()
    
    demands = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        demands.append(data)
        
    return {
        "count": len(demands),
        "demands": demands,
    }

def persist_demand_to_db(demand_id: str, payload: dict, lat: float, lng: float) -> str:
    db = get_firestore_db()
    doc_ref = db.collection("demands").document(demand_id)
    
    demand_data = {
        "author_user_id": payload.get("user_id", "anonymous"),
        "domain": payload.get("domain", "General"),
        "category": payload.get("category", "General"),
        "latitude": lat,
        "longitude": lng,
        "original_text": payload.get("original_text", ""),
        "english_translation": payload.get("english_translation", ""),
        "district": payload.get("district"),
        "state": payload.get("state"),
        "status": "gathering_support",
        "vote_count": 1,
        "vote_threshold": 100,
        "created_at": firestore.SERVER_TIMESTAMP,
        "status_updated_at": firestore.SERVER_TIMESTAMP,
    }
    
    doc_ref.set(demand_data)
    
    # Cast initial vote for the author
    cast_vote(demand_id, demand_data["author_user_id"])
    
    return doc_ref.id

def cast_vote(demand_id: str, user_id: str) -> bool:
    db = get_firestore_db()
    vote_id = f"{demand_id}_{user_id}"
    vote_ref = db.collection("demand_votes").document(vote_id)
    
    if vote_ref.get().exists:
        return False
        
    vote_ref.set({
        "demand_id": demand_id,
        "user_id": user_id,
        "created_at": firestore.SERVER_TIMESTAMP
    })
    
    # Increment vote count on demand
    demand_ref = db.collection("demands").document(demand_id)
    demand_ref.update({
        "vote_count": firestore.Increment(1)
    })
    
    return True
