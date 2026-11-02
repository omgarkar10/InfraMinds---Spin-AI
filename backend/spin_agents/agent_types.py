"""Lightweight agent descriptors replacing google-adk."""

from dataclasses import dataclass, field
from typing import Any, List

@dataclass
class Agent:
    name: str = ""
    model: str = ""
    description: str = ""
    instruction: str = ""
    output_key: str = ""
    sub_agents: List[Any] = field(default_factory=list)
    agent_card: str = ""

LlmAgent = Agent
SequentialAgent = Agent
RemoteA2aAgent = Agent

