"""SPIN (Symbiotic Public Infrastructure Network) — ADK 3-Agent Orchestration.

Restructured Decoupled Pipeline:
1. Semantic Parsing & Multimodal Ingestion Agent (semantic_parsing_agent)
2. Dynamic Verification & Read-Back Agent (dynamic_verification_agent)
3. Policy & Deterministic Routing Agent (policy_routing_agent)

Enforces SAIF, zero hallucination, null preservation, and deterministic rule lookup.
"""

from __future__ import annotations

from typing import Any, Dict

from google.adk.agents import SequentialAgent
from google.adk.agents.remote_a2a_agent import RemoteA2aAgent

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
from spin_agents.pipeline.orchestrator import (
    three_agent_sequential_pipeline,
    run_sequential_pipeline,
)

# ---------------------------------------------------------------------------
# Local Pipeline (SequentialAgent)
# ---------------------------------------------------------------------------
local_pipeline = three_agent_sequential_pipeline


# ---------------------------------------------------------------------------
# Decoupled A2A Microservice Pipeline (Cloud Run / Vertex AI Agent Engine)
# ---------------------------------------------------------------------------
def _remote_agent(name: str, agent_card: str, description: str) -> RemoteA2aAgent:
    return RemoteA2aAgent(
        name=name,
        agent_card=agent_card,
        description=description,
    )


remote_semantic = _remote_agent(
    "Remote_Semantic_Parsing",
    getattr(CONFIG, "parsing_agent_card", "http://localhost:8001/a2a/parsing"),
    "Remote Semantic Parsing microservice",
)
remote_verification = _remote_agent(
    "Remote_Dynamic_Verification",
    getattr(CONFIG, "verification_agent_card", "http://localhost:8002/a2a/verification"),
    "Remote Dynamic Verification microservice",
)
remote_policy = _remote_agent(
    "Remote_Policy_Routing",
    getattr(CONFIG, "policy_agent_card", "http://localhost:8003/a2a/policy"),
    "Remote Policy Routing microservice",
)

distributed_pipeline = SequentialAgent(
    name="SPIN_3Agent_Distributed_Pipeline",
    description="A2A decoupled 3-agent pipeline via RemoteA2aAgent proxies.",
    sub_agents=[remote_semantic, remote_verification, remote_policy],
)

# Root agent — switchable via SPIN_USE_REMOTE_AGENTS env var
root_agent = distributed_pipeline if getattr(CONFIG, "use_remote_agents", False) else local_pipeline

# Exported Agent Registry
AGENT_REGISTRY: Dict[str, Any] = {
    "semantic_parsing": semantic_parsing_agent,
    "dynamic_verification": dynamic_verification_agent,
    "policy_routing": policy_routing_agent,
    "pipeline": local_pipeline,
    # Backward-compatible keys
    "intake": semantic_parsing_agent,
    "parsing": semantic_parsing_agent,
    "policy": policy_routing_agent,
}
