# 01 — Repository Architecture Analysis

**Project:** SPIN (Symbiotic Public Infrastructure Network)  
**Date:** September 22, 2026  
**Auditor / Role:** M1 — AI & Backend Lead  
**Commit Inspected:** `ac289d909032447ca0d219326e5123cb91395a52`  
**Branch:** `Ministry-Feature-and-More`  
**Status:** Clean working tree  
**Environment:** Python 3.14.6, FastAPI 0.141.1, Pydantic 2.13.4, google-adk 2.7.1, SQLAlchemy 2.0.52  

---

## 1. Executive Summary

SPIN is designed to ingest multimodal citizen civic grievances (text, voice audio, image attachments across 22 Indian languages), process them through an AI multi-agent orchestration pipeline powered by Google ADK and Gemini, correlate them with geospatial infrastructure datasets (PM Gati Shakti Master Plan and Google Cloud BigQuery), and present explainable planning insights to municipal authorities and ministry officials.

This document records the actual verified repository structure, entry points, component boundaries, and architectural findings on Day 1.

---

## 2. Actual Repository Structure

```
Google-Code-For-Communities-/
├── Architecture.md                  # High-level system architecture overview
├── Constraints.md                   # Repository operational constraints
├── Decisions.md                     # Architectural decision log (D01-D07)
├── Flow.md                          # Dataflow mapping between modules
├── Handover.md                      # Continuous engineering handover record
├── Rollback.md                      # Safety reversion instructions
├── Test_Checklist.md                # Verification commands and baselines
│
├── backend/                         # FastAPI & Google ADK backend service
│   ├── .env                         # Secrets & GCP environment config (Protected)
│   ├── requirements.txt             # Python dependencies
│   ├── service-account.json         # GCP Service Account key (Protected)
│   ├── spin.db                      # Local SQLite operational database
│   ├── simulate_pipeline.py         # Standalone CLI pipeline simulation runner
│   ├── test_api_endpoints.py        # Automated REST API endpoint verification script
│   ├── test_canonical_schemas.py    # [NEW] Canonical schema contract verification tests
│   ├── translate_service.py         # Google Cloud Translate V2 wrapper service
│   │
│   ├── scripts/
│   │   ├── create_admin.py          # Database seeder for admin & ministry accounts
│   │   ├── evaluate_adk_pipeline.py # Benchmark script for ADK classification quality
│   │   └── generate_mock_data.py    # Seed generator for local mock records
│   │
│   └── spin_agents/                 # Core backend application package
│       ├── __init__.py
│       ├── api.py                   # FastAPI application entry point & webhook routes
│       ├── agent.py                 # Google ADK multi-agent graph & tool definitions
│       ├── runner.py                # ADK Runner orchestrator with offline heuristic fallback
│       ├── auth.py                  # JWT authentication router for citizen & staff
│       ├── config.py                # Centralized SpinConfig dataclass
│       ├── config_routes.py         # Dynamic country dialing & password policy API
│       ├── db.py                    # Async SQLAlchemy engine & session factory
│       ├── models.py                # SQLAlchemy ORM models (User, Grievance)
│       ├── schemas.py               # [NEW] Canonical Pydantic V2 domain schemas
│       ├── cache.py                 # Simple in-memory response caching utility
│       └── tools/                   # External service & tool integration package
│           ├── __init__.py
│           ├── bhashini.py          # Bhashini ASR & NMT API integration
│           ├── bigquery.py          # BigQuery data warehouse ingestion & analytics queries
│           ├── gati_shakti.py       # PM Gati Shakti GIS layer correlation
│           └── vision.py            # Vertex AI Vision infrastructure damage analyzer
│
└── frontend/dashboard/              # React 18 + Vite + TypeScript dashboard application
    ├── src/
    │   ├── App.tsx                  # Root application router & view switcher
    │   ├── components/
    │   │   ├── CitizenChat.tsx      # WhatsApp-style citizen conversational intake UI
    │   │   ├── HeatMap.tsx          # Interactive MapLibre GL civic grievance heatmap
    │   │   ├── PolicyDashboard.tsx  # Policymaker executive analytics portal
    │   │   ├── BudgetReallocationPanel.tsx # Fiscal reallocation interface
    │   │   ├── citizen/             # Citizen portal components (forms, login, tracking)
    │   │   ├── staff/               # Department staff grievance resolution dashboard
    │   │   ├── ministry/            # Inter-ministerial review & budget sign-off portal
    │   │   └── approval/            # Formal digital approval chain interface
    │   ├── services/
    │   │   ├── api.ts               # Core Axios HTTP client
    │   │   ├── authService.ts       # Auth API client (login, signup, reset, staff tokens)
    │   │   ├── grievanceService.ts  # Grievance CRUD (currently reads/writes localStorage)
    │   │   └── approvalService.ts   # Inter-departmental approval workflow service
    │   ├── types/
    │   │   └── index.ts             # Domain, UI, and grievance TypeScript interfaces
    │   └── utils/
    │       └── departmentConfig.ts  # Civic department routing tables
```

---

## 3. Verified Component Responsibilities & Entry Points

| Component | Verified Path | Type | Responsibility |
|:---|:---|:---|:---|
| **FastAPI Webhook Server** | `backend/spin_agents/api.py` | [VERIFIED] | Main application entry point (`app = FastAPI(...)`). Exposes `/health`, `/webhook/citizen`, `/api/pipeline/run`, `/api/dashboard/*`, `/api/grievances`. |
| **ADK Multi-Agent Graph** | `backend/spin_agents/agent.py` | [VERIFIED] | Defines `chatbot_intake_agent`, `HitlLocationGate`, `semantic_parsing_agent`, `other_resolver_agent`, `geospatial_correlation_agent`, `policy_dashboard_agent`, and `SequentialAgent` pipelines (`local_pipeline` and `distributed_pipeline`). |
| **Pipeline Runner** | `backend/spin_agents/runner.py` | [VERIFIED] | Wraps `google.adk.runners.Runner`. Manages `InMemorySessionService`. Catches runtime exceptions and executes `_fallback_structured_pipeline` heuristics. |
| **Authentication Engine** | `backend/spin_agents/auth.py` | [VERIFIED] | Registers `/api/auth` routes (`/citizen/signup`, `/citizen/login`, `/citizen/reset-password`, `/staff-login`, and duplicate `/citizen-login`). Issues HS256 JWTs. |
| **Database Access** | `backend/spin_agents/db.py` | [VERIFIED] | Configures asynchronous SQLite engine (`sqlite+aiosqlite:///./spin.db`) using SQLAlchemy 2.0 `AsyncSessionLocal`. |
| **ORM Entities** | `backend/spin_agents/models.py` | [VERIFIED] | Declares `User` table (phone, email, password_hash, role, dept) and `Grievance` table (grievance_id, domain, severity, latitude, longitude, etc.). |
| **Canonical Schemas** | `backend/spin_agents/schemas.py` | [PROPOSED/VERIFIED] | Defines the 6 canonical Pydantic V2 contracts: `CitizenRequest`, `ParsedRequest`, `CommunityCluster`, `DataContext`, `PriorityRecommendation`, `PolicyAction`. |
| **PM Gati Shakti GIS** | `backend/spin_agents/tools/gati_shakti.py` | [VERIFIED] | Queries infrastructure layer overlaps (Water, Road, Power, Rail, Telecom) with mock fallback when API key is missing. |
| **BigQuery Ingestion** | `backend/spin_agents/tools/bigquery.py` | [VERIFIED] | Maps grievance payload to BigQuery table schema (`insert_grievance_record`) and aggregates weekly metrics (`query_weekly_summary`, `query_red_zones`). |
| **Bhashini Multimodal NMT** | `backend/spin_agents/tools/bhashini.py` | [VERIFIED] | Handles Indian language ASR and Neural Machine Translation, delegating to `translate_service.py` when Bhashini credentials are unconfigured. |

---

## 4. Key Architectural Problems Identified

1. **Dual Persistence Split [VERIFIED]**:
   - Web citizen submissions via `RaiseGrievanceForm.tsx` persist directly to browser `localStorage` via `grievanceService.ts`.
   - Citizen chat submissions via `CitizenChat.tsx` post to `/api/pipeline/run`, which persists to BigQuery and local SQLite `spin.db`.
   - Result: Grievances submitted through the web form are completely invisible to the backend analytics and BigQuery data warehouse!

2. **Synchronous Async Loop Nesting [VERIFIED]**:
   - Tools in `backend/spin_agents/agent.py` (`bhashini_translate_tool`, `gati_shakti_query_tool`) call `asyncio.run(...)` inside sync function tool definitions.
   - Calling `asyncio.run()` when the ADK runner or FastAPI is already executing on an active event loop triggers `RuntimeError: This event loop is already running`.

3. **Silent Heuristic Fallback Masking [VERIFIED]**:
   - When ADK / Gemini fails in `runner.py`, `run_pipeline` catches all exceptions and invokes `_fallback_structured_pipeline`.
   - The response status is returned as `"completed"` with no indicator that fallback mock heuristics were used.

4. **Disconnected Agent in Registry [VERIFIED]**:
   - `other_resolver_agent` is instantiated in `agent.py` and exported in `AGENT_REGISTRY`, but is omitted from both `local_pipeline` and `distributed_pipeline` sequential chains.

5. **Missing Staff API Implementation [VERIFIED]**:
   - `test_api_endpoints.py` asserts against `/api/staff/grievances` and `/api/staff/grievances/{id}`, but these routes do not exist in `backend/spin_agents/api.py`, causing baseline test failures (404 Not Found).
