# Dependency & Call Graph Map

## Frontend (React/Vite)
- **Entry**: `main.tsx` -> `App.tsx`
- **Routing**: Internal state-based routing (`useState<ViewState>`) instead of React Router.
- **State/Services**:
  - `grievanceService.ts`: Interacts with `localStorage` (seeds mock data, filters by department). Needs migration to REST calls.
  - `authService.ts`: Interacts with backend `/api/auth/` and `/api/config/` endpoints.
  - `approvalService.ts`: Local storage approval tracking.
  - `usePolicyData.ts`: Interacts with backend `/api/dashboard/` endpoints, with fallback to local calculation.

## Backend (FastAPI)
- **Entry**: `main.py` -> `api.py` (FastAPI Router)
- **Database**:
  - `models.py` (SQLAlchemy ORM models: `User`, `Grievance`)
  - `db.py` (Async engine configuration)
- **Auth**:
  - `auth.py` (JWT generation/validation)
- **Agents (ADK)**:
  - `api.py` calls `runner.py` / `agent.py`
  - `agent.py` defines the Sequential Pipeline (`chatbot_intake_agent` -> `hitl_location_gate` -> `semantic_parsing_agent` -> `geospatial_correlation_agent` -> `policy_dashboard_agent`).
- **Tools**:
  - `tools/bhashini.py`: Translation API.
  - `tools/gati_shakti.py`: PM Gati Shakti API for infrastructure correlation.
  - `tools/vision.py`: Vertex AI vision for image processing.
  - `tools/bigquery.py`: Data warehousing inserts and summary queries.
