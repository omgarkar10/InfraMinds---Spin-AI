"""Root agents export: dynamic_verification agent."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from backend.spin_agents.agents.dynamic_verification import (
    dynamic_verification_agent,
    execute_dynamic_verification,
)

__all__ = ["dynamic_verification_agent", "execute_dynamic_verification"]
