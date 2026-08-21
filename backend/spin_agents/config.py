"""SPIN environment configuration."""

from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class SpinConfig:
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    gcp_project: str = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    gcp_location: str = os.getenv("GOOGLE_CLOUD_LOCATION", "asia-south1")
    bigquery_dataset: str = os.getenv("SPIN_BQ_DATASET", "spin_grievances")
    bigquery_table: str = os.getenv("SPIN_BQ_TABLE", "citizen_complaints")
    bhashini_api_url: str = os.getenv(
        "BHASHINI_API_URL", "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
    )
    bhashini_api_key: str = os.getenv("BHASHINI_API_KEY", "")
    bhashini_user_id: str = os.getenv("BHASHINI_USER_ID", "")
    gati_shakti_api_url: str = os.getenv(
        "GATI_SHAKTI_API_URL", "https://api.gati.gov.in/v1/layers/query"
    )
    gati_shakti_api_key: str = os.getenv("GATI_SHAKTI_API_KEY", "")
    firebase_project_id: str = os.getenv("FIREBASE_PROJECT_ID", "")
    dashboard_api_url: str = os.getenv("SPIN_DASHBOARD_API_URL", "http://localhost:8080/api")

    # A2A microservice endpoints (Cloud Run / Agent Engine)
    intake_agent_card: str = os.getenv(
        "INTAKE_AGENT_CARD", "http://localhost:8001/.well-known/agent-card.json"
    )
    parsing_agent_card: str = os.getenv(
        "PARSING_AGENT_CARD", "http://localhost:8002/.well-known/agent-card.json"
    )
    geospatial_agent_card: str = os.getenv(
        "GEOSPATIAL_AGENT_CARD", "http://localhost:8003/.well-known/agent-card.json"
    )
    policy_agent_card: str = os.getenv(
        "POLICY_AGENT_CARD", "http://localhost:8004/.well-known/agent-card.json"
    )
    use_remote_agents: bool = os.getenv("SPIN_USE_REMOTE_AGENTS", "false").lower() == "true"


CONFIG = SpinConfig()
