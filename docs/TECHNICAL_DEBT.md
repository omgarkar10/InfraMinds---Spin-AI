# Technical Debt & Refactoring Priorities

This document outlines the existing technical debt identified during the Phase 0 forensic audit, which will be addressed in the subsequent refactoring phases.

## 1. Frontend Persistence Anti-Pattern
**Issue**: The frontend currently uses `localStorage` (`grievanceService.ts`, `approvalService.ts`) as the primary data store and source of truth for grievances and application state, pre-seeded with mock data.
**Remediation**: Migrate all grievance and approval persistence to the backend database. `localStorage` should strictly be used for transient session data (JWT tokens).

## 2. Monolithic API Router (`api.py`)
**Issue**: `backend/spin_agents/api.py` is overloaded. It handles webhook ingestion, ADK orchestration, database queries, authentication wiring, and dashboard summaries in a single file.
**Remediation**: Split into modular routers: `routes/webhooks.py`, `routes/dashboard.py`, `routes/grievances.py`.

## 3. Duplicated Pipeline Logic
**Issue**: There is redundant pipeline execution logic split between `runner.py` (which handles fallback simulation) and `api.py` (which also performs some orchestration).
**Remediation**: Consolidate pipeline execution into a dedicated `services/pipeline_service.py` that cleanly abstracts ADK invocation.

## 4. Magic Strings and Typing Gaps
**Issue**: Both frontend and backend rely on hardcoded magic strings for departments, statuses, and severities.
**Remediation**: 
- Backend: Enforce Python `Enum` usage for statuses, departments, and domains.
- Frontend: Ensure rigorous TS union types are used consistently.

## 5. Inconsistent Geospatial Naming
**Issue**: Latitude and longitude are represented inconsistently across the stack (`lat`/`lng` vs `latitude`/`longitude`).
**Remediation**: Standardize on a single coordinate schema contract between frontend and backend.

## 6. Authentication Fragmentation
**Issue**: Frontend auth flows sometimes rely on client-side state flags (`isLoggedIn`) rather than validating the backend JWT. 
**Remediation**: Enforce HTTP interceptors in the frontend to pass JWTs, and secure all backend routes with proper FastAPI dependency injection (`Depends(get_current_user)`).
