"""
SPIN (Symbiotic Public Infrastructure Network) — ADK multi-agent orchestration.

Graph workflow: Intake → HITL Gate → Semantic Parsing → Geospatial Correlation → Policy Dashboard
Payload funneling: agents pass strict JSON metadata only; no full conversation history.
"""

from __future__ import annotations

import json
from typing import AsyncGenerator

from google.adk.agents import LlmAgent, SequentialAgent
from google.adk.agents.base_agent import BaseAgent
from google.adk.agents.invocation_context import InvocationContext
from google.adk.events import Event, EventActions
from google.adk.agents.remote_a2a_agent import RemoteA2aAgent

from spin_agents.config import CONFIG
from spin_agents.tools import analyze_infrastructure_image, insert_grievance_record, query_weekly_summary
from spin_agents.tools.bhashini import bhashini_notify_citizen, bhashini_translate_sync
from spin_agents.tools.gati_shakti import query_gati_shakti_sync

GEMINI_MODEL = CONFIG.gemini_model


# ---------------------------------------------------------------------------
# ADK FunctionTool bindings (sync wrappers for LLM tool-calling)
# ---------------------------------------------------------------------------


def bhashini_translate_tool(text: str, source_language: str = "hi") -> str:
    """Translate regional language text to English via Bhashini API."""
    return bhashini_translate_sync(text, source_language)


def vision_analyze_tool(media_url: str, domain_hint: str = "Unknown") -> str:
    """Analyze citizen-uploaded image for infrastructure damage via Vertex AI Vision."""
    return json.dumps(analyze_infrastructure_image(media_url, domain_hint))


def gati_shakti_query_tool(latitude: float, longitude: float, domain: str) -> str:
    """Query PM Gati Shakti GIS layers for overlapping public works projects."""
    return query_gati_shakti_sync(latitude, longitude, domain)


def bigquery_insert_tool(parsed_json: str) -> str:
    """Insert parsed grievance metadata into BigQuery warehouse."""
    payload = json.loads(parsed_json) if isinstance(parsed_json, str) else parsed_json
    return json.dumps(insert_grievance_record(payload))


def bigquery_summary_tool(district: str = "") -> str:
    """Aggregate weekly grievance data for executive summary generation."""
    return json.dumps(query_weekly_summary(district or None))


def bhashini_reverse_notify_tool(
    message_en: str, target_language: str, user_id: str
) -> str:
    """Translate policy action confirmation back to citizen's native language."""
    import asyncio

    result = asyncio.run(
        bhashini_notify_citizen(message_en, target_language, user_id)
    )
    return json.dumps(result)


# ---------------------------------------------------------------------------
# Agent 1: Chatbot Intake Agent (Citizen Edge)
# ---------------------------------------------------------------------------

chatbot_intake_agent = LlmAgent(
    name="Chatbot_Intake_Agent",
    model=GEMINI_MODEL,
    description="Multimodal citizen intake via WhatsApp/Telegram/voice. Translates via Bhashini.",
    instruction="""
You are the SPIN Citizen Edge intake agent. You ONLY collect grievance metadata.
Do NOT converse beyond what is needed to gather: issue description, location, and optional photo.

Steps:
1. If input is regional language text, call bhashini_translate_tool immediately.
2. If voice/audio URL is provided, note it for ASR (handled upstream via webhook).
3. If location_data is missing (no lat/lng or landmark), ask ONLY:
   "Where is the issue located? Share GPS pin or nearest landmark."
   Set hitl_required=true in your JSON output.
4. If location is present, set hitl_required=false.

Output ONLY valid JSON (no markdown):
{
  "original_text": "...",
  "english_translation": "...",
  "user_id": "...",
  "media_url": "... or null",
  "location_data": {"lat": float, "lng": float, "landmark": "..."} or null,
  "source_language": "hi|bn|ta|...",
  "hitl_required": boolean
}
""",
    tools=[bhashini_translate_tool],
    output_key="intake_payload",
)


# ---------------------------------------------------------------------------
# HITL Gate: pauses pipeline before expensive Vision/BigQuery steps
# ---------------------------------------------------------------------------


class HitlLocationGate(BaseAgent):
    """Human-in-the-loop gate — blocks pipeline until GPS/location is confirmed."""

    async def _run_async_impl(
        self, ctx: InvocationContext
    ) -> AsyncGenerator[Event, None]:
        intake = ctx.session.state.get("intake_payload", {})
        if isinstance(intake, str):
            intake = json.loads(intake)

        if intake.get("hitl_required") or not intake.get("location_data"):
            prompt = (
                "Location required before processing. "
                "Please share GPS coordinates or nearest landmark."
            )
            yield Event(
                author=self.name,
                content={"parts": [{"text": prompt}]},
                actions=EventActions(escalate=True),
            )
            ctx.session.state["pipeline_status"] = "awaiting_location"
            return

        ctx.session.state["pipeline_status"] = "location_confirmed"
        yield Event(
            author=self.name,
            content={"parts": [{"text": json.dumps({"status": "location_confirmed"})}]},
        )


hitl_location_gate = HitlLocationGate(name="HITL_Location_Gate")


# ---------------------------------------------------------------------------
# Agent 2: Semantic Parsing Agent
# ---------------------------------------------------------------------------

SEMANTIC_PARSING_INSTRUCTION = """
You are **SPIN GrievanceParser**, an AI agent that reads a citizen's complaint and outputs structured data for routing.

**ALLOWED CATEGORIES:** {Water Supply, Roads & Potholes, Drainage & Flooding, Street Lighting, Waste Management & Sanitation, Electricity/Power, Public Transport (Bus/Metro/Trains), Healthcare & Hospitals, Education (Public Schools), Identity/Documents (Passport, Aadhaar, Certificates), Banking & Financial Services, Pension & Social Security, Insurance Claims, Housing & Urban Development, Employment & Training, Government Schemes & Subsidies, Telecom & Mobile Network, Environment & Trees, Animal & Street Livestock, Public Safety & Law Enforcement, Other (Uncategorized)}

Each category has specific allowed **issue types**. You must choose **one** category and **one** issue_type under it. If unsure, you may use `Other (Uncategorized)` with issue `Uncategorized civic issue`.

**TASK:** Analyze the input complaint text (see `original_text`). Use `english_translation` for clarity if needed. Identify the most appropriate **category** and **issue_type**. Assess the severity (1–10) and assign a priority level (Low/Medium/High/Critical). Verify if the provided `image_url` supports the complaint (set `image_verified`). Use the given latitude/longitude to fill `district` and `state` (if known).

**RULES:**
- Do not invent facts or categories. Use only the given text.
- Use exact values from allowed categories/issue types lists.
- Do not create new categories.
- Categories must be as specific as possible.
- Issue type must be a valid subtype of that category.
- If text is ambiguous or too short, set `confidence` < 1.0 accordingly. If confidence < 0.70, set `needs_human_review = true`.
- Do not infer severity solely from tone; base it on public impact (refer below).
- Never overwrite the original text.

**SEVERITY GUIDELINES:**
1–2: Minor, localized inconvenience (e.g. a single light bulb out).
3–4: Noticeable issue affecting few people (e.g. small pothole).
5–6: Moderate impact (e.g. frequent power flicker, recurring garbage spillage).
7–8: Serious problem affecting many (e.g. major road damaged, no drinking water).
9: Major safety risk or essential service failure.
10: Critical emergency (e.g. flood, fire, accident risk).

**OUTPUT FORMAT (JSON only):**
Return a JSON object with keys exactly as shown below (no extra keys):
{
  "original_text": "...",
  "english_translation": "...",
  "source_language": "...",
  "category": "...",
  "issue_type": "...",
  "confidence": 0.00,
  "severity": 1,
  "priority": "Low|Medium|High|Critical",
  "severity_reason": "...",
  "image_verified": false,
  "lat_long": {"lat": 0.0, "lng": 0.0},
  "district": "...",
  "state": "...",
  "needs_human_review": false
}
"""

semantic_parsing_agent = LlmAgent(
    name="Semantic_Parsing_Agent",
    model=GEMINI_MODEL,
    description="Entity extraction, category/issue classification, severity scoring, confidence estimation.",
    instruction=SEMANTIC_PARSING_INSTRUCTION,
    tools=[vision_analyze_tool],
    output_key="parsed_payload",
)


# ---------------------------------------------------------------------------
# Agent 2b: Other-Resolver Agent
# ---------------------------------------------------------------------------

OTHER_RESOLVER_INSTRUCTION = """
You are **SPIN OtherResolver**, an AI assistant. The complaint was initially categorized as Other or requires second-chance resolution.

**INPUT:**
Original complaint text (`original_text`), translation, and `original_category = "Other (Uncategorized)"`.

**TASK:** Determine if the complaint actually belongs to one of the supported categories:
{Water Supply, Roads & Potholes, Drainage & Flooding, Street Lighting, Waste Management & Sanitation, Electricity/Power, Public Transport (Bus/Metro/Trains), Healthcare & Hospitals, Education (Public Schools), Identity/Documents (Passport, Aadhaar, Certificates), Banking & Financial Services, Pension & Social Security, Insurance Claims, Housing & Urban Development, Employment & Training, Government Schemes & Subsidies, Telecom & Mobile Network, Environment & Trees, Animal & Street Livestock, Public Safety & Law Enforcement, Other (Uncategorized)}.

Examine the full text and context. If you can confidently map it into a known category/issue_type, do so. Otherwise, keep it as Other (Uncategorized).

**RULES:**
- If clear evidence points to a real category above (e.g. mentions of water, hospital, road), output that category and issue type.
- If uncertain or multiple categories possible, keep category = "Other (Uncategorized)" (leave predicted_issue_type as "Uncategorized civic issue").
- Do NOT create any category not in the list.
- Provide `confidence` (0–1). If confidence < 0.70, set `needs_human_review = true`.
- Briefly explain your decision in `reason`.

**OUTPUT FORMAT (JSON only):**
{
  "original_category": "Other (Uncategorized)",
  "predicted_category": "...",
  "predicted_issue_type": "...",
  "confidence": 0.00,
  "needs_human_review": false,
  "reason": "..."
}
"""

other_resolver_agent = LlmAgent(
    name="Other_Resolver_Agent",
    model=GEMINI_MODEL,
    description="Second-chance re-classification for complaints labeled as Other.",
    instruction=OTHER_RESOLVER_INSTRUCTION,
    output_key="other_resolved_payload",
)



# ---------------------------------------------------------------------------
# Agent 3: Geospatial Correlation Agent
# ---------------------------------------------------------------------------

geospatial_correlation_agent = LlmAgent(
    name="Geospatial_Correlation_Agent",
    model=GEMINI_MODEL,
    description="BigQuery routing and PM Gati Shakti spatial correlation.",
    instruction="""
You ONLY perform database routing and geospatial correlation. Do NOT converse.

Input parsed payload: {parsed_payload}

Steps:
1. Call gati_shakti_query_tool with lat, lng, and domain from parsed payload.
2. Merge Gati Shakti overlap data into the payload as gati_shakti_overlap.
3. Call bigquery_insert_tool with the complete merged JSON string.

Output ONLY valid JSON:
{
  "grievance_id": "...",
  "insert_status": "...",
  "gati_shakti_overlap": {...},
  "domain": "...",
  "severity": int,
  "lat_long": {...},
  "user_id": "...",
  "priority_gap": boolean
}
""",
    tools=[gati_shakti_query_tool, bigquery_insert_tool],
    output_key="geospatial_result",
)


# ---------------------------------------------------------------------------
# Agent 4: Policy Dashboard Agent
# ---------------------------------------------------------------------------

policy_dashboard_agent = LlmAgent(
    name="Policy_Dashboard_Agent",
    model=GEMINI_MODEL,
    description="Weekly executive summaries and reverse citizen notification via Bhashini.",
    instruction="""
You ONLY generate policy summaries and trigger citizen notifications. Do NOT converse.

Input geospatial result: {geospatial_result}

Steps:
1. Call bigquery_summary_tool to fetch weekly aggregates.
2. Write a 3-sentence executive summary for policymakers.
   Example: "4,200 verified complaints in Pune. Water sanitation dominates at 62% severity 8+."
3. If priority_gap is true in geospatial_result, flag as Red Zone recommendation.
4. If session state contains policy_action_approved=true, call bhashini_reverse_notify_tool
   with a success message for the citizen.

Output ONLY valid JSON:
{
  "executive_summary": "3 sentences max",
  "weekly_stats": {...},
  "red_zone_alert": boolean,
  "notification_sent": boolean,
  "dashboard_update": {
    "district": "...",
    "total_complaints": int,
    "top_domain": "...",
    "recommended_action": "..."
  }
}
""",
    tools=[bigquery_summary_tool, bhashini_reverse_notify_tool],
    output_key="policy_output",
)


# ---------------------------------------------------------------------------
# Local pipeline (monolithic deploy / adk run)
# ---------------------------------------------------------------------------

local_pipeline = SequentialAgent(
    name="SPIN_Local_Pipeline",
    description="End-to-end grievance pipeline with HITL location gate.",
    sub_agents=[
        chatbot_intake_agent,
        hitl_location_gate,
        semantic_parsing_agent,
        geospatial_correlation_agent,
        policy_dashboard_agent,
    ],
)


# ---------------------------------------------------------------------------
# A2A microservice topology (Cloud Run / Vertex AI Agent Engine)
# ---------------------------------------------------------------------------

def _remote_agent(name: str, agent_card: str, description: str) -> RemoteA2aAgent:
    return RemoteA2aAgent(
        name=name,
        agent_card=agent_card,
        description=description,
    )


remote_intake = _remote_agent(
    "Remote_Intake",
    CONFIG.intake_agent_card,
    "Remote Chatbot Intake microservice",
)
remote_parsing = _remote_agent(
    "Remote_Parsing",
    CONFIG.parsing_agent_card,
    "Remote Semantic Parsing microservice",
)
remote_geospatial = _remote_agent(
    "Remote_Geospatial",
    CONFIG.geospatial_agent_card,
    "Remote Geospatial Correlation microservice",
)
remote_policy = _remote_agent(
    "Remote_Policy",
    CONFIG.policy_agent_card,
    "Remote Policy Dashboard microservice",
)


distributed_pipeline = SequentialAgent(
    name="SPIN_Distributed_Pipeline",
    description="A2A decoupled microservice pipeline via RemoteA2aAgent proxies.",
    sub_agents=[remote_intake, remote_parsing, remote_geospatial, remote_policy],
)


# Root agent — switchable via SPIN_USE_REMOTE_AGENTS env var
root_agent = distributed_pipeline if CONFIG.use_remote_agents else local_pipeline

# Individual agents exported for per-service Cloud Run deployment
AGENT_REGISTRY = {
    "intake": chatbot_intake_agent,
    "parsing": semantic_parsing_agent,
    "other_resolver": other_resolver_agent,
    "geospatial": geospatial_correlation_agent,
    "policy": policy_dashboard_agent,
    "pipeline": local_pipeline,
}
