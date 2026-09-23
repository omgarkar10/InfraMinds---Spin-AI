"""
Unit tests for SPIN Canonical Schemas (spin_agents.schemas).
Covers all canonical contracts, edge cases, and corrected Day 1 validation rules.
"""

from __future__ import annotations

from datetime import datetime, timezone
import json
import math
import pytest
from pydantic import ValidationError

from spin_agents.schemas import (
    CitizenRequest,
    ParsedRequest,
    CommunityCluster,
    DataContext,
    PriorityRecommendation,
    PolicyAction,
    Location,
    EvidenceItem,
)


# ============================================================================
# Test 1 & 2: CitizenRequest validation
# ============================================================================

def test_valid_citizen_request():
    req = CitizenRequest(
        citizen_id="cit-101",
        description="Severe pipeline burst near Kothrud bus depot causing water leakage.",
        source_language="auto",
        input_source="whatsapp",
        location=Location(latitude=18.5204, longitude=73.8567, landmark="Near bus depot", district="Pune", state="Maharashtra"),
    )
    assert req.citizen_id == "cit-101"
    assert req.description.startswith("Severe pipeline")
    assert req.location is not None
    assert req.location.latitude == 18.5204
    assert req.location.district == "Pune"
    assert req.request_id.startswith("REQ-")
    assert req.source_language == "auto"


def test_empty_or_blank_description_rejection():
    with pytest.raises(ValidationError) as excinfo:
        CitizenRequest(description="   ")
    err_msg = str(excinfo.value)
    assert (
        "Description must contain at least 5 non-whitespace characters" in err_msg
        or "String should have at least 5 characters" in err_msg
    ), f"Unexpected error: {err_msg}"

    with pytest.raises(ValidationError) as excinfo2:
        CitizenRequest(description="abc")
    err_msg2 = str(excinfo2.value)
    assert "String should have at least 5 characters" in err_msg2, f"Unexpected error: {err_msg2}"

    with pytest.raises(ValidationError) as excinfo3:
        CitizenRequest(description="     ")
    err_msg3 = str(excinfo3.value)
    assert (
        "Description must contain at least 5 non-whitespace characters" in err_msg3
        or "String should have at least 5 characters" in err_msg3
    ), f"Unexpected error: {err_msg3}"


def test_citizen_request_blank_identifiers_and_language_default():
    """Verify blank identifiers are rejected and language defaults to 'auto'."""
    # Blank citizen_id must be rejected
    with pytest.raises(ValidationError) as exc:
        CitizenRequest(
            citizen_id="   ",
            description="Potholes on the main road",
        )
    assert "citizen_id cannot be blank" in str(exc.value)

    # Default source_language must be 'auto', not 'hi'
    req = CitizenRequest(description="Water supply contaminated across sector 3")
    assert req.source_language == "auto"


def test_citizen_request_evidence_limit():
    """Evidence list size must not exceed 10 items."""
    valid_items = [
        EvidenceItem(evidence_type="photo", url=f"https://storage.spin.org/img_{i}.jpg")
        for i in range(10)
    ]
    req = CitizenRequest(description="Drainage overflow", evidence=valid_items)
    assert len(req.evidence) == 10

    # 11 items must fail
    too_many = valid_items + [
        EvidenceItem(evidence_type="photo", url="https://storage.spin.org/overflow.jpg")
    ]
    with pytest.raises(ValidationError):
        CitizenRequest(description="Drainage overflow", evidence=too_many)


# ============================================================================
# Test 3 & 4: ParsedRequest & Confidence validation
# ============================================================================

def test_valid_parsed_request():
    parsed = ParsedRequest(
        request_id="REQ-TEST1234",
        original_text="नल में गंदा पानी आ रहा है",
        normalized_description="Contaminated water flowing from household tap.",
        detected_language="hi",
        category="Water Supply",
        department="Water Supply & Sanitation",
        issue_type="Contaminated water",
        severity=8,
        urgency="High",
        confidence=0.94,
        severity_reason="Public health hazard affecting drinking water supply.",
        processing_status="completed",
        location=Location(latitude=18.5204, longitude=73.8567, district="Pune", state="Maharashtra"),
    )
    assert parsed.category == "Water Supply"
    assert parsed.severity == 8
    assert parsed.confidence == 0.94
    assert parsed.location.district == "Pune"
    assert parsed.detected_language == "hi"


def test_invalid_confidence_bounds():
    with pytest.raises(ValidationError):
        ParsedRequest(
            request_id="REQ-TEST1234",
            original_text="Test",
            normalized_description="Test issue",
            detected_language="en",
            category="Water Supply",
            department="Water Supply",
            issue_type="Issue",
            severity=5,
            confidence=1.25,  # Invalid: > 1.0
            location=Location(latitude=18.5, longitude=73.8),
        )

    with pytest.raises(ValidationError):
        ParsedRequest(
            request_id="REQ-TEST1234",
            original_text="Test",
            normalized_description="Test issue",
            detected_language="en",
            category="Water Supply",
            department="Water Supply",
            issue_type="Issue",
            severity=5,
            confidence=-0.1,  # Invalid: < 0.0
            location=Location(latitude=18.5, longitude=73.8),
        )


def test_parsed_request_detected_language_required():
    """detected_language must be explicitly provided (no misleading 'hi' default)."""
    with pytest.raises(ValidationError):
        ParsedRequest(
            request_id="REQ-TEST1234",
            original_text="Broken bridge railing",
            normalized_description="Broken bridge railing",
            # detected_language omitted
            category="Roads & Bridges",
            department="PWD",
            issue_type="Structural Hazard",
            severity=7,
            confidence=0.9,
            location=Location(latitude=18.5, longitude=73.8, district="Pune", state="MH"),
        )


def test_parsed_request_status_and_incomplete_location():
    """
    - Default status is 'needs_human_review' (never defaulted to 'completed').
    - Incomplete location is permitted when awaiting location.
    - Completed status requires confirmed coordinates and district/state.
    """
    # Allowed to have incomplete location when awaiting_location
    awaiting = ParsedRequest(
        request_id="REQ-AWAIT01",
        original_text="Street light dead",
        normalized_description="Street light not functioning",
        detected_language="en",
        category="Street Lighting",
        department="Electricity",
        issue_type="Fixture Fault",
        severity=4,
        confidence=0.85,
        processing_status="awaiting_location",
        location=Location(),  # Incomplete location allowed
    )
    assert awaiting.processing_status == "awaiting_location"
    assert awaiting.location.latitude is None

    # Status defaults to needs_human_review when omitted
    default_status = ParsedRequest(
        request_id="REQ-DEF01",
        original_text="Broken curb",
        normalized_description="Damaged road curb",
        detected_language="en",
        category="Roads",
        department="PWD",
        issue_type="Curb Damage",
        severity=3,
        confidence=0.8,
        location=Location(),
    )
    assert default_status.processing_status == "needs_human_review"

    # Completed status with incomplete location coordinates must fail
    with pytest.raises(ValidationError):
        ParsedRequest(
            request_id="REQ-COMP01",
            original_text="Water leak",
            normalized_description="Water leak",
            detected_language="en",
            category="Water",
            department="Water Dept",
            issue_type="Leak",
            severity=6,
            confidence=0.9,
            processing_status="completed",
            location=Location(),  # Missing coordinates and district
        )


# ============================================================================
# Test 5, 6, 7, 8, 9: Location validation, pairing & 0,0 guard
# ============================================================================

def test_valid_latitude_and_longitude():
    loc = Location(latitude=28.6139, longitude=77.2090, district="New Delhi", state="Delhi")
    assert loc.latitude == 28.6139
    assert loc.longitude == 77.2090


def test_latitude_greater_than_90_rejected():
    with pytest.raises(ValidationError) as excinfo:
        Location(latitude=95.0, longitude=73.85)
    assert "Latitude must be between -90.0 and +90.0 degrees" in str(excinfo.value)


def test_longitude_less_than_minus_180_rejected():
    with pytest.raises(ValidationError) as excinfo:
        Location(latitude=18.5, longitude=-185.0)
    assert "Longitude must be between -180.0 and +180.0 degrees" in str(excinfo.value)


def test_unknown_location_preserves_none():
    loc = Location(landmark="Near clock tower", district="Pune")
    assert loc.latitude is None
    assert loc.longitude is None
    assert loc.landmark == "Near clock tower"
    assert loc.district == "Pune"


def test_no_automatic_zero_substitution():
    """
    CRITICAL: Missing coordinates must NEVER default to (0.0, 0.0).
    (0.0, 0.0) is Null Island in the Gulf of Guinea, not an Indian civic location.
    """
    loc = Location()
    assert loc.latitude is None
    assert loc.longitude is None
    assert loc.latitude != 0.0
    assert loc.longitude != 0.0

    # Test dictionary adapter
    loc_from_dict = Location.from_lat_long_dict({"landmark": "Market Gate"})
    assert loc_from_dict.latitude is None
    assert loc_from_dict.longitude is None


def test_coordinate_pairing_rule():
    """Latitude and Longitude must be provided together or neither."""
    # Latitude provided without longitude must fail
    with pytest.raises(ValidationError) as exc1:
        Location(latitude=18.5204, longitude=None)
    assert "Both latitude and longitude must be provided together" in str(exc1.value)

    # Longitude provided without latitude must fail
    with pytest.raises(ValidationError) as exc2:
        Location(latitude=None, longitude=73.8567)
    assert "Both latitude and longitude must be provided together" in str(exc2.value)


def test_non_finite_coordinates_rejected():
    """NaN and Inf coordinates must be rejected."""
    with pytest.raises(ValidationError):
        Location(latitude=float("nan"), longitude=73.8567)

    with pytest.raises(ValidationError):
        Location(latitude=18.5204, longitude=float("inf"))


def test_legitimate_zero_coordinates_preserved():
    """0.0 is a legitimate coordinate (Equator/Prime Meridian) and must not be discarded."""
    loc = Location(latitude=0.0, longitude=0.0)
    assert loc.latitude == 0.0
    assert loc.longitude == 0.0
    assert loc.latitude is not None
    assert loc.longitude is not None


# ============================================================================
# Test 10: CommunityCluster validation
# ============================================================================

def test_community_cluster_validation():
    cluster = CommunityCluster(
        spatial_unit="ward",
        center_location=Location(latitude=18.5204, longitude=73.8567, district="Pune", state="Maharashtra"),
        request_ids=["REQ-001", "REQ-002", "REQ-003", "REQ-004", "REQ-005"],
        request_count=5,
        request_density=12.5,
        density_unit="complaints_per_sq_km",
        infrastructure_categories=["Water Supply", "Drainage / Flooding"],
        dominant_category="Water Supply",
        affected_population_estimate=14500,
        is_red_zone=True,
    )
    assert cluster.request_count == 5
    assert cluster.request_density == 12.5
    assert cluster.is_red_zone is True
    assert "Water Supply" in cluster.infrastructure_categories


def test_community_cluster_dominant_category_membership():
    """dominant_category must belong to infrastructure_categories."""
    with pytest.raises(ValidationError) as exc:
        CommunityCluster(
            center_location=Location(latitude=18.5, longitude=73.8),
            request_ids=["REQ-01"],
            request_count=1,
            request_density=2.0,
            infrastructure_categories=["Water Supply"],
            dominant_category="Roads & Potholes",  # Not in categories!
        )
    assert "must be one of the cluster's infrastructure_categories" in str(exc.value)


def test_community_cluster_rejects_inconsistent_counts():
    """Inconsistent request counts must be rejected, not silently overwritten."""
    with pytest.raises(ValidationError) as exc:
        CommunityCluster(
            center_location=Location(latitude=18.5, longitude=73.8),
            request_ids=["REQ-01", "REQ-02"],
            request_count=10,  # Inconsistent: 2 IDs vs count 10
            request_density=4.0,
            infrastructure_categories=["Water Supply"],
            dominant_category="Water Supply",
        )
    assert "Inconsistent counts are rejected" in str(exc.value)


def test_community_cluster_red_zone_not_invented():
    """is_red_zone defaults to None (unclassified) rather than inventing a boolean."""
    cluster = CommunityCluster(
        center_location=Location(latitude=18.5, longitude=73.8),
        request_ids=["REQ-01"],
        request_count=1,
        request_density=1.0,
        infrastructure_categories=["Water Supply"],
        dominant_category="Water Supply",
    )
    assert cluster.is_red_zone is None


# ============================================================================
# Test 11: DataContext missing-data representation
# ============================================================================

def test_data_context_missing_data_and_synthetic_flag():
    ctx = DataContext(
        cluster_id="CLUSTER-PUNE01",
        infrastructure_condition="deteriorated",
        infrastructure_gap=True,
        current_investment_cr=None,  # Explicitly None (missing / not published)
        planned_investment_cr=45.0,
        source_metadata={"gis": "PM_Gati_Shakti_API", "data_source": "Municipal_Dashboard"},
        synthetic_data_flag=True,  # Disclose mock/synthetic data for demo
    )
    assert ctx.current_investment_cr is None
    assert ctx.planned_investment_cr == 45.0
    assert ctx.infrastructure_gap is True
    assert ctx.synthetic_data_flag is True


def test_data_context_unknown_quality_and_provenance():
    """Defaults must explicitly represent unknown quality (None) and unknown provenance (None)."""
    ctx = DataContext(cluster_id="CLUSTER-002")
    assert ctx.data_quality_score is None  # Unknown quality, not assumed 1.0
    assert ctx.synthetic_data_flag is None  # Unknown provenance, not assumed real (False)


# ============================================================================
# Test 12: PriorityRecommendation score validation
# ============================================================================

def test_priority_recommendation_score_validation():
    rec = PriorityRecommendation(
        cluster_id="CLUSTER-PUNE01",
        priority_score=88.5,
        score_components={"severity": 35.0, "density": 30.0, "gap": 23.5},
        recommended_intervention="Deploy emergency pipeline repair unit and reallocate ward maintenance grant.",
        reasoning="Critical water supply disruption coupled with lack of active PM Gati Shakti coverage.",
        supporting_evidence=["5 grievances reported within 48 hours", "Delayed Gati Shakti project in vicinity"],
        limitations=["Ward population estimated from 2011 census extrapolation"],
        processing_status="PROPOSED",
        model_version="gemini-2.5-flash",
    )
    assert rec.priority_score == 88.5
    assert rec.score_components["severity"] == 35.0
    assert rec.model_version == "gemini-2.5-flash"

    # Score > 100 must fail
    with pytest.raises(ValidationError):
        PriorityRecommendation(
            cluster_id="CLUSTER-PUNE01",
            priority_score=105.0,
            recommended_intervention="Action",
            reasoning="Reason",
        )


def test_priority_recommendation_provenance_and_components():
    """model_version defaults to None (not hardcoded) and component scores must be non-negative finite."""
    rec = PriorityRecommendation(
        cluster_id="CLUSTER-001",
        priority_score=75.0,
        recommended_intervention="Road resurfacing",
        reasoning="Pothole cluster on major arterial road",
    )
    assert rec.model_version is None  # Provenance not hardcoded

    # Negative score component must fail
    with pytest.raises(ValidationError) as exc:
        PriorityRecommendation(
            cluster_id="CLUSTER-001",
            priority_score=50.0,
            score_components={"severity": -10.0},
            recommended_intervention="Action",
            reasoning="Reason",
        )
    assert "must be a non-negative finite number" in str(exc.value)


# ============================================================================
# Test 13: PolicyAction decision validation & pure audit contract
# ============================================================================

def test_policy_action_decision_validation():
    action = PolicyAction(
        recommendation_id="REC-001",
        reviewer_id="OFFICER-789",
        reviewer_role="policymaker",
        decision="approved",
        selected_interventions=["Immediate pipe repair", "Water tanker deployment"],
        allocated_budget_cr=2.5,
        notes="Approved under emergency urban infrastructure provision.",
    )
    assert action.decision == "approved"
    assert action.allocated_budget_cr == 2.5

    # Invalid decision literal must fail
    with pytest.raises(ValidationError):
        PolicyAction(
            recommendation_id="REC-001",
            reviewer_id="OFFICER-789",
            reviewer_role="policymaker",
            decision="unauthorized_status",  # Invalid
        )


def test_policy_action_reviewer_identity_not_invented():
    """Reviewer identities and recommendation IDs must not be blank."""
    with pytest.raises(ValidationError):
        PolicyAction(
            recommendation_id="",  # Blank not allowed
            reviewer_id="OFFICER-01",
            reviewer_role="policymaker",
            decision="approved",
        )

    with pytest.raises(ValidationError):
        PolicyAction(
            recommendation_id="REC-01",
            reviewer_id="   ",  # Whitespace not allowed
            reviewer_role="policymaker",
            decision="approved",
        )


# ============================================================================
# Test 14: Schema serialization
# ============================================================================

def test_schema_serialization():
    req = CitizenRequest(
        citizen_id="cit-999",
        description="Road pothole causing traffic jam near main highway entrance.",
        source_language="en",
        input_source="web",
        location=Location(latitude=19.0760, longitude=72.8777, district="Mumbai", state="Maharashtra"),
    )
    dumped_dict = req.model_dump()
    assert dumped_dict["citizen_id"] == "cit-999"
    assert dumped_dict["location"]["district"] == "Mumbai"

    json_str = req.model_dump_json()
    parsed_back = json.loads(json_str)
    assert parsed_back["description"].startswith("Road pothole")
    assert parsed_back["location"]["latitude"] == 19.0760


# ============================================================================
# Test 15: Existing import compatibility
# ============================================================================

def test_existing_import_compatibility():
    """Verify that importing schemas does not break existing spin_agents modules."""
    import spin_agents.api as api
    import spin_agents.agent as agent
    import spin_agents.runner as runner
    import spin_agents.models as models

    assert hasattr(api, "app")
    assert hasattr(agent, "root_agent")
    assert hasattr(runner, "run_pipeline")
    assert hasattr(models, "Grievance")
    assert hasattr(models, "User")


# ============================================================================
# Test 16: Dual Request Types (Existing Problem & New Development)
# ============================================================================

def test_citizen_request_dual_types():
    """Verify that CitizenRequest supports Type A (Problem) and Type B (New Development)."""
    # Type A: Existing Infrastructure Problem
    req_a = CitizenRequest(
        citizen_id="cit-101",
        description="Potholes on MG Road causing daily traffic accidents.",
        request_type="existing_problem",
        category="Roads & Potholes",
        specific_issue="Potholes / Damaged Road Surface",
        start_date="2026-08-15",
        frequency="Continuous",
        location=Location(latitude=18.5204, longitude=73.8567, district="Pune", state="Maharashtra"),
    )
    assert req_a.request_type == "existing_problem"
    assert req_a.start_date == "2026-08-15"
    assert req_a.frequency == "Continuous"
    assert req_a.category == "Roads & Potholes"

    # Type B: New Infrastructure Development Request
    req_b = CitizenRequest(
        citizen_id="cit-102",
        description="Need a primary healthcare center in village Khadakwasla.",
        request_type="new_development",
        category="Healthcare",
        specific_issue="Primary Health Center",
        reason="Nearest hospital is 25 km away, causing delays in emergency childbirth.",
        intended_beneficiaries="5,000 rural residents across 3 adjoining gram panchayats",
        location=Location(latitude=18.4320, longitude=73.7650, district="Pune", state="Maharashtra"),
    )
    assert req_b.request_type == "new_development"
    assert req_b.reason.startswith("Nearest hospital")
    assert "5,000 rural residents" in req_b.intended_beneficiaries
    # Irrelevant Type A fields remain None
    assert req_b.start_date is None
    assert req_b.frequency is None

    # Normalization of synonyms
    req_synonym_a = CitizenRequest(
        citizen_id="cit-103",
        description="Broken streetlight near bus stop.",
        request_type="problem",
    )
    assert req_synonym_a.request_type == "existing_problem"

    req_synonym_b = CitizenRequest(
        citizen_id="cit-104",
        description="Request for new bridge over river.",
        request_type="new_need",
    )
    assert req_synonym_b.request_type == "new_development"

    # Rejection of invalid request types
    with pytest.raises(ValidationError):
        CitizenRequest(
            citizen_id="cit-105",
            description="General inquiry about municipal election dates.",
            request_type="inquiry_or_general",
        )


def test_parsed_request_dual_types():
    """Verify ParsedRequest supports both problem and new development classifications."""
    parsed_dev = ParsedRequest(
        request_id="REQ-TESTDEV01",
        request_type="new_development",
        original_text="Need a community drinking water filtration plant in Ward 7.",
        normalized_description="Proposal for public community water purification plant in Ward 7.",
        detected_language="en",
        category="Water Supply",
        department="Public Works / Water Supply Department",
        issue_type="Drinking Water Treatment Plant",
        reason="Groundwater has high fluoride contamination causing dental issues in children.",
        intended_beneficiaries="Ward 7 community (approx 1,200 households)",
        severity=7,
        confidence=0.91,
        location=Location(latitude=18.5204, longitude=73.8567, district="Pune", state="Maharashtra"),
        processing_status="completed",
    )
    assert parsed_dev.request_type == "new_development"
    assert parsed_dev.reason.startswith("Groundwater has high")
    assert parsed_dev.start_date is None
