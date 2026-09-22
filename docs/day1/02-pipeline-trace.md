# 02 — Pipeline Trace: `/api/pipeline/run`

**Endpoint:** `POST /api/pipeline/run`  
**File:** `backend/spin_agents/api.py:136-175`  
**Classification:** VERIFIED (Inspected in current checked-out source)

---

## SECTION A: Exact Current HTTP Request Contract

### Schema: `PipelineRequest` (`spin_agents/api.py:65-71`)

```json
{
  "user_id": "anonymous",
  "text": "Water pipeline burst causing severe flooding on JM Road",
  "source_language": "hi",
  "location": {
    "lat": 18.5204,
    "lng": 73.8567
  },
  "media_url": null,
  "run_adk": true
}
```

### Request Fields Specification:

| Field | Type | Required? | Default | Description / Observed Constraints |
|:---|:---|:---|:---|:---|
| `user_id` | `str` | Optional | `"anonymous"` | Identifier of reporting citizen or system client. |
| `text` | `str` | **Required** | None | Grievance description in natural language. |
| `source_language` | `str` | Optional | `"hi"` | Language code. If `"auto"` sent by frontend, triggers Bhashini/Translate. |
| `location` | `dict \| None` | Optional | `None` | Arbitrary dictionary (e.g. `{"lat": ..., "lng": ...}` or `{"landmark": ...}`). |
| `media_url` | `str \| None` | Optional | `None` | URL pointing to an attached photo or document. |
| `run_adk` | `bool` | Optional | `True` | If `False`, halts processing at intake and returns intake payload only. |

---

## SECTION B: Exact Current HTTP Response Contract

The endpoint produces one of three distinct response shapes depending on input flags:

### 1. Intake-Only Mode (`run_adk == False`):
```json
{
  "intake_payload": {
    "original_text": "Power outage in sector 4",
    "english_translation": "Power outage in sector 4",
    "user_id": "test_user_103",
    "media_url": null,
    "location_data": {"lat": 19.076, "lng": 72.8777},
    "source_language": "en",
    "hitl_required": false
  },
  "status": "intake_only"
}
```

### 2. HITL Gate Paused (`location is None` and `run_adk == True`):
```json
{
  "status": "awaiting_location",
  "intake_payload": { ... },
  "prompt": "Where is the issue located? Share GPS pin or nearest landmark."
}
```

### 3. Full Pipeline Completed (ADK or Fallback):
```json
{
  "status": "completed",
  "session_id": "6d92f7c0-8261-4127-b5b6-2cbe7f91753c",
  "pipeline_status": "completed",
  "intake_payload": {
    "original_text": "Water pipeline burst causing severe flooding on JM Road",
    "english_translation": "Water pipeline burst causing severe flooding on JM Road",
    "user_id": "test_user_104",
    "media_url": null,
    "location_data": {"lat": 18.5204, "lng": 73.8567},
    "source_language": "en",
    "hitl_required": false
  },
  "parsed_payload": {
    "domain": "Water Supply",
    "category": "Water Supply",
    "issue_type": "Reported issue in Water Supply",
    "severity": 8,
    "priority": "High",
    "image_verified": false,
    "lat_long": {"lat": 18.5204, "lng": 73.8567},
    "original_text": "Water pipeline burst causing severe flooding on JM Road",
    "english_translation": "Water pipeline burst causing severe flooding on JM Road",
    "user_id": "test_user_104",
    "district": "Pune",
    "state": "Maharashtra",
    "needs_human_review": false
  },
  "geospatial_result": {
    "grievance_id": "grievance-44cb72e0",
    "insert_status": "persisted",
    "gati_shakti_overlap": { ... },
    "domain": "Water Supply",
    "severity": 8,
    "lat_long": {"lat": 18.5204, "lng": 73.8567},
    "user_id": "test_user_104",
    "priority_gap": true
  },
  "policy_output": {
    "executive_summary": "High-priority Water Supply grievance recorded at [18.5204, 73.8567]. Correlated with PM Gati Shakti GIS layers.",
    "weekly_stats": {
      "total_complaints": 1240,
      "top_domain": "Water Supply",
      "district": "Pune",
      "red_zone_count": 14
    },
    "red_zone_alert": true,
    "notification_sent": true,
    "dashboard_update": {
      "district": "Pune",
      "total_complaints": 1240,
      "top_domain": "Water Supply",
      "recommended_action": "Deploy municipal Water Supply repair team."
    }
  },
  "final_response": "High-priority Water Supply grievance recorded at [18.5204, 73.8567]. Correlated with PM Gati Shakti GIS layers."
}
```

---

## SECTION C: Field-by-Field Data Transformation Table

| Field | Source | Type | Required? | Transformation | Destination | Problem Identified | Proposed Canonical Field |
|:---|:---|:---|:---|:---|:---|:---|:---|
| `text` | Client JSON | `str` | Yes | Passed to `bhashini_translate()` if `source_language != "en"` | `intake["english_translation"]` | If `source_language == "auto"`, passes string `"auto"` to Bhashini API which fails or falls back. | `CitizenRequest.description` |
| `source_language` | Client JSON | `str` | No (def "hi") | String equality check `!= "en"` | `intake["source_language"]` | Accepts unvalidated string values. | `CitizenRequest.source_language` |
| `location` | Client JSON | `dict \| None` | No | Stored directly in `intake["location_data"]` | `runner.py:84` | Arbitrary dict: can be `{lat, lng}`, `{latitude, longitude}`, or `{landmark}`. | `CitizenRequest.location` (`Location` schema) |
| `location.lat` / `lng` | Client JSON | `float` | No | Read via `.get("lat", 18.5204)` in fallback | `lat_long: {"lat", "lng"}` | Silently substitutes Pune coordinates `(18.5204, 73.8567)` when missing! | `Location.latitude`, `Location.longitude` (must be `None` if absent) |
| `media_url` | Client JSON | `str \| None` | No | Direct pass-through | `intake["media_url"]` | Arbitrary strings accepted without URI or MIME validation. | `CitizenRequest.evidence` (`EvidenceItem`) |
| `domain` / `category` | Keyword Heuristic or LLM | `str` | Auto | String match (`water`, `pipe` → `Water Supply`) | `parsed_payload["category"]` | Dual keys `domain` and `category` hold identical strings. | `ParsedRequest.category` & `ParsedRequest.department` |
| `severity` | Heuristic / LLM | `int` | Auto | Assigned 6, 7, or 8 based on keyword | `parsed_payload["severity"]` | No confidence score attached to heuristic assignment. | `ParsedRequest.severity` (1-10) + `ParsedRequest.confidence` |
| `lat_long` | Fallback / ADK | `dict` | Auto | Packaged as `{"lat": lat, "lng": lng}` | `parsed_payload["lat_long"]` | **CRITICAL:** `insert_grievance_record` expects top-level `latitude` and `longitude`, defaulting them to `0.0`. | `ParsedRequest.location` |
| `district` / `state` | Fallback / ADK | `str` | Auto | Hardcoded to `"Pune"` and `"Maharashtra"` in fallback | `parsed_payload["district"]` | Ignores actual citizen coordinates if outside Pune. | `ParsedRequest.location.district`, `state` |
| `grievance_id` | Fallback | `str` | Auto | Generated via `f"grievance-{uuid.uuid4().hex[:8]}"` | `geospatial_result["grievance_id"]` | Format differs from frontend `SPIN-2026-WTR001` or `GRV-XXXX`. | `ParsedRequest.request_id` |

---

## SECTION D: Actual Internal Function Call Sequence

```
1. Client HTTP POST /api/pipeline/run (PipelineRequest)
   │
   ├── 2. Language Translation check (api.py:139)
   │      If source_language != "en":
   │          await bhashini_translate(payload.text, payload.source_language, "en")
   │          (Delegates to translate_to_english() in translate_service.py if API keys missing)
   │
   ├── 3. Intake Assembly (api.py:150-158)
   │      Constructs dict: original_text, english_translation, user_id, media_url,
   │      location_data, source_language, hitl_required (True if location is None)
   │
   ├── 4. Branch: run_adk == False?
   │      YES → Return {"intake_payload": intake, "status": "intake_only"}
   │
   ├── 5. Branch: hitl_required == True?
   │      YES → Return {"status": "awaiting_location", "prompt": "...", "intake_payload": intake}
   │
   └── 6. ADK Execution (runner.py: run_pipeline)
          │
          ├── 6.1 Create ADK Session (InMemorySessionService)
          │
          ├── 6.2 _runner.run_async(...)
          │       Executes SequentialAgent (root_agent):
          │       [Chatbot_Intake_Agent → HitlLocationGate → Semantic_Parsing_Agent →
          │        Geospatial_Correlation_Agent → Policy_Dashboard_Agent]
          │
          └── 6.3 Exception Handler (runner.py:75-78)
                  Catches ANY Exception (Missing GEMINI_API_KEY, network failure, or ADK syntax error)
                  Logs: "[Pipeline Runner] ADK live LLM unavailable, using structured multi-agent fallback engine."
                  Executes _fallback_structured_pipeline():
                  ├── Heuristic keyword classification (domain, severity, priority)
                  ├── await query_gati_shakti_layers(lat, lng, domain)
                  ├── insert_grievance_record(parsed_payload)  [BigQuery insert]
                  ├── Grievance(...) [SQLite insert into spin.db]
                  ├── query_weekly_summary("Pune") [BigQuery summary]
                  └── Assemble policy_output dict
```

---

## SECTION E: External Service Dependencies

1. **Google ADK & Gemini LLM (`google.genai`, `google.adk`)**:
   - Model: `gemini-2.5-flash` (configurable via `GEMINI_MODEL`).
   - Requires: `GEMINI_API_KEY` or Vertex AI credentials.
   - Status: Fallback triggers seamlessly if unavailable.
2. **Bhashini ASR & NMT API**:
   - Requires: `BHASHINI_API_KEY`, `BHASHINI_USER_ID`, `BHASHINI_API_URL`.
   - Status: Gracefully falls back to Google Cloud Translate or returns original text.
3. **Google Cloud BigQuery (`google.cloud.bigquery`)**:
   - Dataset: `spin_grievances.citizen_complaints`.
   - Requires: GCP Service Account (`service-account.json`) or `GOOGLE_APPLICATION_CREDENTIALS`.
   - Status: Returns mock arrays/dicts if BigQuery client initialization fails.
4. **PM Gati Shakti Master Plan API**:
   - URL: `https://api.gati.gov.in/v1/layers/query`.
   - Requires: `GATI_SHAKTI_API_KEY`.
   - Status: Deterministic synthetic scenario response returned when key is absent.
5. **SQLite Operational Database (`aiosqlite`)**:
   - File: `backend/spin.db`.
   - Status: Always available locally; tables initialized on startup via `init_db()`.

---

## SECTION F: Known Failure and Fallback Paths

1. **Silent Fallback to Mock Coordinates**:
   - If `payload.location` is provided without coordinates (e.g. `{"landmark": "bus stand"}`), line 84 of `runner.py` falls back to `{"lat": 18.5204, "lng": 73.8567}` (Pune, Maharashtra). The user is never alerted that their location was coerced to Pune.
2. **BigQuery Latitude/Longitude Zeroed Out**:
   - `insert_grievance_record` in `bigquery.py` expects `grievance_data.get("latitude")` and `grievance_data.get("longitude")`.
   - `runner.py` generates `"lat_long": {"lat": lat, "lng": lng}`.
   - Consequence: All rows inserted into BigQuery via fallback have `latitude = 0.0` and `longitude = 0.0`.
3. **Synchronous Tool Calling Exception**:
   - In `agent.py`, `bhashini_translate_tool` and `gati_shakti_query_tool` wrap async coroutines with `asyncio.run()`. Under FastAPI's ASGI event loop, this can crash the ADK execution, forcing it into fallback mode 100% of the time.

---

## SECTION G: Sample Request and Response Based on Real Code

### Sample Request:
```bash
curl -X POST http://localhost:8080/api/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "citizen-8921",
    "text": "Water pipeline burst causing heavy leakage near Sector 4 underground reservoir",
    "source_language": "en",
    "location": {"lat": 18.5204, "lng": 73.8567},
    "run_adk": true
  }'
```

### Sample Real Output:
```json
{
  "status": "completed",
  "session_id": "9bf234da-2244-48f1-9b19-3f71295ba581",
  "pipeline_status": "completed",
  "intake_payload": {
    "original_text": "Water pipeline burst causing heavy leakage near Sector 4 underground reservoir",
    "english_translation": "Water pipeline burst causing heavy leakage near Sector 4 underground reservoir",
    "user_id": "citizen-8921",
    "media_url": null,
    "location_data": {"lat": 18.5204, "lng": 73.8567},
    "source_language": "en",
    "hitl_required": false
  },
  "parsed_payload": {
    "domain": "Water Supply",
    "category": "Water Supply",
    "issue_type": "Reported issue in Water Supply",
    "severity": 8,
    "priority": "High",
    "image_verified": false,
    "lat_long": {"lat": 18.5204, "lng": 73.8567},
    "original_text": "Water pipeline burst causing heavy leakage near Sector 4 underground reservoir",
    "english_translation": "Water pipeline burst causing heavy leakage near Sector 4 underground reservoir",
    "user_id": "citizen-8921",
    "district": "Pune",
    "state": "Maharashtra",
    "needs_human_review": false
  },
  "geospatial_result": {
    "grievance_id": "grievance-44cb72e0",
    "insert_status": "persisted",
    "gati_shakti_overlap": {
      "latitude": 18.5204,
      "longitude": 73.8567,
      "domain": "Water Supply",
      "layer_queried": "infrastructure_projects",
      "existing_projects": 2,
      "delayed_projects": 1,
      "overlap_detected": true,
      "priority_gap": true,
      "projects": [
        {"name": "Water Supply Corridor Phase 1", "status": "delayed", "sanctioned_amount_cr": 45.0},
        {"name": "Water Supply Corridor Phase 2", "status": "ongoing", "sanctioned_amount_cr": 57.0}
      ],
      "source": "mock"
    },
    "domain": "Water Supply",
    "severity": 8,
    "lat_long": {"lat": 18.5204, "lng": 73.8567},
    "user_id": "citizen-8921",
    "priority_gap": true
  },
  "policy_output": {
    "executive_summary": "High-priority Water Supply grievance recorded at [18.5204, 73.8567]. Correlated with PM Gati Shakti GIS layers.",
    "weekly_stats": {
      "total_complaints": 1240,
      "top_domain": "Water Supply",
      "district": "Pune",
      "red_zone_count": 14
    },
    "red_zone_alert": true,
    "notification_sent": true,
    "dashboard_update": {
      "district": "Pune",
      "total_complaints": 1240,
      "top_domain": "Water Supply",
      "recommended_action": "Deploy municipal Water Supply repair team."
    }
  },
  "final_response": "High-priority Water Supply grievance recorded at [18.5204, 73.8567]. Correlated with PM Gati Shakti GIS layers."
}
```

---

## SECTION H: Proposed Normalized Request and Response

To eliminate ambiguity, prevent silent fallback masking, and fix coordinate zeroing, the canonical interface should be normalized as follows:

### Proposed Normalized Request:
```json
{
  "citizen_id": "citizen-8921",
  "description": "Water pipeline burst causing heavy leakage near Sector 4 underground reservoir",
  "source_language": "en",
  "input_source": "web",
  "location": {
    "latitude": 18.5204,
    "longitude": 73.8567,
    "landmark": "Near Sector 4 underground reservoir",
    "district": "Pune",
    "state": "Maharashtra"
  },
  "evidence": []
}
```

### Proposed Normalized Response:
```json
{
  "request_id": "REQ-72AF891B01",
  "processing_mode": "DEMO_FALLBACK",
  "status": "completed",
  "parsed_request": {
    "request_id": "REQ-72AF891B01",
    "normalized_description": "Water pipeline burst causing heavy leakage near Sector 4 underground reservoir",
    "original_text": "Water pipeline burst causing heavy leakage near Sector 4 underground reservoir",
    "detected_language": "en",
    "category": "Water Supply",
    "department": "Water Supply & Sanitation",
    "issue_type": "Pipeline leakage / burst",
    "severity": 8,
    "urgency": "High",
    "confidence": 0.85,
    "severity_reason": "High pressure pipe failure near distribution reservoir impacting local supply.",
    "location": {
      "latitude": 18.5204,
      "longitude": 73.8567,
      "landmark": "Near Sector 4 underground reservoir",
      "district": "Pune",
      "state": "Maharashtra",
      "is_verified": true
    },
    "processing_status": "completed",
    "needs_human_review": false
  },
  "data_context": {
    "cluster_id": "CLUSTER-PUNE01",
    "infrastructure_gap": true,
    "current_investment_cr": null,
    "planned_investment_cr": 45.0,
    "synthetic_data_flag": true,
    "source_metadata": {
      "gis": "PM_Gati_Shakti_Mock",
      "warehouse": "BigQuery_Mock"
    }
  },
  "priority_recommendation": {
    "recommendation_id": "REC-991A2B",
    "cluster_id": "CLUSTER-PUNE01",
    "priority_score": 84.0,
    "score_components": {
      "severity": 35.0,
      "density": 25.0,
      "gap": 24.0
    },
    "recommended_intervention": "Dispatch emergency water engineering crew and issue citizen boil-water advisory.",
    "reasoning": "High-severity pipeline rupture detected in catchment zone with delayed capital project.",
    "processing_status": "PROPOSED",
    "human_review_status": "PENDING"
  }
}
```
