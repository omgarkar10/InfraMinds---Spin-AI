"""SPIN environment configuration."""

from __future__ import annotations

import os
import secrets
from dataclasses import dataclass, field


def _require_env(name: str) -> str:
    """Return the value of a required env var, or raise a clear error on startup."""
    val = os.getenv(name, "")
    if not val:
        raise RuntimeError(
            f"Required environment variable '{name}' is not set. "
            "Set it in your .env file or CI/CD secrets before starting the server."
        )
    return val


def _jwt_secret() -> str:
    """Returns JWT_SECRET env var. Uses strong ephemeral secret if not set in non-production environments."""
    val = os.getenv("JWT_SECRET", "")
    if not val:
        # Generate an ephemeral secret for dev/testing so imports don't crash unexpectedly
        return secrets.token_hex(64)
    if val in ("supersecretkey", "secret", "changeme", "password"):
        raise RuntimeError(
            f"JWT_SECRET is set to an insecure placeholder value '{val}'. "
            "Replace it with a cryptographically random string."
        )
    return val



@dataclass(frozen=True)
class SpinConfig:
    gemini_model: str = field(default_factory=lambda: os.getenv("GEMINI_MODEL", "gemini-2.5-flash"))
    gcp_project: str = field(default_factory=lambda: os.getenv("GOOGLE_CLOUD_PROJECT", ""))
    gcp_location: str = field(default_factory=lambda: os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1"))
    bigquery_dataset: str = field(default_factory=lambda: os.getenv("SPIN_BQ_DATASET", "spin_grievances"))
    bigquery_table: str = field(default_factory=lambda: os.getenv("SPIN_BQ_TABLE", "citizen_complaints"))
    bhashini_api_url: str = field(default_factory=lambda: os.getenv(
        "BHASHINI_API_URL", "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
    ))
    bhashini_api_key: str = field(default_factory=lambda: os.getenv("BHASHINI_API_KEY", ""))
    bhashini_user_id: str = field(default_factory=lambda: os.getenv("BHASHINI_USER_ID", ""))
    gati_shakti_api_url: str = field(default_factory=lambda: os.getenv(
        "GATI_SHAKTI_API_URL", "https://api.gati.gov.in/v1/layers/query"
    ))
    gati_shakti_api_key: str = field(default_factory=lambda: os.getenv("GATI_SHAKTI_API_KEY", ""))
    firebase_project_id: str = field(default_factory=lambda: os.getenv("FIREBASE_PROJECT_ID", ""))
    dashboard_api_url: str = field(default_factory=lambda: os.getenv("SPIN_DASHBOARD_API_URL", "http://localhost:8080/api"))
    # DATABASE_URL must be set to PostgreSQL in production; falls back to SQLite only for local dev
    database_url: str = field(default_factory=lambda: os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./spin.db"))
    # JWT_SECRET is validated at import time — will raise RuntimeError if insecure
    jwt_secret: str = field(default_factory=_jwt_secret)
    # CORS: must NOT be wildcard in production
    cors_origins: str = field(default_factory=lambda: os.getenv("CORS_ORIGINS", "http://localhost:5173"))
    bhashini_translation_service_id: str = field(default_factory=lambda: os.getenv("BHASHINI_TRANSLATION_SERVICE_ID", ""))
    bhashini_asr_service_id: str = field(default_factory=lambda: os.getenv("BHASHINI_ASR_SERVICE_ID", ""))
    google_application_credentials: str = field(default_factory=lambda: os.getenv("GOOGLE_APPLICATION_CREDENTIALS", ""))
    google_maps_api_key: str = field(default_factory=lambda: os.getenv("GOOGLE_MAPS_API_KEY", ""))

    # A2A microservice endpoints (Cloud Run / Agent Engine)
    intake_agent_card: str = field(default_factory=lambda: os.getenv(
        "INTAKE_AGENT_CARD", "http://localhost:8001/.well-known/agent-card.json"
    ))
    parsing_agent_card: str = field(default_factory=lambda: os.getenv(
        "PARSING_AGENT_CARD", "http://localhost:8002/.well-known/agent-card.json"
    ))
    geospatial_agent_card: str = field(default_factory=lambda: os.getenv(
        "GEOSPATIAL_AGENT_CARD", "http://localhost:8003/.well-known/agent-card.json"
    ))
    policy_agent_card: str = field(default_factory=lambda: os.getenv(
        "POLICY_AGENT_CARD", "http://localhost:8004/.well-known/agent-card.json"
    ))
    use_remote_agents: bool = field(default_factory=lambda: os.getenv("SPIN_USE_REMOTE_AGENTS", "false").lower() == "true")


CONFIG = SpinConfig()
