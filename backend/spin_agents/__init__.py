import os
import sys

# Add the project root to sys.path so the top-level 'schemas' package can be imported
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from spin_agents.agent import root_agent

__all__ = ["root_agent"]
