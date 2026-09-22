# 07 — Blocker Register

**Document:** `docs/day1/07-blocker-register.md`  
**Project:** SPIN — Symbiotic Public Infrastructure Network  
**Date:** September 22, 2026 (Day 1)  
**Severity Key:** CRITICAL → HIGH → MEDIUM → LOW

---

## Blocker & Issue Register

| ID | Severity | Component | Verified Issue | Impact | Owner | Required Action | Target Day | Status |
|:---|:---|:---|:---|:---|:---|:---|:---|:---|
| **B-01** | CRITICAL | `auth.py:167-182` | Password reset endpoint accepts any phone number and resets password without OTP or verified token | Any attacker knowing a citizen phone number can permanently hijack their account | M1 (Maaz) | Implement secure reset token generation and verification before password update | Day 2 | 🔴 OPEN |
| **B-02** | CRITICAL | `api.py:202-213` | `POST /api/dashboard/policy-action` is publicly accessible with no authentication or authorization | Anyone can approve or reject infrastructure projects and trigger Bhashini citizen SMS/WhatsApp notifications | M1 (Maaz) | Add `Depends(get_current_user)` with role check `["admin", "policymaker"]` | Day 2 | 🔴 OPEN |
| **B-03** | CRITICAL | `tools/bigquery.py:47-48` | BigQuery ingestion expects `latitude`/`longitude` at root level; pipeline outputs `lat_long: {lat, lng}` nested dict. All rows insert `(0.0, 0.0)` | Entire BigQuery warehouse has corrupted geospatial data; heatmap and red-zone queries return Null Island clusters instead of Indian cities | M1 (Maaz) | Add canonical location adapter in `insert_grievance_record`; normalize field names | Day 2 | 🔴 OPEN |
| **B-04** | HIGH | `agent.py:64` | `bhashini_translate_tool` and `gati_shakti_query_tool` call `asyncio.run()` inside ADK tool wrappers. When FastAPI's ASGI loop is active, this raises `RuntimeError: This event loop is already running`, crashing the ADK pipeline 100% of the time | ADK pipeline always falls back to deterministic heuristics; Gemini LLM is never reached in practice | M1 (Maaz) | Replace `asyncio.run()` with event loop-compatible wrappers using `asyncio.get_event_loop().run_until_complete()` or use `nest_asyncio` | Day 2 | 🔴 OPEN |
| **B-05** | HIGH | `auth.py:25` | Hardcoded fallback JWT secret `"supersecretkey"` used when `JWT_SECRET` env var is unset | If deployed without `.env`, all JWTs can be forged by anyone knowing the default string | M1 (Maaz) | Raise `RuntimeError` on startup if `JWT_SECRET` is missing or matches known default value | Day 2 | 🔴 OPEN |
| **B-06** | HIGH | `auth.py:235-283` | Duplicate `POST /api/auth/citizen-login` route auto-creates accounts on failed login and overwrites `citizen_login` Python symbol | Undetected silently creates citizen accounts from login mistakes; corrupts user database | M1 (Maaz) | Deprecate and delete `/citizen-login` endpoint; route all callers to `/citizen/login` | Day 2 | 🔴 OPEN |
| **B-07** | HIGH | `runner.py:84` | Missing coordinates silently replaced with hardcoded Pune defaults `(18.5204, 73.8567)` | All grievances from outside Pune with missing GPS appear to originate from Pune; geospatial clustering is incorrect | M1 (Maaz) | Remove Pune default; pass `None` coordinates through canonical `Location` schema | Day 2 | 🔴 OPEN |
| **B-08** | HIGH | `services/grievanceService.ts:9-11` | Citizen grievances submitted via `RaiseGrievanceForm.tsx` persist exclusively to browser `localStorage`. They never reach FastAPI, BigQuery, or the operational SQLite database | Staff portal, analytics dashboards, and BigQuery heatmaps are invisible to web form submissions; only `CitizenChat.tsx` posts to the real backend | M1 + M2 (Cross-team) | Replace `localStorage` persistence with a `POST /api/grievances` backend endpoint | Day 3 | 🔴 OPEN |
| **B-09** | MEDIUM | `api.py:234-263` | `GET /api/grievances` returns all citizen complaint records with no authentication | Any unauthenticated caller can enumerate all stored citizen personal grievances | M1 (Maaz) | Add JWT `get_current_user` dependency with `staff` or `admin` role check | Day 2 | 🔴 OPEN |
| **B-10** | MEDIUM | `agent.py:387-392` | `other_resolver_agent` is registered in `AGENT_REGISTRY` but not included in any `SequentialAgent` pipeline | Second-chance ambiguous complaint re-classification is never triggered; all `Other (Uncategorized)` grievances remain uncategorized | M1 (Maaz) | Design conditional branch in runner: if `parsed_payload.category == "Other"`, invoke `other_resolver_agent` | Day 3 | 🔴 OPEN |
| **B-11** | MEDIUM | `test_api_endpoints.py:128-157` | Two tests assert `GET /api/staff/grievances` returns `200`, but this route does not exist in `api.py`; tests fail with `404 Not Found` | CI/CD verification baseline is broken; 2 of 9 tests fail by default | M1 (Maaz) | Implement `GET /api/staff/grievances` and `GET /api/staff/grievances/{id}` with JWT role-based authorization | Day 2 | 🔴 OPEN |
| **B-12** | MEDIUM | `api.py:30` | `@app.on_event("startup")` is deprecated in FastAPI 0.141.1 | Deprecation warning emitted on every server startup | M1 (Maaz) | Replace with `@asynccontextmanager lifespan` event handler | Day 3 | 🟡 WARN |
| **B-13** | LOW | `agent.py:327, 374` | `SequentialAgent` is deprecated in google-adk 2.7.1 in favor of `Workflow` | Future ADK upgrade will break pipeline orchestration | M1 (Maaz) | Plan migration to `Workflow` class; `SequentialAgent` cannot yet be used as `LlmAgent` sub-agent | Day 4+ | 🟡 WARN |
| **B-14** | LOW | Python sandbox PATH issue | In the Antigravity IDE execution sandbox, `python` command resolves to access-restricted directory. Pytest schema tests could not be auto-executed in sandbox | Test execution blocked in IDE environment only; tests are valid pytest code | M1 (Maaz) | Execute via terminal outside IDE sandbox: `python -m pytest backend/test_canonical_schemas.py -v` | Day 1 (Manual) | 🟡 MANUAL |

---

## Outstanding Decision Queue (Requiring Team Approval)

| Decision ID | Question | Stakeholders | Target Day |
|:---|:---|:---|:---|
| DQ-01 | Should `RaiseGrievanceForm.tsx` POST to the real backend `/api/grievances`, or should localStorage persist for offline-only citizen UX? | M1 + M2 + Frontend Lead | Day 3 |
| DQ-02 | For the hackathon demo, should password reset be mocked (return "OTP sent" without real SMS) or fully implemented with Twilio? | M1 | Day 2 |
| DQ-03 | Should the heuristic `DEMO_FALLBACK` response clearly label itself in the policy dashboard UI, or is it transparent to policymaker for demo storytelling? | All leads | Day 2 |
| DQ-04 | Is `other_resolver_agent` worth reconnecting to the pipeline, accepting the extra LLM round-trip latency, before the final demo? | M1 | Day 3 |
