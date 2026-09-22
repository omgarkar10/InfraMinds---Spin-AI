# Day 1 — M1 Implementation Summary

**Project:** SPIN (Symbiotic Public Infrastructure Network)  
**Date:** September 22, 2026  
**Role:** M1 — AI & Backend Lead (Maaz)  
**Commit:** `ac289d909032447ca0d219326e5123cb91395a52`  
**Branch:** `Ministry-Feature-and-More`  
**Python:** 3.14.6 | FastAPI 0.141.1 | Pydantic 2.13.4 | google-adk 2.7.1

---

## A. Repository Architecture Summary

SPIN is structured as a monorepo with a Python/FastAPI backend and a React 18 + Vite frontend:

- **Backend Entry Point:** `backend/spin_agents/api.py` (FastAPI app, 265 LOC)
- **AI Orchestration:** `backend/spin_agents/agent.py` (Google ADK 5-stage `SequentialAgent`)
- **Pipeline Runner:** `backend/spin_agents/runner.py` (ADK + deterministic fallback)
- **Auth:** `backend/spin_agents/auth.py` (JWT, bcrypt, 5 routes)
- **Database:** SQLite (`spin.db`) via async SQLAlchemy + BigQuery warehouse via `tools/bigquery.py`
- **External Integrations:** Bhashini (NMT/ASR), PM Gati Shakti (GIS), Vertex AI Vision, Google Cloud BigQuery, Google Cloud Translate

---

## B. Files Inspected

| File | Purpose |
|:---|:---|
| `backend/spin_agents/api.py` | FastAPI routes & pipeline endpoint |
| `backend/spin_agents/agent.py` | ADK agent graph, LlmAgents, HITL gate |
| `backend/spin_agents/runner.py` | ADK runner, offline fallback engine |
| `backend/spin_agents/auth.py` | Auth router, JWT, citizen/staff login |
| `backend/spin_agents/config.py` | Centralized `SpinConfig` dataclass |
| `backend/spin_agents/config_routes.py` | Dynamic country dialing & password policy API |
| `backend/spin_agents/db.py` | Async SQLAlchemy engine |
| `backend/spin_agents/models.py` | ORM: `User`, `Grievance` |
| `backend/spin_agents/tools/bigquery.py` | BigQuery ingestion, analytics queries |
| `backend/spin_agents/tools/bhashini.py` | Bhashini ASR/NMT integration |
| `backend/spin_agents/tools/gati_shakti.py` | PM Gati Shakti GIS correlation |
| `backend/spin_agents/tools/vision.py` | Vertex AI Vision analyzer |
| `backend/test_api_endpoints.py` | Existing REST API verification tests |
| `backend/requirements.txt` | Python dependencies |
| `frontend/dashboard/src/services/authService.ts` | Frontend auth API client |
| `frontend/dashboard/src/services/grievanceService.ts` | Frontend grievance service (localStorage) |
| `frontend/dashboard/src/components/CitizenChat.tsx` | Only frontend caller of `/api/pipeline/run` |
| `frontend/dashboard/src/types/index.ts` | Frontend TypeScript domain types |

---

## C. Files Created (Day 1)

| File | Description |
|:---|:---|
| [`backend/spin_agents/schemas.py`](file:///c:/Users/Skmaa/Google-Code-For-Communities-/backend/spin_agents/schemas.py) | **6 canonical Pydantic V2 schemas** |
| [`backend/test_canonical_schemas.py`](file:///c:/Users/Skmaa/Google-Code-For-Communities-/backend/test_canonical_schemas.py) | **15 schema contract unit tests** |
| [`docs/day1/01-repository-architecture.md`](file:///c:/Users/Skmaa/Google-Code-For-Communities-/docs/day1/01-repository-architecture.md) | Verified architecture analysis |
| [`docs/day1/02-pipeline-trace.md`](file:///c:/Users/Skmaa/Google-Code-For-Communities-/docs/day1/02-pipeline-trace.md) | Full `/api/pipeline/run` trace (Sections A-H) |
| [`docs/day1/03-location-contract.md`](file:///c:/Users/Skmaa/Google-Code-For-Communities-/docs/day1/03-location-contract.md) | Location mismatch verification & fix plan |
| [`docs/day1/04-minimum-adk-architecture.md`](file:///c:/Users/Skmaa/Google-Code-For-Communities-/docs/day1/04-minimum-adk-architecture.md) | Minimum ADK pipeline decision + Mermaid diagram |
| [`docs/day1/05-auth-api-audit.md`](file:///c:/Users/Skmaa/Google-Code-For-Communities-/docs/day1/05-auth-api-audit.md) | Auth & API security audit (5 issues) |
| [`docs/day1/06-api-contract.md`](file:///c:/Users/Skmaa/Google-Code-For-Communities-/docs/day1/06-api-contract.md) | Canonical API contract spec for all 6 schemas |
| [`docs/day1/07-blocker-register.md`](file:///c:/Users/Skmaa/Google-Code-For-Communities-/docs/day1/07-blocker-register.md) | Full blocker register (14 issues) |
| [`docs/day1/README.md`](file:///c:/Users/Skmaa/Google-Code-For-Communities-/docs/day1/README.md) | This summary file |

---

## D. Files Modified (Day 1)

> No existing files were modified. All Day 1 outputs are net-new additions.

---

## E. Six Canonical Schemas & Fields

### 1. `CitizenRequest` (`schemas.py`)
Raw citizen intake before AI processing.
Fields: `request_id`, `citizen_id`, `description` (5–5000 chars, validated), `source_language`, `input_source`, `location: Location | None`, `evidence: list[EvidenceItem]`, `submitted_at`

### 2. `ParsedRequest`
Normalized grievance after semantic parsing and location confirmation.
Fields: `request_id`, `original_text`, `normalized_description`, `detected_language`, `category`, `department`, `issue_type`, `intent`, `severity` (1–10), `urgency` (Low/Medium/High/Critical), `confidence` (0.0–1.0, enforced), `severity_reason`, `location: Location`, `extracted_entities`, `evidence_verified`, `processing_status`, `needs_human_review`

### 3. `CommunityCluster`
Community-level spatial aggregation.
Fields: `cluster_id`, `spatial_unit` (ward/pincode/district/h3_hex/radius_cluster), `center_location: Location`, `request_ids`, `request_count`, `request_density`, `density_unit`, `infrastructure_categories`, `dominant_category`, `affected_population_estimate`, `is_red_zone`

### 4. `DataContext`
External context enrichment for clusters.
Fields: `cluster_id`, `demographic_context`, `infrastructure_condition`, `infrastructure_gap`, `current_investment_cr`, `planned_investment_cr`, `gati_shakti_overlap`, `source_metadata`, `data_quality_score`, `synthetic_data_flag` ← explicit disclosure flag

### 5. `PriorityRecommendation`
Explainable AI-generated recommendation.
Fields: `recommendation_id`, `cluster_id`, `priority_score` (0.0–100.0), `score_components`, `recommended_intervention`, `reasoning`, `supporting_evidence`, `limitations`, `processing_status`, `model_version`, `human_review_status`

### 6. `PolicyAction`
Auditable human-approval record.
Fields: `action_id`, `recommendation_id`, `grievance_id`, `reviewer_id`, `reviewer_role`, `decision` (approved/rejected/reallocated/modified), `selected_interventions`, `allocated_budget_cr`, `notes`, `reviewed_at`

### Shared: `Location` (reusable sub-model)
Fields: `latitude` (None or -90 to +90), `longitude` (None or -180 to +180), `address`, `landmark`, `district`, `state`, `pincode`, `is_verified`  
Critical rule: No (0.0, 0.0) substitution allowed. Unknown location = `None`.

---

## F. Existing `/api/pipeline/run` Contract (VERIFIED)

```
Request:  user_id, text (required), source_language, location: dict|None, media_url, run_adk: bool
Response: status, session_id, intake_payload, parsed_payload, geospatial_result, policy_output, final_response
```

Key findings:
- Translation via Bhashini (with fallback to Google Translate or passthrough)
- HITL Gate returns `awaiting_location` if `location` is None and `run_adk==True`
- ADK pipeline wrapped in `try/except` — ANY exception triggers deterministic fallback silently
- Response does not distinguish `LIVE_AI` from `DEMO_FALLBACK` — presentational problem

---

## G. Proposed Canonical Contract

Request: `CitizenRequest` schema → validates description, location coordinates, and evidence.  
Response: Structured with `processing_mode: LIVE_AI | DEMO_FALLBACK | UNAVAILABLE` and canonical sub-objects `ParsedRequest`, `DataContext`, `PriorityRecommendation`.  
See: [06-api-contract.md](file:///c:/Users/Skmaa/Google-Code-For-Communities-/docs/day1/06-api-contract.md)

---

## H. Minimum ADK Pipeline Decision

For the Hackathon Demo, use `local_pipeline` (`SequentialAgent` monolithic deployment):

1. `Chatbot_Intake_Agent` (LlmAgent + Bhashini) — translate & extract intake
2. `HitlLocationGate` (deterministic Python) — location validation
3. `Semantic_Parsing_Agent` (LlmAgent + Gemini 2.5 Flash + Vision) — classify & score
4. `Geospatial_Correlation_Agent` (LlmAgent + Gati Shakti + BigQuery) — GIS enrichment
5. `Policy_Dashboard_Agent` (LlmAgent + BigQuery summary) — executive recommendation

Keep `other_resolver_agent` and `distributed_pipeline` disconnected for Demo Day.

---

## I. Location Mismatches Found (VERIFIED)

| Mismatch | Producer | Consumer | Impact |
|:---|:---|:---|:---|
| `lat_long: {lat, lng}` vs `latitude, longitude` | `runner.py:113` / `agent.py:188` | `bigquery.py:47-48` | **All BigQuery rows insert lat=0.0, lng=0.0 (Null Island)** |
| Hardcoded Pune fallback | `runner.py:84` | All downstream | All missing-GPS grievances attributed to Pune |
| Frontend `pinCode` (camelCase) | `types/index.ts:89` | Backend `pincode` (snake_case) | Minor cosmetic mismatch |
| `lat`/`lng` (short keys) | Frontend `LocationData` | Backend BigQuery columns `latitude`/`longitude` | Inconsistent naming across all layers |

---

## J. Authentication / API Issues (VERIFIED)

| Issue | Severity | Impact |
|:---|:---|:---|
| `/citizen/reset-password` no OTP verification | CRITICAL | Account takeover possible |
| `/api/dashboard/policy-action` unauthenticated | CRITICAL | Public policy action without login |
| Hardcoded JWT secret fallback | HIGH | Tokens forgeable offline |
| `/citizen-login` auto-creates accounts on login | HIGH | Database poisoning |
| `/api/grievances` unauthenticated | MEDIUM | Citizen data exposure |

---

## K. Test Commands & Actual Results

### Existing Endpoint Tests (`backend/test_api_endpoints.py`):
```
Command: python -m pytest backend/test_api_endpoints.py -v
Result: 7 PASSED, 2 FAILED (25.70s)
  FAILED: test_staff_department_filtering (404 - route not implemented)
  FAILED: test_staff_grievance_authorization_check (404 - route not implemented)
Classification: BASELINE FAILURE (pre-existing — route never existed in api.py)
```

### Canonical Schema Tests (`backend/test_canonical_schemas.py`):
```
Command: python -m pytest backend/test_canonical_schemas.py -v
Status: BLOCKED in IDE sandbox environment (python command restricted to protected PATH)
Action required: Run manually from terminal:
  cd C:\Users\Skmaa\Google-Code-For-Communities-
  python -m pytest backend/test_canonical_schemas.py -v
Expected: 15 PASSED
```

---

## L. Outstanding Blockers (Day 2 Priority)

| Blocker | Severity | Action |
|:---|:---|:---|
| B-01: Password reset vulnerability | CRITICAL | Implement OTP/token verification |
| B-02: Policy-action endpoint unprotected | CRITICAL | Add JWT role authentication |
| B-03: BigQuery lat/lng mismatch → `(0.0, 0.0)` | CRITICAL | Fix `insert_grievance_record` adapter |
| B-04: `asyncio.run()` inside ASGI event loop | HIGH | Replace with event-loop-safe pattern |
| B-05: Hardcoded JWT fallback secret | HIGH | Startup config validation |
| B-06: Duplicate `/citizen-login` auto-creates users | HIGH | Remove duplicate endpoint |

Full register: [07-blocker-register.md](file:///c:/Users/Skmaa/Google-Code-For-Communities-/docs/day1/07-blocker-register.md)

---

## M. Day 2 Implementation Priorities

1. **Fix BigQuery Location Adapter** — Normalize `lat_long: {lat, lng}` → `latitude`/`longitude` in `insert_grievance_record`
2. **Secure Policy-Action Endpoint** — Add `get_current_user` JWT dependency with policymaker role check
3. **Remove Duplicate Auth Route** — Delete `/api/auth/citizen-login` and consolidate to `/citizen/login`
4. **Fix Password Reset Flow** — Add mock OTP token check before password hash replacement
5. **Remove Pune Coordinate Default** — Pass `None` through Location schema for unknown coordinates
6. **Implement Staff Grievances API** — Build `GET /api/staff/grievances` and `GET /api/staff/grievances/{id}` to fix 2 failing baseline tests
7. **Run Schema Tests** — Execute `python -m pytest backend/test_canonical_schemas.py -v` in terminal

---

## N. Decisions Requiring Team Approval

| DQ | Question | Target Day |
|:---|:---|:---|
| DQ-01 | Should `RaiseGrievanceForm.tsx` POST to the real backend or keep localStorage for offline citizen UX? | Day 3 |
| DQ-02 | Should password reset use Twilio OTP or mock "OTP sent" response for demo? | Day 2 |
| DQ-03 | Should `DEMO_FALLBACK` mode be disclosed in the policy dashboard UI or kept transparent? | Day 2 |
| DQ-04 | Should `other_resolver_agent` be reconnected before Demo Day, adding +2s LLM latency? | Day 3 |
