"""Root agents export: policy_routing agent."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from backend.spin_agents.agents.policy_routing import (
    policy_routing_agent,
    execute_policy_routing,
)

__all__ = ["policy_routing_agent", "execute_policy_routing"]
