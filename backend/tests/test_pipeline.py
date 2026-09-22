"""Integration Tests for the 3-Agent Decoupled Citizen Grievance AI Pipeline.

Tests:
1. Zero Hallucination & Null Preservation on ambiguous/sparse input.
2. Multimodal Vision cross-check discrepancy triggering clarification.
3. Proximity / Duplicate detection filtered by matching category.
4. Dynamic Verification targeted questionnaire generation for missing fields (<0.70 confidence).
5. Deterministic Department Routing strictly governed by rule lookup tables (no LLM hallucination).
6. Citizen correction audit trail tracking in field_source_log.
7. Full SequentialAgent pipeline execution.
8. Decoupled A2A FastAPI endpoints.
"""

from __future__ import annotations

import os
import sys
import pytest
from fastapi.testclient import TestClient

# Path resolution
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from schemas.data_models import (
    ChannelType,
    FieldSource,
    GrievanceCategory,
    GrievanceSchema,
    IngestionRequest,
    LocationModel,
)
from spin_agents.agents.dynamic_verification import execute_dynamic_verification
from spin_agents.agents.policy_routing import execute_policy_routing
from spin_agents.agents.semantic_parsing import execute_semantic_parsing
from spin_agents.api import app
from spin_agents.pipeline.orchestrator import run_sequential_pipeline
from spin_agents.tools.mcp_bindings import (
    deterministic_department_lookup,
    proximity_duplicate_search,
    register_recent_ticket,
    vertex_ai_vision_cross_check,
)


# ---------------------------------------------------------------------------
# 1. Null Preservation & Zero Hallucination Tests
# ---------------------------------------------------------------------------

def test_null_preservation_on_vague_input():
    """Verify that when location and category are absent, values remain null and are not guessed."""
    request = IngestionRequest(
        citizen_id="citizen_999",
        channel=ChannelType.WHATSAPP,
        text="Something broke today please inspect it",
        language="en",
    )
    result = execute_semantic_parsing(request)

    # Location must be null / empty, NOT invented
    assert result.location.latitude is None
    assert result.location.longitude is None
    assert result.location.landmark_text is None
    assert result.confidence_scores.location == 0.0

    # Category defaults to 'other' with low confidence
    assert result.category == GrievanceCategory.OTHER
    assert result.confidence_scores.category < 0.70

    # Severity must be null because no severity cues exist
    assert result.severity is None
    assert result.confidence_scores.severity == 0.0

    # Clarification flag must be raised
    assert result.needs_clarification is True
    assert "location_missing" in result.clarification_reasons


# ---------------------------------------------------------------------------
# 2. Vision Cross-Check Discrepancy Detection Test
# ---------------------------------------------------------------------------

def test_vision_cross_check_discrepancy():
    """Verify that when citizen text and image analysis disagree, discrepancy is flagged."""
    request = IngestionRequest(
        citizen_id="citizen_101",
        channel=ChannelType.PWA,
        text="There is a pothole on the road",
        media_url="mock://images/garbage_pile_01.jpg",  # Image shows garbage
        language="en",
    )
    result = execute_semantic_parsing(request)

    assert result.category == GrievanceCategory.ROADS
    # Discrepancy must be detected because image is garbage while text claims road
    assert result.vision_alignment_status == "discrepancy_detected"
    assert result.needs_clarification is True


# ---------------------------------------------------------------------------
# 3. Proximity Duplicate Search Filtered by Category Test
# ---------------------------------------------------------------------------

def test_proximity_duplicate_search_by_category():
    """Verify duplicate matching searches by geo-radius AND same category."""
    # Register a test-specific ticket in a distinct area (Nagpur, far from Pune)
    register_recent_ticket(
        query_id="SPIN-TEST-WATER-NAGPUR",
        category="water",
        latitude=21.1458,
        longitude=79.0882,
    )

    # Search nearby (Nagpur) with DIFFERENT category (roads) -> No duplicate
    diff_cat_res = proximity_duplicate_search(
        latitude=21.1460,
        longitude=79.0880,
        category="roads",
        radius_km=0.5,
    )
    assert diff_cat_res is None, (
        f"Expected no duplicate for 'roads' near a 'water' ticket, got: {diff_cat_res}"
    )

    # Search nearby (Nagpur) with SAME category (water) -> Duplicate matched
    same_cat_res = proximity_duplicate_search(
        latitude=21.1460,
        longitude=79.0880,
        category="water",
        radius_km=0.5,
    )
    assert same_cat_res is not None
    assert same_cat_res["matched_category"] == "water"


# ---------------------------------------------------------------------------
# 4. Dynamic Verification Targeted Questionnaire & Channel Adaptation
# ---------------------------------------------------------------------------

def test_dynamic_verification_questionnaire_and_dtmf():
    """Verify Agent 2 asks only for missing fields and formats DTMF for SMS/IVR."""
    # Parsed output with missing location
    parsed = execute_semantic_parsing(
        IngestionRequest(
            citizen_id="citizen_sms_1",
            channel=ChannelType.SMS_IVR,
            text="Dirty water pipeline broken",
            language="hi",
        )
    )
    assert parsed.category == GrievanceCategory.WATER

    ver_output = execute_dynamic_verification(parsed)
    assert ver_output.is_fully_confirmed is False
    assert len(ver_output.questionnaire) > 0

    # Ensure location question is present and includes DTMF mapping for IVR
    loc_q = next((q for q in ver_output.questionnaire if q.field_name == "location"), None)
    assert loc_q is not None
    assert loc_q.dtmf_mapping is not None
    assert "1" in loc_q.dtmf_mapping


# ---------------------------------------------------------------------------
# 5. Field Source Audit Logging (Inferred vs Citizen Corrected)
# ---------------------------------------------------------------------------

def test_field_source_audit_logging():
    """Verify citizen corrections are logged in field_source_log."""
    parsed = execute_semantic_parsing(
        IngestionRequest(
            citizen_id="citizen_audit",
            channel=ChannelType.PWA,
            text="Large road pothole",
            location_hint={"latitude": 18.52, "longitude": 73.85},
            language="en",
        )
    )

    # Citizen corrects category from roads to drainage
    corrections = {
        "category": "drainage",
        "severity": 9,
    }
    ver_output = execute_dynamic_verification(
        parsed=parsed,
        citizen_corrections=corrections,
        explicitly_confirmed=True,
    )

    log = ver_output.partial_grievance.field_source_log
    assert log["category"] == FieldSource.CITIZEN_CORRECTED.value
    assert ver_output.partial_grievance.category == GrievanceCategory.DRAINAGE
    assert ver_output.partial_grievance.severity == 9


# ---------------------------------------------------------------------------
# 6. Deterministic Department Routing Rule Table (Zero LLM Hallucination)
# ---------------------------------------------------------------------------

def test_deterministic_department_routing_rules():
    """Verify department routing follows rule tables deterministically."""
    # Pune Central ward rules
    dept_water = deterministic_department_lookup("water", "pune_central")
    assert "Water" in dept_water or "Jal" in dept_water
    assert "Parvati" in dept_water

    dept_roads = deterministic_department_lookup("roads", "pune_central")
    assert "Road" in dept_roads

    # Bengaluru East ward rules
    dept_bwssb = deterministic_department_lookup("water", "bengaluru_east")
    assert "BWSSB" in dept_bwssb

    # Default fallback
    dept_default = deterministic_department_lookup("garbage", "unknown_ward")
    assert "Solid Waste" in dept_default


# ---------------------------------------------------------------------------
# 7. End-to-End SequentialAgent Pipeline Execution
# ---------------------------------------------------------------------------

def test_end_to_end_sequential_pipeline():
    """Verify complete flow through Agent 1 -> Agent 2 -> Agent 3."""
    request = IngestionRequest(
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

    # Execute complete pipeline with user confirmation
    result = run_sequential_pipeline(request, explicitly_confirmed=True)

    # Verify Agent 1 output
    assert result.semantic_output.category == GrievanceCategory.WATER
    assert result.semantic_output.description_translated != ""

    # Verify Agent 2 output
    assert result.verification_output.is_fully_confirmed is True
    assert result.verification_output.read_back_card is not None

    # Verify Agent 3 output
    assert result.policy_output is not None
    assert result.policy_output.query_id.startswith("SPIN-")
    assert "Water" in result.policy_output.department
    assert result.policy_output.notification_payload.citizen_id == "+919876543210"
    assert result.policy_output.executive_summary is not None
    assert len(result.policy_output.executive_summary.three_sentence_summary) > 30


# ---------------------------------------------------------------------------
# 8. Decoupled A2A FastAPI Microservice Endpoints
# ---------------------------------------------------------------------------

def test_a2a_microservice_endpoints():
    """Verify HTTP Agent-to-Agent endpoints for Cloud Run."""
    client = TestClient(app)

    # Health check
    resp = client.get("/health")
    assert resp.status_code == 200
    assert "semantic_parsing_agent" in resp.json()["agents"]

    # A2A Agent 1 Endpoint - unambiguous garbage-only text with no road references
    ingest_payload = {
        "citizen_id": "test_user_a2a",
        "channel": "whatsapp",
        "text": "There is filth and garbage accumulation everywhere, terrible smell",
        "language": "en",
        "location_hint": {"latitude": 18.52, "longitude": 73.85},
    }
    r1 = client.post("/a2a/semantic-parsing", json=ingest_payload)
    assert r1.status_code == 200
    parsed = r1.json()
    assert parsed["category"] == "garbage"

    # A2A Agent 2 Endpoint
    r2 = client.post(
        "/a2a/dynamic-verification",
        json={"parsed": parsed, "explicitly_confirmed": True},
    )
    assert r2.status_code == 200
    verified = r2.json()
    assert verified["is_fully_confirmed"] is True

    # A2A Agent 3 Endpoint
    grievance = verified["partial_grievance"]
    r3 = client.post("/a2a/policy-routing", json=grievance)
    assert r3.status_code == 200
    policy = r3.json()
    assert policy["registration_status"] == "success"
    assert policy["query_id"].startswith("SPIN-")
