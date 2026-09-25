# SPIN Execution Flow

This document traces the exact path a payload takes as it travels through the SPIN system.

## 1. Semantic Parsing & Multimodal Ingestion
**Component**: `Semantic_Parsing_Agent`
- Citizen submits a grievance (audio/text).
- If regional language, standardizes it to English via translation tools.
- Evaluates translation to assign domain/category and severity (1-10).
- If media exists, runs vision analysis to confirm physical damage.
- Payload Output: `{ "category", "severity", "location", "confidence_scores" }`

## 2. Dynamic Verification & Read-Back (HITL)
**Component**: `Dynamic_Verification_Agent`
- Intercepts payload. If essential data (e.g. location or category) is missing, execution pauses.
- Prompts user to supply missing details (GPS/landmark, etc.) with targeted questions.
- Proceeds only when `is_fully_confirmed == true`.
- Emits read-back headline in the citizen's native language.

## 3. Policy & Deterministic Routing
**Component**: `Policy_Routing_Agent`
- Reads confirmed parameters and routes coordinates to GIS/BigQuery.
- Evaluates logic for "Red Zone" priority mapping.
- Emits natural language executive summary for the dashboard.
- If policy approved in UI, triggers reverse notification to text the original citizen in their native language.
