"""Root agents export: re-exports 3 decoupled agents and their execution helpers."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from backend.spin_agents.agents.semantic_parsing import (
    semantic_parsing_agent,
    execute_semantic_parsing,
)

__all__ = ["semantic_parsing_agent", "execute_semantic_parsing"]
