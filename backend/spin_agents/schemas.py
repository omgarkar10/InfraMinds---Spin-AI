"""Pydantic request/response schemas for SPIN API endpoints.

Separated from DB models (models.py) to keep API contracts independent of persistence.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


class CitizenMessage(BaseModel):
    user_id: str
    text: str | None = None
    audio_url: str | None = None
    media_url: str | None = None
    source_language: str = "hi"
    location: dict | None = None


class PolicyAction(BaseModel):
    grievance_id: str
    user_id: str
    target_language: str = "hi"
    action: str = Field(description="approved|rejected|reallocated")
    budget_cr: float | None = None
    message_en: str = "Your infrastructure grievance has been approved for action."


class PipelineRequest(BaseModel):
    user_id: str = "anonymous"
    text: str
    source_language: str = "hi"
    location: dict | None = None
    media_url: str | None = None
    run_adk: bool = True


class TranslateRequest(BaseModel):
    text: str
