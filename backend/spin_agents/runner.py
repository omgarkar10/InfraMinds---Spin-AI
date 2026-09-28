"""ADK Runner integration for the 3-agent pipeline with graceful execution and persistence."""

from __future__ import annotations

import json
import uuid
from typing import Any, Dict, Optional

from schemas.data_models import ChannelType, IngestionRequest
from spin_agents.pipeline.orchestrator import run_sequential_pipeline


async def run_pipeline(
    user_message: str,
    intake_payload: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Execute the SPIN 3-Agent pipeline and return funnelled JSON outputs.

    Backward-compatible adapter matching runner signatures.
    """
    intake = intake_payload or {}
    user_id = intake.get("user_id", "anonymous")
    channel_str = intake.get("channel", "pwa")
    try:
        channel = ChannelType(channel_str.lower())
    except Exception:
        channel = ChannelType.PWA

    lang = intake.get("source_language") or intake.get("language") or "hi"
    location = intake.get("location_data") or intake.get("location")
    media_url = intake.get("media_url")
    proxy_for = intake.get("proxy_filed_for")

    request = IngestionRequest(
        citizen_id=user_id,
        channel=channel,
        text=user_message or intake.get("original_text") or "",
        audio_url=intake.get("audio_url"),
        media_url=media_url,
        language=lang,
        location_hint=location,
        proxy_filed_for=proxy_for,
    )

    explicitly_confirmed = channel == ChannelType.PWA
    result = run_sequential_pipeline(request, explicitly_confirmed=explicitly_confirmed)
    sem = result.semantic_output
    ver = result.verification_output
    pol = result.policy_output

    final_resp = (
        pol.notification_payload.message_native
        if pol
        else (
            ver.read_back_card.confirmation_prompt
            if ver.read_back_card
            else "Please answer the verification questions to proceed."
        )
    )

    return {
        "session_id": str(uuid.uuid4()),
        "pipeline_status": "completed" if pol else "needs_verification",
        "intake_payload": intake,
        "semantic_parsing_output": sem.model_dump(),
        "dynamic_verification_output": ver.model_dump(),
        "policy_routing_output": pol.model_dump() if pol else None,
        "final_response": final_resp,
        # Backward-compatible keys for existing dashboards
        "parsed_payload": {
            "domain": sem.category.value.title(),
            "category": sem.category.value,
            "severity": sem.severity or 5,
            "confidence": sem.confidence_scores.category,
            "district": sem.location.district or "Unknown",
            "state": sem.location.state or "Unknown",
            "needs_human_review": sem.needs_clarification,
            "image_verified": sem.vision_alignment_status == "aligned",
            "lat_long": {
                "lat": sem.location.latitude or 0.0,
                "lng": sem.location.longitude or 0.0,
            },
        },
        "geospatial_result": {
            "grievance_id": pol.query_id if pol else "PENDING",
            "domain": sem.category.value.title(),
            "severity": sem.severity or 5,
            "user_id": user_id,
            "priority_gap": pol.is_red_zone_priority if pol else False,
        },
        "policy_output": {
            "executive_summary": pol.executive_summary.three_sentence_summary if (pol and pol.executive_summary) else "",
            "red_zone_alert": pol.is_red_zone_priority if pol else False,
            "notification_sent": bool(pol),
            "department": pol.department if pol else "Pending",
        },
    }
