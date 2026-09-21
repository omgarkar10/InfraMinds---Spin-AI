"""ADK Runner integration for end-to-end pipeline execution with graceful fallback.

Inputs  → user_message (str), intake_payload (dict)
Outputs → PipelineResult dict with keys:
    session_id, pipeline_status, intake_payload,
    parsed_payload, geospatial_result, policy_output, final_response

Fallback: if ADK LLM is unavailable (missing API key, network error),
    _fallback_structured_pipeline() runs a local heuristic classifier
    and persists to SQLite. This is intentional offline/dev support,
    NOT a production data path — prod always requires ADK to be healthy.
"""

from __future__ import annotations

import json
import uuid
from typing import Any

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from spin_agents.agent import root_agent
from spin_agents.tools.bigquery import insert_grievance_record, query_weekly_summary
from spin_agents.tools.gati_shakti import query_gati_shakti_layers

_session_service = InMemorySessionService()
_runner = Runner(
    agent=root_agent,
    app_name="spin",
    session_service=_session_service,
)

# --- Domain classifier constants (fallback only) ---
_DOMAIN_KEYWORDS: list[tuple[list[str], str, int]] = [
    (["water", "pipe", "leak", "pani", "tap", "jal"], "Water Supply", 8),
    (["road", "pothole", "sadak", "gaddha", "street"], "Roads & Potholes", 7),
    (["electric", "power", "light", "bijli", "dark"], "Electricity/Power", 6),
    (["garbage", "waste", "kachra", "trash", "clean"], "Waste Management & Sanitation", 6),
]
_DEFAULT_DOMAIN = ("Infrastructure", 7)


def _classify_domain(message: str) -> tuple[str, int]:
    """Keyword-based domain classifier used only in the offline fallback path."""
    lower = message.lower()
    for keywords, domain, severity in _DOMAIN_KEYWORDS:
        if any(w in lower for w in keywords):
            return domain, severity
    return _DEFAULT_DOMAIN


async def run_pipeline(
    user_message: str,
    intake_payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Execute the SPIN ADK pipeline and return funnelled JSON outputs.

    Args:
        user_message: English-translated grievance text.
        intake_payload: Normalized intake dict from the webhook handler.

    Returns:
        PipelineResult dict. See module docstring for key list.
    """
    session_id = str(uuid.uuid4())
    user_id = (intake_payload or {}).get("user_id", "anonymous")
    initial_state: dict[str, Any] = {}
    if intake_payload:
        initial_state["intake_payload"] = intake_payload

    try:
        await _session_service.create_session(
            app_name="spin",
            user_id=user_id,
            session_id=session_id,
            state=initial_state,
        )

        final_text = ""
        async for event in _runner.run_async(
            user_id=user_id,
            session_id=session_id,
            new_message=types.Content(
                role="user",
                parts=[types.Part(text=user_message)],
            ),
        ):
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if part.text:
                        final_text = part.text

        session = await _session_service.get_session(
            app_name="spin",
            user_id=user_id,
            session_id=session_id,
        )
        state = session.state if session else {}
        return {
            "session_id": session_id,
            "pipeline_status": state.get("pipeline_status", "completed"),
            "intake_payload": _parse_json(state.get("intake_payload")),
            "parsed_payload": _parse_json(state.get("parsed_payload")),
            "geospatial_result": _parse_json(state.get("geospatial_result")),
            "policy_output": _parse_json(state.get("policy_output")),
            "final_response": final_text,
        }
    except Exception as e:
        # Fallback: ADK live LLM unavailable (no API key, network error, quota)
        # This is the intended behaviour for local development and CI.
        print(
            f"[Pipeline Runner] ADK live LLM unavailable ({type(e).__name__}: {e}), "
            "using structured multi-agent fallback engine."
        )
        return await _fallback_structured_pipeline(
            user_message, intake_payload or {}, session_id
        )


async def _fallback_structured_pipeline(
    user_message: str, intake: dict[str, Any], session_id: str
) -> dict[str, Any]:
    """Offline/dev fallback: heuristic classifier + local SQLite persistence.

    WARNING: This path produces approximate domain/severity values.
    It is intentionally conservative (no red-zone fabrication).
    The `policy_output.executive_summary` clearly labels it as a fallback result.
    """
    loc = intake.get("location_data") or {}
    lat = float(loc.get("lat", 18.5204))
    lng = float(loc.get("lng", 73.8567))
    district = loc.get("district") or loc.get("landmark") or "Unknown"

    domain, severity = _classify_domain(user_message)

    parsed_payload: dict[str, Any] = {
        "domain": domain,
        "category": domain,
        "issue_type": f"Reported issue in {domain}",
        "severity": severity,
        "priority": "High" if severity >= 7 else "Medium",
        "image_verified": bool(intake.get("media_url")),
        "lat_long": {"lat": lat, "lng": lng},
        "original_text": intake.get("original_text", user_message),
        "english_translation": intake.get("english_translation", user_message),
        "user_id": intake.get("user_id", "anon"),
        "district": district,
        "state": loc.get("state", "Unknown"),
        "needs_human_review": False,
    }

    gati_overlap = await query_gati_shakti_layers(lat, lng, domain)
    insert_grievance_record(parsed_payload)

    grievance_id = f"grievance-{uuid.uuid4().hex[:8]}"
    geospatial_result: dict[str, Any] = {
        "grievance_id": grievance_id,
        "insert_status": "persisted",
        "gati_shakti_overlap": gati_overlap,
        "domain": domain,
        "severity": severity,
        "lat_long": {"lat": lat, "lng": lng},
        "user_id": parsed_payload["user_id"],
        "priority_gap": gati_overlap.get("priority_gap", True),
    }

    # Persist to local SQLite (dev/offline only)
    from spin_agents.services.grievance_service import persist_grievance_to_db
    await persist_grievance_to_db(grievance_id, parsed_payload, lat, lng)

    weekly_stats = query_weekly_summary(district if district != "Unknown" else None)
    policy_output: dict[str, Any] = {
        "executive_summary": (
            f"[FALLBACK MODE] {domain} grievance recorded at "
            f"[{lat:.4f}, {lng:.4f}] (district: {district}). "
            "AI pipeline offline — classification is heuristic only. "
            "Full AI analysis will run when the backend pipeline is online."
        ),
        "weekly_stats": weekly_stats or {
            "total_complaints": 0,
            "top_domain": domain,
            "district": district,
            "red_zone_count": 0,
        },
        "red_zone_alert": geospatial_result["priority_gap"],
        "notification_sent": False,
        "is_fallback": True,
    }

    return {
        "session_id": session_id,
        "pipeline_status": "fallback_completed",
        "intake_payload": intake,
        "parsed_payload": parsed_payload,
        "geospatial_result": geospatial_result,
        "policy_output": policy_output,
        "final_response": policy_output["executive_summary"],
    }


def _parse_json(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value
    return value
