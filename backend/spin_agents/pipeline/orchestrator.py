"""Orchestrator for the 3-Agent Decoupled Pipeline.

1. SequentialAgent pipeline for local integration testing and synchronous flows.
2. Decoupled Agent-to-Agent (A2A) microservice endpoints for Cloud Run / Vertex AI Agent Engine.
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional

from google.adk.agents import SequentialAgent
from google.adk.agents.remote_a2a_agent import RemoteA2aAgent

from schemas.data_models import (
    DynamicVerificationOutput,
    IngestionRequest,
    PolicyRoutingOutput,
    SemanticParsingOutput,
)
from spin_agents.agents.dynamic_verification import (
    dynamic_verification_agent,
    execute_dynamic_verification,
)
from spin_agents.agents.policy_routing import (
    execute_policy_routing,
    policy_routing_agent,
)
from spin_agents.agents.semantic_parsing import (
    execute_semantic_parsing,
    semantic_parsing_agent,
)
from spin_agents.config import CONFIG

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# 1. Local SequentialAgent Pipeline (ADK Orchestration)
# ---------------------------------------------------------------------------

three_agent_sequential_pipeline = SequentialAgent(
    name="Three_Agent_Grievance_Pipeline",
    description="Sequential execution of Semantic Parsing -> Dynamic Verification -> Policy Routing.",
    sub_agents=[
        semantic_parsing_agent,
        dynamic_verification_agent,
        policy_routing_agent,
    ],
)


class PipelineExecutionResult:
    """Holds the complete lifecycle output across all 3 decoupled agents."""

    def __init__(
        self,
        semantic_output: SemanticParsingOutput,
        verification_output: DynamicVerificationOutput,
        policy_output: Optional[PolicyRoutingOutput] = None,
    ):
        self.semantic_output = semantic_output
        self.verification_output = verification_output
        self.policy_output = policy_output

    def to_dict(self) -> Dict[str, Any]:
        return {
            "semantic_parsing": self.semantic_output.model_dump(),
            "verification": self.verification_output.model_dump(),
            "policy_routing": self.policy_output.model_dump() if self.policy_output else None,
            "status": "completed" if self.policy_output else "needs_user_verification",
        }


def run_sequential_pipeline(
    request: IngestionRequest,
    citizen_corrections: Optional[Dict[str, Any]] = None,
    explicitly_confirmed: bool = False,
) -> PipelineExecutionResult:
    """Executes the 3-agent pipeline synchronously/locally.
    
    Stage 1: Semantic Parsing & Multimodal Ingestion
    Stage 2: Dynamic Verification & Read-Back (HITL)
    Stage 3: Policy & Deterministic Routing (if verified/confirmed)
    """
    # Stage 1: Parse
    semantic_res = execute_semantic_parsing(request)

    # Stage 2: Verify / HITL
    verification_res = execute_dynamic_verification(
        parsed=semantic_res,
        citizen_corrections=citizen_corrections,
        explicitly_confirmed=explicitly_confirmed,
    )

    # Stage 3: Deterministic Policy Routing (only if confirmed or no blocking questions)
    policy_res = None
    if verification_res.is_fully_confirmed and verification_res.partial_grievance:
        policy_res = execute_policy_routing(verification_res.partial_grievance)

    return PipelineExecutionResult(
        semantic_output=semantic_res,
        verification_output=verification_res,
        policy_output=policy_res,
    )


# ---------------------------------------------------------------------------
# 2. Cloud Microservice Topology: A2A (Agent-to-Agent) Protocol Endpoints
# ---------------------------------------------------------------------------

def create_remote_a2a_pipeline(
    parsing_card: str,
    verification_card: str,
    policy_card: str,
) -> SequentialAgent:
    """Builds an A2A decoupled pipeline proxying remote Cloud Run / Vertex AI microservices."""
    remote_parsing = RemoteA2aAgent(
        name="Remote_Semantic_Parsing",
        agent_card=parsing_card,
        description="Remote Semantic Parsing microservice",
    )
    remote_verification = RemoteA2aAgent(
        name="Remote_Dynamic_Verification",
        agent_card=verification_card,
        description="Remote Dynamic Verification microservice",
    )
    remote_policy = RemoteA2aAgent(
        name="Remote_Policy_Routing",
        agent_card=policy_card,
        description="Remote Policy Routing microservice",
    )

    return SequentialAgent(
        name="A2A_Distributed_Pipeline",
        description="Decoupled A2A microservice pipeline via RemoteA2aAgent proxies",
        sub_agents=[remote_parsing, remote_verification, remote_policy],
    )
