# SPIN Execution Flow

This document traces the exact path a payload takes as it travels through the SPIN system.

## 1. Intake & Translation
**Component**: `Chatbot_Intake_Agent`
- Citizen submits a grievance (audio/text).
- If regional language, `bhashini_translate_tool` standardizes it to English.
- Payload Output: `{ "original_text", "english_translation", "user_id", "media_url", "location_data", "hitl_required" }`

## 2. HITL Gate (Human-in-the-Loop)
**Component**: `HitlLocationGate`
- Intercepts payload. If `location_data` is null, execution pauses.
- Prompts user to supply GPS/landmark.
- Proceeds only when `pipeline_status == "location_confirmed"`.

## 3. Semantic Analysis
**Component**: `Semantic_Parsing_Agent`
- Evaluates `english_translation` to assign `domain` (Water/Road/Power) and `severity` (1-10).
- If `media_url` exists, runs `vision_analyze_tool` to confirm physical damage.
- Payload Appended: `{ "domain", "severity", "image_verified", "lat_long" }`

## 4. Geospatial Correlation
**Component**: `Geospatial_Correlation_Agent`
- Reads `lat_long` and routes the coordinates to `gati_shakti_query_tool`.
- Commits final merged JSON string into BigQuery via `bigquery_insert_tool`.
- Payload Appended: `{ "priority_gap" }`

## 5. Dashboard Generation
**Component**: `Policy_Dashboard_Agent`
- Queries `bigquery_summary_tool` for aggregate data.
- Emits natural language executive summary.
- If policy approved in UI, triggers `bhashini_reverse_notify_tool` to text the original citizen in their native language.
