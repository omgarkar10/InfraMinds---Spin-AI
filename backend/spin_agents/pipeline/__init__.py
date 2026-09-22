"""Pipeline package for the SPIN 3-agent decoupled orchestration."""
from spin_agents.pipeline.orchestrator import (
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
