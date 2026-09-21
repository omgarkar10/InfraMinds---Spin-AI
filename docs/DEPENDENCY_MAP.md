# Dependency & Call Graph Map

## Frontend (React/Vite)
- **Entry**: `main.tsx` -> `App.tsx`
- **Routing**: Internal state-based routing (`useState<ViewState>`) instead of React Router.
- **State/Services**:
  - `apiClient.ts`: Centralized HTTP client with automatic token injection.
  - `grievanceService.ts`: Interacts with backend `/api/grievances/` endpoints.
  - `authService.ts`: Interacts with backend `/api/auth/` and `/api/config/` endpoints.
  - `usePolicyData.ts`: Interacts with backend `/api/dashboard/` endpoints.


## Backend (FastAPI)
- **Entry**: `main.py` -> `api.py` (FastAPI Router)
- **Database**:
  - `models.py` (SQLAlchemy ORM models: `User`, `Grievance`)
  - `db.py` (Async engine configuration)
- **Auth**:
  - `auth.py` (JWT generation/validation)
- **Routers**:
  - `grievance_router.py`: Handles webhook and REST pipelines.
  - `dashboard_router.py`: Handles dashboard endpoints.
- **Services**:
  - `grievance_service.py`: Contains SQLite persistence and routing logic.
  - `dashboard_service.py`: Contains policy logic.
- **Agents (ADK)**:
  - `api.py` calls `runner.py` / `agent.py`
  - `agent.py` defines the Sequential Pipeline (`chatbot_intake_agent` -> `hitl_location_gate` -> `semantic_parsing_agent` -> `geospatial_correlation_agent` -> `policy_dashboard_agent`).
- **Tools**:
  - `tools/bhashini.py`: Translation API.
  - `tools/gati_shakti.py`: PM Gati Shakti API for infrastructure correlation.
  - `tools/vision.py`: Vertex AI vision for image processing.
  - `tools/bigquery.py`: Data warehousing inserts and summary queries.
  - `tools/maps.py`: Google Maps API wrappers.

