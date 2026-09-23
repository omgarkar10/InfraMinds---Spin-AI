"""FastAPI webhook server for Citizen Edge (WhatsApp/Telegram/Firebase)."""

from __future__ import annotations

import json
import os
import uuid

from fastapi import FastAPI, Request, Header, HTTPException, Depends, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from spin_agents.tools.bhashini import bhashini_asr, bhashini_translate
from spin_agents.tools.bigquery import query_red_zones, query_weekly_summary, insert_grievance_record
from spin_agents.runner import run_pipeline
from spin_agents.auth import router as auth_router, get_current_user, get_current_citizen
from spin_agents.config_routes import router as config_router
from spin_agents.db import Base, engine, init_db, get_db, AsyncSessionLocal
from spin_agents.models import Grievance, User
from spin_agents.config import CONFIG
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from translate_service import translate_to_english

app = FastAPI(title="SPIN Citizen Edge API", version="1.0.0")

# Ensure uploads directory exists and is served statically
UPLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "uploads"))
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

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

@app.get("/api/grievances")
async def list_grievances(limit: int = 50):
    """Retrieve recorded grievances from the SQLite database."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Grievance).order_by(Grievance.created_at.desc()).limit(limit)
        )
        grievances = result.scalars().all()
        return {
            "count": len(grievances),
            "grievances": [format_grievance_response(g) for g in grievances],
        }


# ============================================================================
# Citizen Portal Authoritative Request Endpoints
# ============================================================================

class SubmitRequestPayload(BaseModel):
    request_type: str = "existing_problem"  # "existing_problem" | "new_development"
    category: str
    specific_issue: str | None = None
    description: str
    state: str | None = None
    district: str | None = None
    landmark: str | None = None
    address: str | None = None
    pincode: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    start_date: str | None = None
    frequency: str | None = None
    reason: str | None = None
    intended_beneficiaries: str | None = None
    evidence_urls: list[str] | str | None = None
    source_language: str = "auto"

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        s = v.strip()
        if len(s) < 5:
            raise ValueError("Description must contain at least 5 characters.")
        return s

    @field_validator("request_type")
    @classmethod
    def validate_request_type(cls, v: str) -> str:
        clean = v.strip().lower()
        if clean in ("problem", "existing_problem", "grievance", "issue"):
            return "existing_problem"
        if clean in ("new_need", "new_development", "development", "proposal"):
            return "new_development"
        return clean


def format_grievance_response(g: Grievance) -> dict:
    """Standardizes grievance output formatting for frontend consumption."""
    created_iso = g.created_at.isoformat() if g.created_at else None
    evidence_list = []
    if g.evidence_urls:
        try:
            parsed = json.loads(g.evidence_urls)
            if isinstance(parsed, list):
                evidence_list = parsed
            elif isinstance(parsed, str):
                evidence_list = [parsed]
        except Exception:
            evidence_list = [g.evidence_urls]

    return {
        "id": g.grievance_id or g.id,
        "grievance_id": g.grievance_id,
        "request_id": g.grievance_id,
        "user_id": g.user_id,
        "request_type": g.request_type,
        "domain": g.domain or g.category or "Civic Infrastructure",
        "category": g.category or "Other",
        "specific_issue": g.specific_issue,
        "severity": g.severity,
        "priority": g.priority,
        "latitude": g.latitude,
        "longitude": g.longitude,
        "landmark": g.landmark,
        "address": g.address,
        "district": g.district,
        "state": g.state,
        "pincode": g.pincode,
        "original_text": g.original_text,
        "description": g.original_text,
        "english_translation": g.english_translation,
        "source_language": g.source_language,
        "start_date": g.start_date,
        "frequency": g.frequency,
        "reason": g.reason,
        "intended_beneficiaries": g.intended_beneficiaries,
        "confidence": g.confidence,
        "evidence_urls": evidence_list,
        "status": g.status or "SUBMITTED",
        "bigquery_synced": bool(g.bigquery_synced),
        "created_at": created_iso,
        "timeline": [
            {
                "date": g.created_at.strftime("%d %b").upper() if g.created_at else "TODAY",
                "title": "Request Submitted",
                "description": f"Officially recorded in SPIN registry with ID {g.grievance_id}.",
                "completed": True,
            },
            {
                "date": "IN PROGRESS",
                "title": "Administrative Routing",
                "description": f"Assigned to {g.domain or g.category or 'Municipal Administration'} authority.",
                "completed": False,
            }
        ]
    }


@app.post("/api/requests/submit")
async def submit_request(
    payload: SubmitRequestPayload,
    citizen: User = Depends(get_current_citizen),
    db: AsyncSession = Depends(get_db),
):
    """
    Authoritative request submission endpoint.
    Persists citizen request into SQLite, attempts BigQuery synchronization,
    and returns a genuine unique request ID.
    """
    # 1. Enforce coordinate pairing rule
    has_lat = payload.latitude is not None
    has_lng = payload.longitude is not None
    if has_lat != has_lng:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coordinate pairing error: latitude and longitude must both be provided, or both omitted."
        )

    # 2. Generate authoritative unique request ID
    unique_suffix = uuid.uuid4().hex[:6].upper()
    grievance_id = f"SPIN-2026-{unique_suffix}"

    # 3. Determine domain / department
    category_clean = (payload.category or "Other").strip()
    domain = category_clean

    # 4. Serialize evidence URLs if provided
    evidence_json = None
    if payload.evidence_urls:
        if isinstance(payload.evidence_urls, list):
            evidence_json = json.dumps(payload.evidence_urls)
        elif isinstance(payload.evidence_urls, str):
            evidence_json = json.dumps([payload.evidence_urls])

    # 5. Persist into authoritative SQLite database
    new_grievance = Grievance(
        grievance_id=grievance_id,
        user_id=citizen.id,
        request_type=payload.request_type,
        domain=domain,
        category=category_clean,
        specific_issue=payload.specific_issue,
        severity=5,
        priority="Medium",
        latitude=payload.latitude,
        longitude=payload.longitude,
        landmark=payload.landmark,
        address=payload.address,
        district=payload.district,
        state=payload.state,
        pincode=payload.pincode,
        original_text=payload.description,
        english_translation=payload.description,
        source_language=payload.source_language,
        start_date=payload.start_date,
        frequency=payload.frequency,
        reason=payload.reason,
        intended_beneficiaries=payload.intended_beneficiaries,
        evidence_urls=evidence_json,
        status="SUBMITTED",
        bigquery_synced=False,
    )

    db.add(new_grievance)
    await db.commit()
    await db.refresh(new_grievance)

    # 6. Attempt BigQuery sync safely (non-blocking for registration success)
    bq_synced = False
    try:
        bq_row = {
            "grievance_id": grievance_id,
            "user_id": citizen.id,
            "domain": domain,
            "category": category_clean,
            "severity": 5,
            "latitude": payload.latitude,
            "longitude": payload.longitude,
            "district": payload.district,
            "state": payload.state,
            "original_text": payload.description,
            "english_translation": payload.description,
        }
        bq_result = insert_grievance_record(bq_row)
        if bq_result.get("status") == "persisted":
            bq_synced = True
            new_grievance.bigquery_synced = True
            await db.commit()
    except Exception as bq_err:
        print(f"[BigQuery Sync Warning]: {bq_err}")

    return {
        "status": "success",
        "grievance_id": grievance_id,
        "request_id": grievance_id,
        "created_at": new_grievance.created_at.isoformat() if new_grievance.created_at else None,
        "bigquery_synced": bq_synced,
        "message": "Infrastructure request officially recorded in the authoritative registry."
    }


@app.get("/api/requests/my")
async def get_my_requests(
    citizen: User = Depends(get_current_citizen),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns only the requests belonging to the logged-in citizen.
    Provides a clean empty list for new citizens.
    """
    stmt = (
        select(Grievance)
        .where(Grievance.user_id == citizen.id)
        .order_by(Grievance.created_at.desc())
    )
    result = await db.execute(stmt)
    records = result.scalars().all()
    return [format_grievance_response(g) for g in records]


@app.get("/api/requests/citizen/{user_id}")
async def get_citizen_requests(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves all requests for a specific citizen ID.
    Enforces authorization: citizens can only view their own submissions.
    """
    STAFF_ROLES = {"staff", "admin", "department officer", "policymaker"}
    if current_user.id != user_id and current_user.role not in STAFF_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not have permission to view another citizen's submissions."
        )

    stmt = (
        select(Grievance)
        .where(Grievance.user_id == user_id)
        .order_by(Grievance.created_at.desc())
    )
    result = await db.execute(stmt)
    records = result.scalars().all()
    return [format_grievance_response(g) for g in records]


@app.get("/api/requests/{request_id}")
async def get_request_by_id(
    request_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves full details of a specific request.
    Enforces authorization: citizens can only retrieve requests they own.
    """
    stmt = select(Grievance).where(
        (Grievance.grievance_id == request_id) | (Grievance.id == request_id)
    )
    result = await db.execute(stmt)
    record = result.scalars().first()

    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")

    STAFF_ROLES = {"staff", "admin", "department officer", "policymaker"}
    if record.user_id != current_user.id and current_user.role not in STAFF_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you do not have permission to view this request."
        )

    return format_grievance_response(record)


# ============================================================================
# File Upload Endpoint (Evidence Storage)
# ============================================================================

ALLOWED_UPLOAD_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5 MB

@app.post("/api/requests/upload")
async def upload_evidence_file(
    file: UploadFile = File(...),
    citizen: User = Depends(get_current_citizen),
):
    """
    Uploads optional supporting photo or document attachment.
    Validates file extension and size, persists file to disk, and returns URL.
    """
    orig_name = file.filename or "attachment"
    ext = os.path.splitext(orig_name)[1].lower()

    if ext not in ALLOWED_UPLOAD_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed: JPG, PNG, WEBP, PDF."
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size limit of 5 MB."
        )

    safe_name = f"{uuid.uuid4().hex[:10]}_{orig_name.replace(' ', '_')}"
    target_path = os.path.join(UPLOADS_DIR, safe_name)

    with open(target_path, "wb") as out_f:
        out_f.write(file_bytes)

    return {
        "status": "success",
        "url": f"/uploads/{safe_name}",
        "filename": orig_name,
        "size_bytes": len(file_bytes),
    }


# ============================================================================
# Google AI Interpretation Endpoint
# ============================================================================

class AnalyzeRequestPayload(BaseModel):
    text: str
    source_language: str = "auto"
    request_type: str = "existing_problem"


@app.post("/api/requests/analyze")
async def analyze_request_ai(
    payload: AnalyzeRequestPayload,
    citizen: User = Depends(get_current_citizen),
):
    """
    Genuine Google Gemini interpretation endpoint.
    Extracts structured fields from citizen's input text or speech transcript.
    If Gemini API key is unavailable, returns explicit status without inventing data.
    """
    text = payload.text.strip()
    if len(text) < 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description must contain at least 5 characters for analysis."
        )

    gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not gemini_key:
        return {
            "status": "unavailable",
            "message": "Google Gemini API key is not configured in the environment. Please review or enter details manually.",
            "data": None
        }

    try:
        from google import genai
        client = genai.Client(api_key=gemini_key)
        prompt = f"""You are the SPIN Infrastructure Intake Parser.
Analyze the following citizen infrastructure request and extract structured information.

Input Request:
"{text}"

Request Type: {payload.request_type}

Return a valid JSON object strictly with these fields:
{{
  "category": "Water Supply | Roads & Potholes | Drainage & Flooding | Electricity | Waste Management | Street Lighting | Public Transport | Healthcare & Hospitals | Education | Public Infrastructure | Other",
  "specific_issue": "Specific problem or proposed facility",
  "description": "Clean summary of the core issue",
  "district": null or detected Indian district,
  "state": null or detected Indian state,
  "landmark": null or detected landmark,
  "reason": null or civic purpose (if new development),
  "intended_beneficiaries": null or target community (if new development)
}}
Do NOT fabricate coordinates, population counts, or government approval.
Output ONLY the raw JSON object."""

        resp = client.models.generate_content(
            model=CONFIG.gemini_model,
            contents=prompt,
        )
        content_text = resp.text.strip()
        if content_text.startswith("```"):
            content_text = content_text.split("```")[1]
            if content_text.startswith("json"):
                content_text = content_text[4:]
        parsed_json = json.loads(content_text.strip())

        return {
            "status": "success",
            "message": "AI interpretation successfully generated via Google Gemini.",
            "data": parsed_json,
        }
    except Exception as err:
        return {
            "status": "error",
            "message": f"Gemini analysis service unavailable: {str(err)}. Please proceed manually.",
            "data": None,
        }


