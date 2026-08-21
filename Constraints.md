# SPIN Architecture Constraints

This is the strict list of boundaries that must NEVER be crossed during development.

1. **Python 3.10+ Only**: The Google ADK library requires modern Python asyncio features. Do not downgrade.
2. **Single-Parent Rule**: Do not create circular references between ADK agents. Data must flow sequentially: `Intake -> Parsing -> Geospatial -> Policy`.
3. **Strict JSON IO**: Agents must never output raw Markdown or chatty conversational text to each other. Use `output_key` and strict JSON schemas.
4. **Mandatory HITL**: Never trigger the `Semantic_Parsing_Agent` (Vertex Vision) or the `Geospatial_Correlation_Agent` (BigQuery) if `location_data` is missing. 
5. **No Direct State Manipulation**: Frontend React components must never update grievance states directly. All mutations must route through the `Policy_Dashboard_Agent` reverse API.
