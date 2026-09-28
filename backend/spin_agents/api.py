"""FastAPI webhook server for Citizen Edge (WhatsApp/Telegram/Firebase/PWA) and A2A Agents.

Exposes:
- Citizen intake webhooks
- Decoupled A2A Microservice endpoints for Agent 1, Agent 2, Agent 3
- Dashboard summaries & policy actions
"""

from __future__ import annotations

import logging
import os
import sys
import traceback

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from contextlib import asynccontextmanager

from schemas.data_models import (
    ChannelType,
    GrievanceSchema,
    IngestionRequest,
    SemanticParsingOutput,
)
from spin_agents.agents.dynamic_verification import execute_dynamic_verification
from spin_agents.agents.policy_routing import execute_policy_routing
from spin_agents.agents.semantic_parsing import execute_semantic_parsing
from spin_agents.auth import router as auth_router
from spin_agents.config import CONFIG
from spin_agents.config_routes import router as config_router
from spin_agents.routers.demand_router import router as demand_router
from spin_agents.routers.dashboard_router import router as dashboard_router
from spin_agents.routers.staff_router import router as staff_router
from spin_agents.schemas import CitizenMessage, PipelineRequest, TranslateRequest
from spin_agents.services.demand_service import process_citizen_webhook
from spin_agents.tools.mcp_bindings import cloud_translate_text

logger = logging.getLogger(__name__)

# ── Lifespan ──────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="SPIN 3-Agent Decoupled Citizen Grievance Engine",
    description="ADK & A2A Microservice Architecture for Multilingual Civic Intelligence",
    version="2.0.0",
    lifespan=lifespan,
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── Global error handler ──────────────────────────────────────────────────────

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler: logs full traceback server-side, returns safe 500 to client."""
    logger.error(
        "Unhandled exception on %s %s\n%s",
        request.method,
        request.url.path,
        traceback.format_exc(),
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again later."},
    )


# ── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=CONFIG.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(auth_router)
app.include_router(config_router)
app.include_router(demand_router)
app.include_router(dashboard_router)
app.include_router(staff_router)

# ── Standalone & Backward-Compatible Endpoints ────────────────────────────────

@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "service": "spin-3-agent-grievance-pipeline",
        "version": "2.0.0",
        "agents": [
            "semantic_parsing_agent",
            "dynamic_verification_agent",
            "policy_routing_agent",
        ],
    }


@app.post("/api/translate")
async def translate_text(payload: TranslateRequest) -> dict:
    """Translates text to English or requested language via Cloud Translation API."""
    res = cloud_translate_text(
        text=payload.text,
        target_language=payload.target_language,
        source_language=payload.source_language,
    )
    return {
        "original_text": res["original_text"],
        "english_translation": res["translated_text"],
        "source_language": res["source_language"],
    }


@app.post("/webhook/firebase")
async def firebase_webhook(request: Request) -> dict:
    """Generic Firebase Cloud Messaging / Firestore trigger adapter."""
    body = await request.json()
    message = CitizenMessage(
        user_id=body.get("userId", body.get("user_id", "anonymous")),
        text=body.get("text"),
        audio_url=body.get("audioUrl"),
        media_url=body.get("mediaUrl"),
        source_language=body.get("language", "hi"),
        location=body.get("location"),
        channel=body.get("channel", "pwa"),
        proxy_filed_for=body.get("proxy_filed_for"),
    )
    return await process_citizen_webhook(message.model_dump())


# ── Decoupled Agent-to-Agent (A2A) Microservice Endpoints ─────────────────────

@app.post("/a2a/semantic-parsing")
async def a2a_semantic_parsing_endpoint(request: IngestionRequest) -> dict:
    """A2A Endpoint for Agent 1: Semantic Parsing & Multimodal Ingestion."""
    output = execute_semantic_parsing(request)
    return output.model_dump()


@app.post("/a2a/dynamic-verification")
async def a2a_dynamic_verification_endpoint(payload: dict) -> dict:
    """A2A Endpoint for Agent 2: Dynamic Verification & Read-Back."""
    parsed_dict = payload.get("parsed") or payload
    parsed = SemanticParsingOutput.model_validate(parsed_dict)
    corrections = payload.get("citizen_corrections")
    confirmed = payload.get("explicitly_confirmed", False)
    output = execute_dynamic_verification(
        parsed=parsed,
        citizen_corrections=corrections,
        explicitly_confirmed=confirmed,
    )
    return output.model_dump()


@app.post("/a2a/policy-routing")
async def a2a_policy_routing_endpoint(grievance: GrievanceSchema) -> dict:
    """A2A Endpoint for Agent 3: Policy & Deterministic Routing."""
    output = execute_policy_routing(grievance)
    return output.model_dump()
