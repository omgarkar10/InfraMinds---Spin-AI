import uuid
import logging
from typing import Optional
from datetime import datetime, timezone
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
    
    if result.get("pipeline_status") == "completed":
        parsed = result.get("parsed_payload", {})
        lat = parsed.get("lat_long", {}).get("lat", 0.0)
        lng = parsed.get("lat_long", {}).get("lng", 0.0)
        location_data = parsed.get("location", {})
        payload_for_db = {
            "user_id": intake.get("user_id"),
            "domain": parsed.get("domain"),
            "category": parsed.get("category"),
            "original_text": intake.get("original_text"),
            "english_translation": intake.get("english_translation"),
            "district": location_data.get("district"),
            "state": location_data.get("state"),
            "address": location_data.get("address"),
            "pincode": location_data.get("pincode"),
            "landmark": location_data.get("landmark_text"),
            "request_type": parsed.get("request_type", "maintenance"),
            "reason": parsed.get("reason"),
            "intended_beneficiaries": parsed.get("beneficiaries"),
            "media_url": intake.get("media_url"),
        }
        
        demand_id = result.get("policy_routing_output", {}).get("query_id") if result.get("policy_routing_output") else str(uuid.uuid4())
        
        persist_demand_to_db(demand_id, payload_for_db, lat, lng)
        result["demand_id"] = demand_id

    return {"status": "completed", **result}

def get_demands_list(limit: int = 50, author_user_id: Optional[str] = None) -> dict:
    db = get_firestore_db()
    if not db:
        return {"count": 0, "demands": []}
    
    demands_ref = db.collection("demands")
    if author_user_id:
        demands_ref = demands_ref.where("author_user_id", "==", author_user_id).order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit)
        docs = demands_ref.stream()
        demands = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            demands.append(data)
    else:
        demands_ref = demands_ref.order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit)
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

def get_demand_by_id(demand_id: str) -> dict:
    db = get_firestore_db()
    if not db:
        return None
    
    doc = db.collection("demands").document(demand_id).get()
    if not doc.exists:
        return None
        
    data = doc.to_dict()
    data["id"] = doc.id
    return data

def persist_demand_to_db(demand_id: str, payload: dict, lat: float, lng: float) -> str:
    db = get_firestore_db()
    if not db:
        return demand_id
    
    doc_ref = db.collection("demands").document(demand_id)
    
    author_user_id = payload.get("user_id", "anonymous")
    author_name = "Anonymous Citizen"
    if author_user_id != "anonymous":
        user_doc = db.collection("users").document(author_user_id).get()
        if user_doc.exists:
            author_name = user_doc.to_dict().get("name") or author_name
    
    demand_data = {
        "author_user_id": author_user_id,
        "author_name": author_name,
        "domain": payload.get("domain", "General"),
        "category": payload.get("category", "General"),
        "latitude": lat,
        "longitude": lng,
        "original_text": payload.get("original_text", ""),
        "english_translation": payload.get("english_translation", ""),
        "district": payload.get("district"),
        "state": payload.get("state"),
        "address": payload.get("address"),
        "pincode": payload.get("pincode"),
        "landmark": payload.get("landmark"),
        "request_type": payload.get("request_type", "maintenance"),
        "reason": payload.get("reason"),
        "intended_beneficiaries": payload.get("intended_beneficiaries"),
        "media_urls": [payload.get("media_url")] if payload.get("media_url") else [],
        "status": "gathering_support",
        "vote_count": 0,
        "vote_threshold": 100,
        "timeline": [
            {
                "title": "Demand Registered",
                "description": "Request safely stored in authoritative municipal database",
                "date": datetime.now(timezone.utc).isoformat(),
                "completed": True
            }
        ],
        "created_at": firestore.SERVER_TIMESTAMP,
        "status_updated_at": firestore.SERVER_TIMESTAMP,
    }
    
    doc_ref.set(demand_data)
    
    # Cast initial vote for the author
    cast_vote(demand_id, demand_data["author_user_id"])
    
    return doc_ref.id

def cast_vote(demand_id: str, user_id: str) -> bool:
    db = get_firestore_db()
    if not db:
        return True
    
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

def get_user_votes(user_id: str) -> list[str]:
    db = get_firestore_db()
    if not db:
        return []
    
    docs = db.collection("demand_votes").where("user_id", "==", user_id).stream()
    return [d.to_dict().get("demand_id") for d in docs]
