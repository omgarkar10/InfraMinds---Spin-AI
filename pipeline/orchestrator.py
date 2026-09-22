"""Root pipeline export: re-exports orchestrator."""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from backend.spin_agents.pipeline.orchestrator import (
    three_agent_sequential_pipeline,
    run_sequential_pipeline,
    create_remote_a2a_pipeline,
    PipelineExecutionResult,
)

__all__ = [
    "three_agent_sequential_pipeline",
    "run_sequential_pipeline",
    "create_remote_a2a_pipeline",
    "PipelineExecutionResult",
]
