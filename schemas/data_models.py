"""Data schemas for SPIN Citizen Grievance AI Pipeline.

Adheres strictly to the SPIN Redesign - Raise a Query Pipeline Guide.
Enforces zero hallucination, null preservation, and comprehensive audit tracking.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, ConfigDict


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class ChannelType(str, Enum):
    PWA = "pwa"
    WHATSAPP = "whatsapp"
    SMS_IVR = "sms_ivr"
    DIASPORA_PROXY = "diaspora_proxy"


class GrievanceType(str, Enum):
    COMPLAINT = "complaint"
    ISSUE = "issue"
    SUGGESTION = "suggestion"
    APPRECIATION = "appreciation"


class GrievanceCategory(str, Enum):
    ROADS = "roads"
    WATER = "water"
    GARBAGE = "garbage"
    ELECTRICITY = "electricity"
    DRAINAGE = "drainage"
    OTHER = "other"


class GrievanceStatus(str, Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"


class FieldSource(str, Enum):
    AI_INFERRED = "ai_inferred"
    CITIZEN_CONFIRMED = "citizen_confirmed"
    CITIZEN_CORRECTED = "citizen_corrected"


# ---------------------------------------------------------------------------
# Core Sub-Models
# ---------------------------------------------------------------------------

class LocationModel(BaseModel):
    """Geographic and jurisdictional location information.
    Enforces null preservation when coordinate/landmark information is not given.
    """
    model_config = ConfigDict(extra="ignore")

    latitude: Optional[float] = Field(
        default=None,
        description="Latitude in decimal degrees or null if not provided",
    )
    longitude: Optional[float] = Field(
        default=None,
        description="Longitude in decimal degrees or null if not provided",
    )
    landmark_text: Optional[str] = Field(
        default=None,
        description="Text description of nearest landmark or location string",
    )
    home_ward: Optional[str] = Field(
        default=None,
        description="Home ward / municipal ward (critical for diaspora_proxy)",
    )
    district: Optional[str] = Field(
        default=None,
        description="Inferred or confirmed administrative district",
    )
    state: Optional[str] = Field(
        default=None,
        description="Inferred or confirmed state",
    )


class ConfidenceScores(BaseModel):
    """Confidence scores across critical extracted dimensions (0.0 to 1.0)."""
    model_config = ConfigDict(extra="ignore")

    category: float = Field(default=0.0, ge=0.0, le=1.0)
    severity: float = Field(default=0.0, ge=0.0, le=1.0)
    location: float = Field(default=0.0, ge=0.0, le=1.0)


class Timestamps(BaseModel):
    """Lifecycle timestamp records."""
    model_config = ConfigDict(extra="ignore")

    created: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    confirmed: Optional[datetime] = Field(default=None)
    routed: Optional[datetime] = Field(default=None)


# ---------------------------------------------------------------------------
# Complete Grievance Specification (Pydantic v2)
# ---------------------------------------------------------------------------

class GrievanceSchema(BaseModel):
    """Main citizen grievance entity matching the exact data schema specification."""
    model_config = ConfigDict(extra="ignore")

    citizen_id: str = Field(
        description="Phone + OTP shared identity across channels (or anonymous token)"
    )
    channel: ChannelType = Field(
        default=ChannelType.PWA,
        description="Originating channel"
    )
    query_id: str = Field(
        description="Unique system ticket identifier (e.g. SPIN-YYYYMMDD-XXXX)"
    )
    type: GrievanceType = Field(
        default=GrievanceType.COMPLAINT,
        description="Type of submission"
    )
    category: GrievanceCategory = Field(
        default=GrievanceCategory.OTHER,
        description="Civic category classified by AI or selected by citizen"
    )
    description_original: str = Field(
        description="Original text input from citizen (native language)"
    )
    description_translated: str = Field(
        description="Canonical English translated text"
    )
    severity: Optional[int] = Field(
        default=None,
        ge=1,
        le=10,
        description="Impact severity integer (1-10) or null if unknown"
    )
    location: LocationModel = Field(
        default_factory=LocationModel,
        description="Location coordinates, landmark, and home ward"
    )
    proxy_filed_for: Optional[str] = Field(
        default=None,
        description="Resident name/details if filed by a proxy/diaspora member"
    )
    media_url: Optional[str] = Field(
        default=None,
        description="URL of attached photo/audio"
    )
    language: str = Field(
        default="en",
        description="Native language code (e.g. hi, mr, ta, te, bn, en)"
    )
    duplicate_of: Optional[str] = Field(
        default=None,
        description="query_id of existing ticket if flagged as duplicate"
    )
    department: str = Field(
        default="Pending Deterministic Routing",
        description="Department strictly assigned via deterministic rules engine"
    )
    confidence_scores: ConfidenceScores = Field(
        default_factory=ConfidenceScores,
        description="Individual confidence scores"
    )
    field_source_log: Dict[str, str] = Field(
        default_factory=dict,
        description="Audit mapping of field -> ai_inferred | citizen_confirmed | citizen_corrected"
    )
    status: GrievanceStatus = Field(
        default=GrievanceStatus.SUBMITTED,
        description="Current ticket lifecycle status"
    )
    timestamps: Timestamps = Field(
        default_factory=Timestamps,
        description="Created, confirmed, and routed timestamps"
    )


# ---------------------------------------------------------------------------
# Agent 1 (Semantic Parsing) Input / Output Contracts
# ---------------------------------------------------------------------------

class IngestionRequest(BaseModel):
    """Payload sent into Agent 1 from channel adapters."""
    citizen_id: str
    channel: ChannelType = ChannelType.PWA
    text: Optional[str] = None
    audio_url: Optional[str] = None
    media_url: Optional[str] = None
    language: str = "hi"
    location_hint: Optional[Dict[str, Any]] = None
    proxy_filed_for: Optional[str] = None


class SemanticParsingOutput(BaseModel):
    """Output from Agent 1 (Semantic Parsing & Multimodal Ingestion)."""
    citizen_id: str
    channel: ChannelType
    type: GrievanceType
    category: GrievanceCategory
    description_original: str
    description_translated: str
    severity: Optional[int] = None
    location: LocationModel
    media_url: Optional[str] = None
    language: str
    proxy_filed_for: Optional[str] = None

    confidence_scores: ConfidenceScores
    duplicate_match_id: Optional[str] = None
    vision_alignment_status: Literal["not_applicable", "aligned", "discrepancy_detected", "vision_unavailable"] = "not_applicable"
    vision_details: Optional[Dict[str, Any]] = None
    needs_clarification: bool = False
    clarification_reasons: List[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Agent 2 (Dynamic Verification) Input / Output Contracts
# ---------------------------------------------------------------------------

class VerificationQuestionItem(BaseModel):
    """Targeted question for a missing or low-confidence field."""
    field_name: str
    prompt_text: str
    prompt_native: str
    field_type: Literal["select", "text", "location", "rating"] = "text"
    options: List[str] = Field(default_factory=list)
    dtmf_mapping: Optional[Dict[str, str]] = None  # e.g. {"1": "Roads", "2": "Water"}
    current_value: Optional[Any] = None


class ReadBackCard(BaseModel):
    """Native language summary card for citizen sign-off."""
    headline_native: str
    category_native: str
    location_summary_native: str
    severity_native: str
    description_summary_native: str
    confirmation_prompt: str


class DynamicVerificationOutput(BaseModel):
    """Output from Agent 2: either questions needed or fully confirmed grievance."""
    is_fully_confirmed: bool
    questionnaire: List[VerificationQuestionItem] = Field(default_factory=list)
    read_back_card: Optional[ReadBackCard] = None
    partial_grievance: Optional[GrievanceSchema] = None


# ---------------------------------------------------------------------------
# Agent 3 (Policy & Routing) Input / Output Contracts
# ---------------------------------------------------------------------------

class ExecutiveSummary(BaseModel):
    """3-sentence summary for policymakers derived via BigQuery MCP."""
    three_sentence_summary: str
    district: str
    total_complaints_analyzed: int
    top_recurring_category: str
    red_zone_count: int
    recommended_policy_action: str


class ReverseNotificationPayload(BaseModel):
    """Citizen notification payload in native language dispatched via channel."""
    citizen_id: str
    channel: ChannelType
    language: str
    query_id: str
    department_assigned: str
    message_native: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PolicyRoutingOutput(BaseModel):
    """Final output from Agent 3."""
    registration_status: Literal["success", "duplicate_recorded", "routing_failed"]
    query_id: str
    department: str
    ward_or_jurisdiction: str
    notification_payload: ReverseNotificationPayload
    is_red_zone_priority: bool
    executive_summary: Optional[ExecutiveSummary] = None
    final_grievance: GrievanceSchema
