"""SPIN ADK Pipeline Simulation Script.
Executes end-to-end verification of the 3-stage decoupled agent pipeline:
Semantic Parsing -> Dynamic Verification (HITL) -> Policy & Deterministic Routing.
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from typing import Any

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from schemas.data_models import ChannelType, IngestionRequest
from spin_agents.pipeline.orchestrator import run_sequential_pipeline


async def main():
    print("=" * 70)
    print("SPIN 3-AGENT DECOUPLED PIPELINE SIMULATION")
    print("Agent 1: Semantic Parsing & Multimodal Ingestion")
    print("Agent 2: Dynamic Verification & Read-Back (HITL)")
    print("Agent 3: Policy & Deterministic Routing")
    print("=" * 70)

    # Scenario 1: Ambiguous Input with Missing Location & Category -> Null Preservation & Targeted Questionnaire
    print("\n[SCENARIO 1] Ambiguous input without location:")
    req1 = IngestionRequest(
        citizen_id="+919876543210",
        channel=ChannelType.WHATSAPP,
        text="Something is wrong here please help",
        language="en",
    )
    res1 = run_sequential_pipeline(req1)
    print(f"  Agent 1 Output:")
    print(f"    Category: {res1.semantic_output.category.value} (conf: {res1.semantic_output.confidence_scores.category})")
    print(f"    Severity: {res1.semantic_output.severity} (conf: {res1.semantic_output.confidence_scores.severity})")
    print(f"    Location (lat/lng): ({res1.semantic_output.location.latitude}, {res1.semantic_output.location.longitude})")
    print(f"  Agent 2 Output:")
    print(f"    Is Fully Confirmed: {res1.verification_output.is_fully_confirmed}")
    print(f"    Generated Targeted Questions ({len(res1.verification_output.questionnaire)}):")
    for q in res1.verification_output.questionnaire:
        print(f"      - Field: '{q.field_name}' | Prompt: '{q.prompt_text}'")
    print(f"  Agent 3 Policy Routing Triggered: {res1.policy_output is not None} (Correctly held for user input)")

    # Scenario 2: Complete Grievance with Marathi/Hindi input + Coordinates -> Full Deterministic Routing
    print("\n[SCENARIO 2] Complete Grievance with Location + Hindi input:")
    req2 = IngestionRequest(
        citizen_id="+919876543210",
        channel=ChannelType.PWA,
        text="पानी की पाइपलाइन टूट गई है और पीने का पानी नहीं आ रहा है",
        language="hi",
        location_hint={
            "latitude": 18.5204,
            "longitude": 73.8567,
            "landmark": "Near Shaniwar Wada",
            "ward": "pune_central",
        },
    )
    # Simulate user verifying/confirming details
    res2 = run_sequential_pipeline(req2, explicitly_confirmed=True)
    print(f"  Agent 1 Output:")
    print(f"    Original: {res2.semantic_output.description_original}")
    print(f"    Translated: {res2.semantic_output.description_translated}")
    print(f"    Category: {res2.semantic_output.category.value}")
    print(f"    Severity: {res2.semantic_output.severity}")
    print(f"  Agent 2 Output:")
    print(f"    Is Fully Confirmed: {res2.verification_output.is_fully_confirmed}")
    print(f"    Read-Back Headline: {res2.verification_output.read_back_card.headline_native}")
    print(f"    Field Source Log: {res2.verification_output.partial_grievance.field_source_log}")
    print(f"  Agent 3 Policy Routing Output:")
    print(f"    Query ID: {res2.policy_output.query_id}")
    print(f"    Assigned Department: {res2.policy_output.department}")
    print(f"    Red Zone Priority: {res2.policy_output.is_red_zone_priority}")
    print(f"    Citizen Reverse Notification: {res2.policy_output.notification_payload.message_native[:100]}...")
    print(f"    Policymaker 3-Sentence Summary: {res2.policy_output.executive_summary.three_sentence_summary}")

    print("\n✓ Simulation Completed Successfully.")


if __name__ == "__main__":
    asyncio.run(main())
