"""
SPIN Canonical Data Contracts and Schemas (Pydantic V2).
Module: spin_agents.schemas

This module defines the six primary domain schemas for the SPIN pipeline:
1. CitizenRequest       - Raw citizen intake payload prior to AI processing
2. ParsedRequest        - Semantic parsing & location-confirmed normalized grievance
3. CommunityCluster     - Geospatially aggregated civic demand cluster
4. DataContext          - Enriched external context (PM Gati Shakti, Demographics, Budgets)
5. PriorityRecommendation - Explainable AI planning recommendation with score breakdown
6. PolicyAction         - Auditable record of human policymaker review and intervention

All models enforce strict validation, explicit types, coordinate boundaries,
and transparent provenance flags (e.g., synthetic data disclosure).
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
import math
from typing import Any, Literal
import uuid

from pydantic import BaseModel, Field, field_validator, model_validator


# ============================================================================
# Reusable Value Objects & Sub-Models
# ============================================================================

class Location(BaseModel):
    """
    Canonical location model for SPIN.
    Guarantees strict coordinate validation:
    - Requires both latitude and longitude together, or neither (both None).
    - Rejects invalid or non-finite (NaN, Inf) coordinates.
    - Preserves legitimate 0.0 values (Equator / Prime Meridian) without substitution.
    - Never invents coordinates.
    """
    latitude: float | None = Field(
        default=None,
        description="WGS84 Latitude between -90.0 and 90.0. None if unknown."
    )
    longitude: float | None = Field(
        default=None,
        description="WGS84 Longitude between -180.0 and 180.0. None if unknown."
    )
    address: str | None = Field(default=None, description="Street address or descriptive location")
    landmark: str | None = Field(default=None, description="Nearby landmark (e.g. Near Sector 4 water tank)")
    district: str | None = Field(default=None, description="Administrative district name")
    state: str | None = Field(default=None, description="State or Union Territory name")
    pincode: str | None = Field(default=None, description="Postal PIN code (e.g. 411038)")
    is_verified: bool = Field(default=False, description="Whether location was verified via GPS or reverse geocoding")

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v: float | None) -> float | None:
        if v is not None:
            if math.isnan(v) or math.isinf(v):
                raise ValueError("Latitude must be a finite real number.")
            if v < -90.0 or v > 90.0:
                raise ValueError(f"Latitude must be between -90.0 and +90.0 degrees, got {v}")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v: float | None) -> float | None:
        if v is not None:
            if math.isnan(v) or math.isinf(v):
                raise ValueError("Longitude must be a finite real number.")
            if v < -180.0 or v > 180.0:
                raise ValueError(f"Longitude must be between -180.0 and +180.0 degrees, got {v}")
        return v

    @model_validator(mode="after")
    def validate_coordinate_pair(self) -> "Location":
        """Require both coordinates together or neither."""
        has_lat = self.latitude is not None
        has_lng = self.longitude is not None
        if has_lat != has_lng:
            raise ValueError(
                "Both latitude and longitude must be provided together, or both must be None."
            )
        return self

    @classmethod
    def from_lat_long_dict(cls, data: dict[str, Any] | None) -> "Location":
        """
        Adapter: Parses legacy/ADK dict formats like {'lat': ..., 'lng': ...}
        or {'latitude': ..., 'longitude': ...} into a canonical Location.
        Preserves legitimate 0.0 values, never invents coordinates.
        """
        if not data:
            return cls()

        def _parse_coord(val: Any) -> float | None:
            if val is None or val == "":
                return None
            try:
                f = float(val)
                return f if not (math.isnan(f) or math.isinf(f)) else None
            except (ValueError, TypeError):
                return None

        raw_lat = data.get("latitude") if "latitude" in data else data.get("lat")
        raw_lng = data.get("longitude") if "longitude" in data else data.get("lng")
        parsed_lat = _parse_coord(raw_lat)
        parsed_lng = _parse_coord(raw_lng)

        # Incomplete coordinate pairs are discarded to satisfy coordinate pairing rule
        if (parsed_lat is None) != (parsed_lng is None):
            parsed_lat = None
            parsed_lng = None

        return cls(
            latitude=parsed_lat,
            longitude=parsed_lng,
            landmark=data.get("landmark"),
            address=data.get("address"),
            district=data.get("district"),
            state=data.get("state"),
            pincode=data.get("pincode") or data.get("pinCode"),
            is_verified=bool(data.get("is_verified", False) or data.get("isVerified", False)),
        )


class EvidenceItem(BaseModel):
    """Supporting multimodal evidence metadata."""
    evidence_type: Literal["photo", "voice_note", "document", "video"]
    url: str = Field(description="Accessible URL or cloud storage URI")
    mime_type: str | None = None
    file_size_bytes: int | None = Field(default=None, ge=0)
    transcript_en: str | None = Field(default=None, description="English transcript if voice note")

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("Evidence URL cannot be blank or empty.")
        return stripped


# ============================================================================
# Canonical Schema 1: CitizenRequest
# ============================================================================

class CitizenRequest(BaseModel):
    """
    Model 1: Represents an incoming citizen infrastructure request before AI intake.
    Collects raw description, source language, intake channel, and optional GPS location.
    """
    request_id: str = Field(
        default_factory=lambda: f"REQ-{uuid.uuid4().hex[:10].upper()}",
        description="Unique request identifier"
    )
    citizen_id: str = Field(
        default="anonymous",
        description="Citizen user ID or phone number (anonymized in analytical views)"
    )
    description: str = Field(
        ...,
        min_length=5,
        max_length=5000,
        description="Citizen's textual grievance description"
    )
    source_language: str = Field(
        default="auto",
        description="ISO 639-1 language code (e.g., 'hi', 'mr', 'ta', 'bn', 'en') or 'auto' (never defaulted to an assumed language)"
    )
    input_source: Literal["web", "whatsapp", "telegram", "voice", "mobile_app"] = Field(
        default="web",
        description="Channel through which the grievance was ingested"
    )
    location: Location | None = Field(
        default=None,
        description="Optional location data provided by citizen"
    )
    evidence: list[EvidenceItem] = Field(
        default_factory=list,
        max_length=10,
        description="Attached multimedia evidence (maximum 10 items allowed)"
    )
    submitted_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of submission"
    )

    @field_validator("description")
    @classmethod
    def validate_meaningful_description(cls, v: str) -> str:
        stripped = v.strip()
        if len(stripped) < 5:
            raise ValueError("Description must contain at least 5 non-whitespace characters.")
        return stripped

    @field_validator("citizen_id")
    @classmethod
    def validate_citizen_id(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("citizen_id cannot be blank or whitespace.")
        return stripped

    @field_validator("request_id")
    @classmethod
    def validate_request_id(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("request_id cannot be blank or whitespace.")
        return stripped

    @field_validator("evidence")
    @classmethod
    def validate_evidence_limit(cls, v: list[EvidenceItem]) -> list[EvidenceItem]:
        if len(v) > 10:
            raise ValueError(f"Evidence list cannot exceed 10 items, got {len(v)}.")
        return v


# ============================================================================
# Canonical Schema 2: ParsedRequest
# ============================================================================

class ParsedRequest(BaseModel):
    """
    Model 2: Represents a normalized, semantically parsed grievance after
    language translation, category/issue classification, and location confirmation.
    """
    request_id: str = Field(description="Corresponding CitizenRequest ID")
    original_text: str = Field(description="Original unedited citizen text")
    normalized_description: str = Field(description="English-translated and normalized grievance text")
    detected_language: str = Field(
        ...,
        description="Detected ISO 639-1 language code (must be supplied by intake/detection model, never defaulted)"
    )
    category: str = Field(
        ...,
        description="Infrastructure category (e.g. Water Supply, Roads & Potholes, Drainage / Flooding)"
    )
    department: str = Field(
        ...,
        description="Assigned government department"
    )
    issue_type: str = Field(
        ...,
        description="Specific civic sub-issue (e.g. Pipeline leakage / burst)"
    )
    intent: str = Field(
        default="report_civic_issue",
        description="Identified user intent"
    )
    severity: int = Field(
        ...,
        ge=1,
        le=10,
        description="Severity rating on 1-10 scale (10 is emergency)"
    )
    urgency: Literal["Low", "Medium", "High", "Critical"] = Field(
        default="Medium",
        description="Operational urgency level"
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Model confidence score between 0.00 and 1.00 (must not be fabricated as 1.0)"
    )
    severity_reason: str | None = Field(
        default=None,
        description="AI explanation for the assigned severity score"
    )
    location: Location | None = Field(
        default=None,
        description="Location payload. Allowed to be incomplete (None coordinates/district) when awaiting confirmation."
    )
    extracted_entities: dict[str, Any] = Field(
        default_factory=dict,
        description="Named entities extracted (e.g., street names, wards, infrastructure landmarks)"
    )
    evidence_verified: bool = Field(
        default=False,
        description="Whether uploaded photo/media was verified to match grievance category"
    )
    processing_status: Literal["completed", "needs_human_review", "awaiting_location"] = Field(
        default="needs_human_review",
        description="Intake processing status (defaults to needs_human_review, never assumes completed)"
    )
    needs_human_review: bool = Field(
        default=False,
        description="Flagged true if classification is ambiguous or confidence is low. NOTE: Automatic threshold enforcement (e.g. confidence < 0.70) is PENDING TEAM APPROVAL."
    )

    @model_validator(mode="after")
    def validate_location_completeness_for_completed(self) -> "ParsedRequest":
        """Completed status requires confirmed location with district, state, and coordinates."""
        if self.processing_status == "completed":
            if self.location is None:
                raise ValueError("Completed ParsedRequest must contain a confirmed location.")
            if self.location.latitude is None or self.location.longitude is None:
                raise ValueError("Completed ParsedRequest requires confirmed latitude and longitude coordinates.")
            if not self.location.district or not self.location.state:
                raise ValueError("Completed ParsedRequest requires valid district and state.")
        return self


# ============================================================================
# Canonical Schema 3: CommunityCluster
# ============================================================================

class CommunityCluster(BaseModel):
    """
    Model 3: Represents community-level spatial and thematic aggregation of
    multiple individual citizen requests into an actionable infrastructure hotspot.
    """
    cluster_id: str = Field(
        default_factory=lambda: f"CLUSTER-{uuid.uuid4().hex[:8].upper()}",
        description="Unique cluster identifier"
    )
    spatial_unit: Literal["ward", "pincode", "district", "h3_hex", "radius_cluster"] = Field(
        default="ward",
        description="Spatial aggregation granularity"
    )
    center_location: Location = Field(
        ...,
        description="Centroid coordinate and district/state reference for the cluster"
    )
    request_ids: list[str] = Field(
        ...,
        min_length=1,
        description="List of constituent citizen request IDs in this cluster"
    )
    request_count: int = Field(
        ...,
        ge=1,
        description="Total number of grievances grouped into this cluster"
    )
    request_density: float = Field(
        ...,
        ge=0.0,
        description="Demand density (e.g. complaints per square kilometer or standardized index)"
    )
    density_unit: str = Field(
        default="complaints_per_sq_km",
        description="Measurement unit for request density"
    )
    infrastructure_categories: list[str] = Field(
        ...,
        description="Distinct categories present within this cluster"
    )
    dominant_category: str = Field(
        ...,
        description="Most frequent or highest-severity infrastructure domain"
    )
    affected_population_estimate: int | None = Field(
        default=None,
        ge=0,
        description="Estimated population impacted in the catchment area"
    )
    is_red_zone: bool | None = Field(
        default=None,
        description="Whether this cluster qualifies as a Red Zone. None if unclassified; must be explicitly evaluated based on policy criteria, never invented."
    )

    @model_validator(mode="after")
    def validate_dominant_category_membership(self) -> "CommunityCluster":
        """Validate dominant category is a member of infrastructure_categories."""
        if self.dominant_category not in self.infrastructure_categories:
            raise ValueError(
                f"dominant_category '{self.dominant_category}' must be one of the cluster's infrastructure_categories: {self.infrastructure_categories}"
            )
        return self

    @model_validator(mode="after")
    def validate_cluster_counts(self) -> "CommunityCluster":
        """Reject inconsistent request counts instead of silently correcting them."""
        if len(self.request_ids) != self.request_count:
            raise ValueError(
                f"request_count ({self.request_count}) does not match the number of request_ids ({len(self.request_ids)}). Inconsistent counts are rejected."
            )
        return self


# ============================================================================
# Canonical Schema 4: DataContext
# ============================================================================

class DataContext(BaseModel):
    """
    Model 4: Contextual evidence enriching a CommunityCluster.
    Fuses geospatial data (PM Gati Shakti), demographic metrics, existing public works,
    and fiscal expenditure records with explicit data provenance.
    """
    cluster_id: str = Field(description="Corresponding CommunityCluster ID")
    demographic_context: dict[str, Any] = Field(
        default_factory=dict,
        description="Demographic data (e.g. ward population, density, vulnerability index)"
    )
    infrastructure_condition: str | None = Field(
        default=None,
        description="Current state assessment (e.g., 'deteriorated', 'under-capacity', 'failed')"
    )
    infrastructure_gap: bool = Field(
        default=False,
        description="Indicates an unserved infrastructure gap detected via GIS overlap"
    )
    current_investment_cr: float | None = Field(
        default=None,
        ge=0.0,
        description="Sanctioned investment in Crores INR in the current fiscal cycle"
    )
    planned_investment_cr: float | None = Field(
        default=None,
        ge=0.0,
        description="Pipeline or proposed investment in Crores INR"
    )
    gati_shakti_overlap: dict[str, Any] = Field(
        default_factory=dict,
        description="GIS layer correlation results from PM Gati Shakti"
    )
    source_metadata: dict[str, str] = Field(
        default_factory=dict,
        description="Data provenance map (e.g. {'gis': 'PM_Gati_Shakti_API', 'demographics': 'Census_2021_Est'})"
    )
    data_quality_score: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Reliability and completeness score between 0.00 and 1.00. Explicitly None when data quality is unknown."
    )
    synthetic_data_flag: bool | None = Field(
        default=None,
        description="True if synthetic/mock data was used, False if verified real data, None if provenance is unknown. Must not assume data is real."
    )


# ============================================================================
# Canonical Schema 5: PriorityRecommendation
# ============================================================================

class PriorityRecommendation(BaseModel):
    """
    Model 5: Explainable decision recommendation for civic authorities and policymakers.
    Contains composite score breakdown, suggested municipal intervention, and explicit limitations.
    """
    recommendation_id: str = Field(
        default_factory=lambda: f"REC-{uuid.uuid4().hex[:8].upper()}",
        description="Unique recommendation ID"
    )
    cluster_id: str = Field(description="Associated CommunityCluster ID")
    priority_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Normalized priority score between 0.0 and 100.0"
    )
    score_components: dict[str, float] = Field(
        default_factory=dict,
        description="Breakdown of composite weights (e.g. {'severity': 35.0, 'density': 30.0, 'gap': 25.0})"
    )
    recommended_intervention: str = Field(
        ...,
        description="Concrete recommended policy or municipal action"
    )
    reasoning: str = Field(
        ...,
        description="Explainable natural-language justification for human policymakers"
    )
    supporting_evidence: list[str] = Field(
        default_factory=list,
        description="Citations of data points supporting this recommendation"
    )
    limitations: list[str] = Field(
        default_factory=list,
        description="Documented constraints, missing variables, or synthetic warnings"
    )
    processing_status: Literal["PROPOSED", "UNDER_REVIEW", "ACTIONED", "REJECTED"] = Field(
        default="PROPOSED",
        description="Lifecycle status of this recommendation"
    )
    model_version: str | None = Field(
        default=None,
        description="Model identifier that produced this recommendation. None if unknown; must not be hardcoded to an assumed model."
    )
    human_review_status: Literal["PENDING", "ACCEPTED", "MODIFIED", "REJECTED"] = Field(
        default="PENDING",
        description="Human policymaker sign-off status"
    )

    @field_validator("score_components")
    @classmethod
    def validate_score_components(cls, v: dict[str, float]) -> dict[str, float]:
        """Validate score component values are non-negative finite numbers."""
        for k, val in v.items():
            if val is None or math.isnan(val) or math.isinf(val) or val < 0.0:
                raise ValueError(
                    f"Score component '{k}' must be a non-negative finite number, got {val}"
                )
        return v


# ============================================================================
# Canonical Schema 6: PolicyAction
# ============================================================================

class PolicyAction(BaseModel):
    """
    Model 6: Auditable record of human policymaker review and intervention.
    Enforces that AI recommendations require explicit human approval and audit trails.

    ARCHITECTURAL NOTE — REST RUNTIME COMPATIBILITY:
    The running REST API (spin_agents/api.py:56) and frontend dashboard
    (frontend/dashboard/src/hooks/usePolicyData.ts) currently exchange a lightweight
    dispatch payload:
      - grievance_id: str
      - user_id: str
      - target_language: str
      - action: "approved" | "rejected" | "reallocated"
      - budget_cr: float | None
      - message_en: str
    
    This canonical audit schema (spin_agents.schemas.PolicyAction) represents the
    authoritative governance audit record required by the SPIN contract.
    Reviewer identities (reviewer_id, reviewer_role) and recommendation_id are strictly
    required and must NOT be fabricated or given dummy defaults.
    In Day 2, a formal adapter will translate the frontend dispatch payload into this
    canonical audit model upon JWT verification, preserving runtime compatibility
    without changing Day 1 runtime behavior.
    """
    action_id: str = Field(
        default_factory=lambda: f"ACT-{uuid.uuid4().hex[:8].upper()}",
        description="Unique policy action audit ID"
    )
    recommendation_id: str = Field(
        ...,
        description="Target PriorityRecommendation ID being approved/rejected"
    )
    grievance_id: str | None = Field(
        default=None,
        description="Optional single grievance ID if action targets an individual record"
    )
    reviewer_id: str = Field(
        ...,
        description="Authenticated official user ID or employee ID of the reviewer"
    )
    reviewer_role: str = Field(
        ...,
        description="Role of reviewer (e.g. 'department_head', 'policymaker', 'commissioner')"
    )
    decision: Literal["approved", "rejected", "reallocated", "modified"] = Field(
        ...,
        description="Formal policymaker decision"
    )
    selected_interventions: list[str] = Field(
        default_factory=list,
        description="Specific municipal actions selected for dispatch"
    )
    allocated_budget_cr: float | None = Field(
        default=None,
        ge=0.0,
        description="Fiscal allocation authorized in Crores INR"
    )
    notes: str | None = Field(
        default=None,
        description="Official rationale or instructions for executing officers"
    )
    reviewed_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of human sign-off"
    )

    @field_validator("reviewer_id", "reviewer_role", "recommendation_id")
    @classmethod
    def validate_non_blank_strings(cls, v: str, info) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError(f"{info.field_name} cannot be blank or whitespace.")
        return stripped
