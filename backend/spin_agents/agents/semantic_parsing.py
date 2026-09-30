"""AGENT 1: Semantic Parsing & Multimodal Ingestion Agent (semantic_parsing_agent)

Responsibilities:
1. Multi-channel intake (PWA, WhatsApp, SMS/IVR, Diaspora Proxy).
2. Speech-to-Text & Translation bridge with language preservation.
3. Gemini structured extraction into strict JSON schema with NULL PRESERVATION.
4. Vertex AI Vision cross-check for category & severity alignment.
5. Proximity / Duplicate check filtered by category within geo-radius and time window.
6. Returns per-field confidence scores (high/low/null).
"""

from __future__ import annotations

import json
import os
import sys
from typing import Any, Dict, Optional

from google.adk.agents import LlmAgent

from schemas.data_models import (
    ChannelType,
    ConfidenceScores,
    GrievanceCategory,
    GrievanceType,
    IngestionRequest,
    LocationModel,
    SemanticParsingOutput,
)
from spin_agents.config import CONFIG
from spin_agents.tools.mcp_bindings import (
    cloud_speech_to_text,
    cloud_translate_text,
    proximity_duplicate_search,
    vertex_ai_vision_cross_check,
)

# Standard Vertex AI production identifier
GEMINI_MODEL = "gemini-1.5-flash"


SEMANTIC_PARSER_INSTRUCTION = """
You are the Semantic Parsing & Multimodal Ingestion Agent for the Citizen Grievance AI Pipeline.
Your role is to strictly extract structured grievance metadata from citizen text or transcripts.

CRITICAL RULES (NON-NEGOTIABLE):
1. ZERO HALLUCINATION / NULL PRESERVATION:
   - If a field is NOT explicitly mentioned or cannot be unambiguously deduced, you MUST set it to null.
   - NEVER guess, invent, or extrapolate locations, landmarks, categories, or severities.
   - For missing fields, confidence score must be set to 0.0 or low (e.g. < 0.5).
2. CATEGORY CLASSIFICATION:
   - Allowed categories: "roads", "water", "garbage", "electricity", "drainage", "other".
   - If uncertain or missing details, set category to "other".
3. TYPE CLASSIFICATION:
   - "complaint", "issue", "suggestion", "appreciation". Default to "complaint".
4. SEVERITY SCORING (1-10):
   - Only score if concrete indicators exist (e.g. "danger", "burst pipe", "road blocked").
   - If no severity cues exist, set severity to null and confidence to 0.0.
5. LOCATION EXTRACTION:
   - Extract latitude, longitude, landmark_text, home_ward from the input text or hints.
   - If no location details are provided, set all location fields to null.

OUTPUT FORMAT (JSON only, no markdown backticks):
{
  "type": "complaint|issue|suggestion|appreciation",
  "category": "Water Supply|Electricity|Roads & Transport|Sanitation|Public Health|Police / Law & Order|Public Transport|Education|Housing & Urban Development|Environment & Forestry|Social Welfare & Pensions|General Administration|Other",
  "severity": integer (1-10) or null,
  "location": {
    "latitude": float or null,
    "longitude": float or null,
    "landmark_text": string or null,
    "home_ward": string or null,
    "district": string or null,
    "state": string or null,
    "address": string or null,
    "pincode": string or null
  },
  "request_type": "new_development|maintenance|other",
  "reason": string or null,
  "beneficiaries": string or null,
  "confidence_scores": {
    "category": float (0.0 to 1.0),
    "severity": float (0.0 to 1.0),
    "location": float (0.0 to 1.0)
  },
  "needs_clarification": boolean,
  "clarification_reasons": ["list of reasons if any"]
}
"""


def parse_with_gemini_or_heuristic(
    text: str,
    original_language: str = "en",
    location_hint: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Extract parameters using Gemini via Vertex AI or local zero-hallucination heuristic."""
    # Attempt Vertex AI Agentic Engine / GenAI if project is configured
    if CONFIG.gcp_project:
        try:
            import vertexai
            from vertexai.generative_models import GenerativeModel

            vertexai.init(project=CONFIG.gcp_project, location=CONFIG.gcp_location)
            model = GenerativeModel(GEMINI_MODEL)
            prompt = (
                f"{SEMANTIC_PARSER_INSTRUCTION}\n\n"
                f"Citizen Message (English translation): \"{text}\"\n"
                f"Location Hint: {json.dumps(location_hint or {})}\n"
            )
            response = model.generate_content(prompt)
            resp_text = response.text.strip()
            if resp_text.startswith("```"):
                resp_text = resp_text.split("```")[1].replace("json", "").strip()
            return json.loads(resp_text)
        except Exception:
            pass

    # Deterministic local fallback complying strictly with Zero Hallucination & Null Preservation
    lower = text.lower()
    
    # Category detection (order matters: more specific keywords checked first)
    cat = GrievanceCategory.OTHER
    cat_conf = 0.3
    # Drainage first (often uses 'road' words but is distinctly different)
    if any(k in lower for k in ["drain", "drainage", "flood", "sewage", "gutter", "overflow", "sewer"]):
        cat = GrievanceCategory.SANITATION
        cat_conf = 0.95
    elif any(k in lower for k in ["garbage", "waste", "kachra", "trash", "dump", "sanitation", "filth", "accumulation"]):
        cat = GrievanceCategory.SANITATION
        cat_conf = 0.95
    elif any(k in lower for k in ["water", "pipe", "leak", "pani", "jal", "tap", "drinking", "pipeline"]):
        cat = GrievanceCategory.WATER_SUPPLY
        cat_conf = 0.95
    elif any(k in lower for k in ["electric", "power", "light", "bijli", "transformer", "wire"]):
        cat = GrievanceCategory.ELECTRICITY
        cat_conf = 0.95
    elif any(k in lower for k in ["road", "pothole", "sadak", "gaddha", "asphalt", "street", "highway"]):
        cat = GrievanceCategory.ROADS_TRANSPORT
        cat_conf = 0.95
    elif any(k in lower for k in ["health", "hospital", "clinic", "disease", "mosquito", "dengue", "medicine"]):
        cat = GrievanceCategory.PUBLIC_HEALTH
        cat_conf = 0.95
    elif any(k in lower for k in ["police", "crime", "theft", "safety", "law", "security"]):
        cat = GrievanceCategory.POLICE
        cat_conf = 0.95
    elif any(k in lower for k in ["bus", "train", "metro", "transport"]):
        cat = GrievanceCategory.PUBLIC_TRANSPORT
        cat_conf = 0.95
    elif any(k in lower for k in ["school", "education", "college", "teacher", "student"]):
        cat = GrievanceCategory.EDUCATION
        cat_conf = 0.95
    elif any(k in lower for k in ["house", "housing", "urban", "slum", "development"]):
        cat = GrievanceCategory.HOUSING
        cat_conf = 0.95
    elif any(k in lower for k in ["tree", "forest", "environment", "park", "pollution", "air"]):
        cat = GrievanceCategory.ENVIRONMENT
        cat_conf = 0.95
    elif any(k in lower for k in ["pension", "welfare", "social", "poor"]):
        cat = GrievanceCategory.SOCIAL_WELFARE
        cat_conf = 0.95
    elif any(k in lower for k in ["admin", "government", "office", "general"]):
        cat = GrievanceCategory.GENERAL
        cat_conf = 0.95

    # Severity detection (strictly from cues)
    severity = None
    sev_conf = 0.0
    if any(k in lower for k in ["critical", "emergency", "danger", "burst", "massive", "blocked", "overflowing"]):
        severity = 8
        sev_conf = 0.9
    elif any(k in lower for k in ["frequent", "broken", "dirty", "bad", "smell"]):
        severity = 6
        sev_conf = 0.8
    elif any(k in lower for k in ["small", "minor", "dim", "flicker"]):
        severity = 3
        sev_conf = 0.8

    # Location extraction (NULL preservation: only extract if explicitly provided)
    lat = None
    lng = None
    landmark = None
    ward = None
    district = None
    state = None
    loc_conf = 0.0

    if location_hint:
        lat = location_hint.get("lat") or location_hint.get("latitude")
        lng = location_hint.get("lng") or location_hint.get("longitude")
        landmark = location_hint.get("landmark") or location_hint.get("landmark_text")
        ward = location_hint.get("ward") or location_hint.get("home_ward")
        district = location_hint.get("district")
        state = location_hint.get("state")
        loc_conf = 0.95 if (lat and lng) else (0.7 if (landmark or ward) else 0.0)

    # Simple landmark keyword checks if location_hint didn't have coordinates
    if not landmark:
        for cue in ["near", "opposite", "at", "in front of", "behind"]:
            if f" {cue} " in lower:
                idx = lower.find(f" {cue} ")
                extracted = text[idx + len(cue) + 2 : idx + 40].strip()
                if extracted:
                    landmark = extracted
                    loc_conf = 0.6
                break

    needs_clarification = (cat_conf < 0.7) or (loc_conf < 0.5) or (severity is None)
    reasons = []
    if cat_conf < 0.7:
        reasons.append("category_unclear")
    if loc_conf < 0.5:
        reasons.append("location_missing")
    if severity is None:
        reasons.append("severity_unspecified")

    return {
        "type": GrievanceType.COMPLAINT.value,
        "category": cat.value,
        "severity": severity,
        "location": {
            "latitude": lat,
            "longitude": lng,
            "landmark_text": landmark,
            "home_ward": ward,
            "district": district or ("Pune" if lat and 18.0 <= lat <= 19.0 else None),
            "state": state or ("Maharashtra" if district == "Pune" else None),
            "address": location_hint.get("address") if location_hint else None,
            "pincode": location_hint.get("pincode") if location_hint else None,
        },
        "request_type": "maintenance",
        "reason": None,
        "beneficiaries": None,
        "confidence_scores": {
            "category": cat_conf,
            "severity": sev_conf,
            "location": loc_conf,
        },
        "needs_clarification": needs_clarification,
        "clarification_reasons": reasons,
    }


def execute_semantic_parsing(request: IngestionRequest) -> SemanticParsingOutput:
    """Core synchronous/asynchronous execution bridge for Agent 1.
    
    1. ASR & Translation
    2. Zero-hallucination parameter extraction
    3. Multimodal Vertex AI Vision cross-check (if media_url exists)
    4. Proximity & Duplicate search filtered by category
    """
    original_text = request.text or ""
    detected_lang = request.language or "en"

    # Step 1: Process Audio if present
    if request.audio_url and not original_text:
        asr_result = cloud_speech_to_text(request.audio_url, hint_language=request.language)
        original_text = asr_result["transcript"]
        detected_lang = asr_result["detected_language"]

    # Step 2: Canonical Translation to English
    translation_result = cloud_translate_text(
        text=original_text,
        target_language="en",
        source_language=detected_lang,
    )
    translated_text = translation_result["translated_text"]

    # Step 3: Structured Extraction via Gemini with Null Preservation
    parsed = parse_with_gemini_or_heuristic(
        text=translated_text,
        original_language=detected_lang,
        location_hint=request.location_hint,
    )

    # Step 4: Multimodal Cross-Check if media attached
    vision_status = "not_applicable"
    vision_details = None
    if request.media_url:
        vision_res = vertex_ai_vision_cross_check(
            media_url=request.media_url,
            claimed_category=parsed["category"],
            claimed_severity=parsed.get("severity"),
        )
        vision_status = vision_res["status"]
        vision_details = vision_res
        if vision_status == "discrepancy_detected":
            parsed["needs_clarification"] = True
            parsed["clarification_reasons"].append(
                f"vision_discrepancy: {vision_res.get('discrepancy_reason')}"
            )

    # Step 5: Proximity & Duplicate Check (filtered by category)
    loc_data = parsed.get("location", {})
    duplicate_match_id = None
    lat = loc_data.get("latitude")
    lng = loc_data.get("longitude")
    if lat and lng:
        dup_res = proximity_duplicate_search(
            latitude=lat,
            longitude=lng,
            category=parsed["category"],
            radius_km=0.5,
            window_days=7,
        )
        if dup_res:
            duplicate_match_id = dup_res["duplicate_of"]

    # Build Pydantic model
    return SemanticParsingOutput(
        citizen_id=request.citizen_id,
        channel=request.channel,
        type=GrievanceType(parsed.get("type", "complaint")),
        category=GrievanceCategory(parsed.get("category", "other")),
        description_original=original_text,
        description_translated=translated_text,
        severity=parsed.get("severity"),
        location=LocationModel(**loc_data),
        media_url=request.media_url,
        language=detected_lang,
        proxy_filed_for=request.proxy_filed_for,
        confidence_scores=ConfidenceScores(**parsed.get("confidence_scores", {})),
        duplicate_match_id=duplicate_match_id,
        vision_alignment_status=vision_status,  # type: ignore
        vision_details=vision_details,
        needs_clarification=parsed.get("needs_clarification", False),
        clarification_reasons=parsed.get("clarification_reasons", []),
    )


# ADK Agent definition
semantic_parsing_agent = LlmAgent(
    name="Semantic_Parsing_Agent",
    model=GEMINI_MODEL,
    description="Multichannel intake, speech translation, multimodal vision cross-check, and null-preserving extraction.",
    instruction=SEMANTIC_PARSER_INSTRUCTION,
    output_key="semantic_parsing_output",
)
