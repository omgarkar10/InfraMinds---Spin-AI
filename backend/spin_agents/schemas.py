"""Pydantic request/response schemas for SPIN API endpoints.

Backward-compatible with existing frontend webhooks and API integrations.
Thin wrappers that use the same field names as the original schemas.py
while internally delegating to the canonical data_models from schemas/.
"""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class CitizenMessage(BaseModel):
    user_id: str = "anonymous"
    text: Optional[str] = None
    audio_url: Optional[str] = None
    media_url: Optional[str] = None
    source_language: str = "hi"
    location: Optional[dict] = None
    channel: str = "pwa"
    proxy_filed_for: Optional[str] = None


class PolicyAction(BaseModel):
    grievance_id: str
    user_id: str = "anonymous"
    target_language: str = "hi"
    action: str = Field(description="approved|rejected|reallocated")
    budget_cr: Optional[float] = None
    message_en: str = "Your infrastructure grievance has been approved for action."


class PipelineRequest(BaseModel):
    user_id: str = "anonymous"
    text: str
    source_language: str = "hi"
    location: Optional[dict] = None
    media_url: Optional[str] = None
    run_adk: bool = True
    channel: str = "pwa"
    proxy_filed_for: Optional[str] = None


class TranslateRequest(BaseModel):
    text: str
    target_language: str = "en"
    source_language: Optional[str] = None
