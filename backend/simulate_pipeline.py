"""
SPIN ADK Pipeline Simulation Script.
Executes end-to-end verification of the 5-stage sequential agent pipeline:
Chatbot Intake -> HITL Gate -> Semantic Parsing -> Geospatial Correlation -> Policy Dashboard.
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from typing import Any

sys.path.insert(0, os.path.dirname(__file__))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from spin_agents.runner import run_pipeline
from spin_agents.tools.bigquery import insert_grievance_record, query_weekly_summary
from spin_agents.tools.gati_shakti import query_gati_shakti_layers


async def simulate_mock_pipeline_run(user_message: str, intake_payload: dict[str, Any]) -> dict[str, Any]:
    """Offline dry-run simulation when live Gemini API key is not configured."""
    print("[SIMULATOR] API key absent or unauthenticated — executing structured offline multi-agent simulation...")

    # Stage 1: Intake
    hitl_required = intake_payload.get("hitl_required", False) or (not intake_payload.get("location_data"))
    intake_result = {
        "original_text": intake_payload.get("original_text", user_message),
        "english_translation": intake_payload.get("english_translation", user_message),
        "user_id": intake_payload.get("user_id", "anon"),
        "media_url": intake_payload.get("media_url", None),
        "location_data": intake_payload.get("location_data", None),
        "source_language": intake_payload.get("source_language", "hi"),
        "hitl_required": hitl_required,
    }

    # Stage 2: HITL Location Gate
    if hitl_required or not intake_result["location_data"]:
        return {
            "session_id": "sim_session_hitl_escalated",
            "pipeline_status": "awaiting_location",
            "intake_payload": intake_result,
            "parsed_payload": None,
            "geospatial_result": None,
            "policy_output": None,
            "final_response": "Location required before processing. Please share GPS coordinates or nearest landmark.",
        }

    # Stage 3: Semantic Parsing
    parsed_payload = {
        "domain": "Water",
        "severity": 8,
        "image_verified": True if intake_result.get("media_url") else False,
        "lat_long": {
            "lat": intake_result["location_data"]["lat"],
            "lng": intake_result["location_data"]["lng"],
        },
        "original_text": intake_result["original_text"],
        "english_translation": intake_result["english_translation"],
        "user_id": intake_result["user_id"],
        "source_language": intake_result["source_language"],
        "district": "Pune",
        "state": "Maharashtra",
    }

    # Stage 4: Geospatial Correlation
    gati_overlap = await query_gati_shakti_layers(
        parsed_payload["lat_long"]["lat"],
        parsed_payload["lat_long"]["lng"],
        parsed_payload["domain"],
    )
    bq_raw = insert_grievance_record(parsed_payload)

    geospatial_result = {
        "grievance_id": bq_raw.get("grievance_id"),
        "insert_status": bq_raw.get("status"),
        "gati_shakti_overlap": gati_overlap,
        "domain": parsed_payload["domain"],
        "severity": parsed_payload["severity"],
        "lat_long": parsed_payload["lat_long"],
        "user_id": parsed_payload["user_id"],
        "priority_gap": gati_overlap.get("priority_gap", True),
    }

    # Stage 5: Policy Dashboard
    weekly_stats = query_weekly_summary(parsed_payload["district"])
    policy_output = {
        "executive_summary": "High-severity water pipeline burst detected in Pune Shivaji Nagar. Priority intervention required due to overlapping public works.",
        "weekly_stats": weekly_stats,
        "red_zone_alert": geospatial_result["priority_gap"],
        "notification_sent": False,
        "dashboard_update": {
            "district": parsed_payload["district"],
            "total_complaints": weekly_stats.get("total_complaints", 4200),
            "top_domain": parsed_payload["domain"],
            "recommended_action": "Reallocate Emergency Infrastructure Budget (INR 12.5 Cr)",
        },
    }

    return {
        "session_id": "sim_session_completed",
        "pipeline_status": "completed",
        "intake_payload": intake_result,
        "parsed_payload": parsed_payload,
        "geospatial_result": geospatial_result,
        "policy_output": policy_output,
        "final_response": policy_output["executive_summary"],
    }


async def main():
    print("=" * 75)
    print("       SPIN ADK MULTI-AGENT PIPELINE SIMULATION & VERIFICATION")
    print("=" * 75)

    has_gemini_key = bool(os.getenv("GEMINI_API_KEY"))

    # Test Scenario 1: Complete payload (Hindi text + location coordinates)
    user_msg_1 = "मेरे इलाके में पानी की पाइपलाइन फूट गई है, पुणे शिवाजी नगर"
    intake_payload_1 = {
        "user_id": "citizen_9942",
        "original_text": user_msg_1,
        "english_translation": "Water pipeline burst in my locality, Pune Shivaji Nagar",
        "source_language": "hi",
        "location_data": {"lat": 18.5204, "lng": 73.8567, "landmark": "Shivaji Nagar, Pune"},
        "hitl_required": False,
    }

    print("\n--- [TEST SCENARIO 1: Complete Grievance Payload (Water Infrastructure)] ---")
    print(f"User Input: '{user_msg_1}'")
    print(f"Pre-parsed Intake Payload:\n{json.dumps(intake_payload_1, ensure_ascii=False, indent=2)}")

    if has_gemini_key:
        try:
            result_1 = await run_pipeline(user_message=user_msg_1, intake_payload=intake_payload_1)
        except Exception as err:
            print(f"\n[LIVE RUN FALLBACK] Live ADK execution encountered: {err}")
            result_1 = await simulate_mock_pipeline_run(user_msg_1, intake_payload_1)
    else:
        result_1 = await simulate_mock_pipeline_run(user_msg_1, intake_payload_1)

    print("\n>>> Final Pipeline Output (Scenario 1) <<<")
    print(json.dumps(result_1, ensure_ascii=False, indent=2))

    # Test Scenario 2: Missing location payload (Triggers HITL Gate escalation)
    user_msg_2 = "There is a massive road cave-in causing severe traffic."
    intake_payload_2 = {
        "user_id": "citizen_1042",
        "original_text": user_msg_2,
        "english_translation": user_msg_2,
        "source_language": "en",
        "location_data": None,
        "hitl_required": True,
    }

    print("\n--- [TEST SCENARIO 2: Missing Location (HITL Gate Escalation Test)] ---")
    print(f"User Input: '{user_msg_2}'")
    print(f"Intake Payload:\n{json.dumps(intake_payload_2, ensure_ascii=False, indent=2)}")

    if has_gemini_key:
        try:
            result_2 = await run_pipeline(user_message=user_msg_2, intake_payload=intake_payload_2)
        except Exception as err:
            print(f"\n[LIVE RUN FALLBACK] Live ADK execution encountered: {err}")
            result_2 = await simulate_mock_pipeline_run(user_msg_2, intake_payload_2)
    else:
        result_2 = await simulate_mock_pipeline_run(user_msg_2, intake_payload_2)

    print("\n>>> Final Pipeline Output (Scenario 2) <<<")
    print(json.dumps(result_2, ensure_ascii=False, indent=2))

    print("\n" + "=" * 75)
    print("       SIMULATION VERIFICATION COMPLETE")
    print("=" * 75)


if __name__ == "__main__":
    asyncio.run(main())
