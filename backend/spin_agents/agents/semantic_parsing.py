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
GEMINI_MODEL = CONFIG.gemini_model


SEMANTIC_PARSER_INSTRUCTION = """
You are the Semantic Parsing & Multimodal Ingestion Agent for the Citizen Grievance AI Pipeline.
Your role is to strictly extract structured grievance metadata from citizen text or transcripts.

CRITICAL RULES (NON-NEGOTIABLE):
1. ZERO HALLUCINATION / NULL PRESERVATION:
   - If a field is NOT explicitly mentioned or cannot be unambiguously deduced, you MUST set it to null.
   - NEVER guess, invent, or extrapolate locations, landmarks, categories, or severities.
   - For missing fields, confidence score must be set to 0.0 or low (e.g. < 0.5).
2. CATEGORY CLASSIFICATION:
   - Allowed categories: "Water Supply", "Electricity", "Roads & Transport", "Sanitation", "Public Health", "Police / Law & Order", "Public Transport", "Education", "Housing & Urban Development", "Environment & Forestry", "Social Welfare & Pensions", "General Administration", "Other".
   - Parks, playgrounds, gardens, community halls, and urban amenities map to "Housing & Urban Development".
   - If uncertain or missing details, set category to "Other".
3. TYPE CLASSIFICATION:
   - "complaint" or "issue" for broken/damaged existing infrastructure.
   - "suggestion" for new facilities (new park, new school, new road, new clinic).
4. REQUEST TYPE:
   - "new_development" if the citizen asks for something new to be built or provided.
   - "maintenance" if they report an existing asset that is damaged or not working.
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


def _coerce_category(raw: Any) -> GrievanceCategory:
    try:
        return GrievanceCategory(raw)
    except Exception:
        pass
    aliases = {item.value.lower(): item for item in GrievanceCategory}
    aliases.update({item.name.lower(): item for item in GrievanceCategory})
    aliases.update({
        "water": GrievanceCategory.WATER_SUPPLY,
        "roads": GrievanceCategory.ROADS_TRANSPORT,
        "garbage": GrievanceCategory.SANITATION,
        "drainage": GrievanceCategory.SANITATION,
        "housing": GrievanceCategory.HOUSING,
        "environment": GrievanceCategory.ENVIRONMENT,
        "other": GrievanceCategory.OTHER,
    })
    return aliases.get(str(raw or "").lower().strip(), GrievanceCategory.OTHER)


def _coerce_type(raw: Any) -> GrievanceType:
    try:
        return GrievanceType(raw)
    except Exception:
        return GrievanceType.COMPLAINT


def parse_with_gemini(
    text: str,
    location_hint: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Extract parameters using Gemini model directly."""
    if CONFIG.gcp_project:
        try:
            import vertexai
            from vertexai.generative_models import GenerativeModel, GenerationConfig

            vertexai.init(project=CONFIG.gcp_project, location=CONFIG.gcp_location)
            model = GenerativeModel(GEMINI_MODEL)
            prompt = (
                f"{semantic_parsing_agent.instruction}\n\n"
                f"Citizen Message (English translation): \"{text}\"\n"
                f"Location Hint: {json.dumps(location_hint or {})}\n"
            )
            response = model.generate_content(
                prompt,
                generation_config=GenerationConfig(
                    response_mime_type="application/json"
                )
            )
            resp_text = response.text.strip()
            if resp_text.startswith("```"):
                resp_text = resp_text.split("```")[1].replace("json", "").strip()
            parsed = json.loads(resp_text)
            
            # Ensure required keys exist with safe defaults
            parsed.setdefault("confidence_scores", {"category": 1.0, "severity": 1.0, "location": 1.0})
            parsed.setdefault("location", location_hint or {})
            parsed.setdefault("request_type", "maintenance")
            return parsed
        except Exception:
            pass

    return {
        "type": "complaint",
        "category": "Other",
        "severity": None,
        "location": location_hint or {},
        "request_type": "other",
        "reason": None,
        "beneficiaries": None,
        "confidence_scores": {"category": 0.0, "severity": 0.0, "location": 0.0},
        "needs_clarification": True,
        "clarification_reasons": ["gemini_fallback"]
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

    # Step 1: Process Audio if present (Handled upstream, but kept for standalone support)
    if request.audio_url and not original_text:
        asr_result = cloud_speech_to_text(request.audio_url, hint_language=request.language)
        original_text = asr_result["transcript"]
        detected_lang = asr_result["detected_language"]

    # Since the runner passes the english_translation as request.text, we can skip cloud translation.
    translated_text = original_text

    # Step 3: Structured Extraction via Gemini with Null Preservation
    parsed = parse_with_gemini(
        text=translated_text,
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
        type=_coerce_type(parsed.get("type", "complaint")),
        category=_coerce_category(parsed.get("category", "Other")),
        description_original=original_text,
        description_translated=translated_text,
        severity=parsed.get("severity"),
        location=LocationModel(**loc_data),
        media_url=request.media_url,
        language=detected_lang,
        proxy_filed_for=request.proxy_filed_for,
        request_type=parsed.get("request_type", "maintenance"),
        reason=parsed.get("reason"),
        beneficiaries=parsed.get("beneficiaries"),
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
