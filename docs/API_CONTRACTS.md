# API Contracts

## Auth Endpoints
- `POST /api/auth/citizen/signup`
- `POST /api/auth/citizen/login`
- `POST /api/auth/citizen/forgot-password`
- `POST /api/auth/citizen/reset-password`
- `POST /api/auth/staff-login`

## Config Endpoints
- `GET /api/config/countries`: Returns supported countries and phone validation rules.
- `GET /api/config/auth`: Returns backend password requirements.

## Grievance / Pipeline Endpoints
- `POST /webhook/citizen`: Ingests citizen reports (text/audio) and triggers the ADK pipeline.
- `POST /api/pipeline/run`: Executes the ADK multi-agent pipeline programmatically.
- `GET /api/staff/grievances`: Returns grievances filtered by staff department (Admin sees all).
- `GET /api/staff/grievances/{id}`: Returns specific grievance details with security authorization checks.

## Dashboard Endpoints
- `GET /api/dashboard/summary`: Returns weekly aggregate statistics (e.g., total complaints, top domain, avg severity).
- `GET /api/dashboard/red-zones`: Returns high-severity geographical clusters for HeatMap rendering.
- `POST /api/dashboard/policy-action`: Approves/rejects/reallocates budget based on a grievance, triggering a citizen notification.

## Health
- `GET /health`: Basic service status check.
