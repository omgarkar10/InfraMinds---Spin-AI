"""ADK Runner integration for end-to-end pipeline execution."""

from __future__ import annotations

import json
import uuid
from typing import Any

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from spin_agents.agent import root_agent

_session_service = InMemorySessionService()
_runner = Runner(
    agent=root_agent,
    app_name="spin",
    session_service=_session_service,
)


async def run_pipeline(
    user_message: str,
    intake_payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Execute the SPIN ADK pipeline and return funnelled JSON outputs."""
    session_id = str(uuid.uuid4())
    user_id = (intake_payload or {}).get("user_id", "anonymous")
    initial_state: dict[str, Any] = {}
    if intake_payload:
        initial_state["intake_payload"] = intake_payload

    await _session_service.create_session(
        app_name="spin",
        user_id=user_id,
        session_id=session_id,
        state=initial_state,
    )

    final_text = ""
    async for event in _runner.run_async(
        user_id=user_id,
        session_id=session_id,
        new_message=types.Content(
            role="user",
            parts=[types.Part(text=user_message)],
        ),
    ):
        if event.content and event.content.parts:
            for part in event.content.parts:
                if part.text:
                    final_text = part.text

    session = await _session_service.get_session(
        app_name="spin",
        user_id=user_id,
        session_id=session_id,
    )
    state = session.state if session else {}
    return {
        "session_id": session_id,
        "pipeline_status": state.get("pipeline_status", "completed"),
        "intake_payload": _parse_json(state.get("intake_payload")),
        "parsed_payload": _parse_json(state.get("parsed_payload")),
        "geospatial_result": _parse_json(state.get("geospatial_result")),
        "policy_output": _parse_json(state.get("policy_output")),
        "final_response": final_text,
    }


def _parse_json(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value
    return value
