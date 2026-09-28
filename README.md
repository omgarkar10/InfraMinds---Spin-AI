# SPIN — Symbiotic Public Infrastructure Network

Multilingual AI grievance platform for [Code for Communities 2](https://hack2skill.com/event/codeforcommunities2/) hackathon.

## Architecture

```
Citizen Edge (WhatsApp/Telegram/Voice)
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│  Root SequentialAgent (ADK)                             │
│  ┌──────────────┐  ┌──────────┐  ┌─────────┐  ┌─────┐ │
│  │ Intake Agent │→ │ HITL Gate│→ │ Parsing │→ │ Geo │→│ Policy │
│  │  + Bhashini  │  │  (GPS)   │  │ + Vision│  │ + BQ│  │ Agent  │
│  └──────────────┘  └──────────┘  └─────────┘  └─────┘  └──────┘
└─────────────────────────────────────────────────────────┘
        │
        ▼
Policymaker Dashboard (React + Google Maps heat layer)
```

## Quick Start & Environment Setup

### 1. Backend Setup (Python Virtual Environment)

The backend uses a single Python virtual environment located at the root directory (`venv/`).

```bash
# 1. Create & Activate Python Virtual Environment at workspace root
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # macOS / Linux

# 2. Install Backend Dependencies
pip install -r backend/requirements.txt

# 3. Configure Backend Environment Variables
# Copy `.env.example` to `backend/.env` and fill in necessary GCP/Bhashini keys
cp .env.example backend/.env

# 4. Run Backend FastAPI Server
backend\start_server.bat
# Or manually: python -m uvicorn spin_agents.api:app --host 0.0.0.0 --port 8080 --reload
```

### 2. Frontend Setup (React / Vite)

The frontend uses Node.js (`npm`) and manages its own package environment inside `frontend/dashboard/`.

```bash
# 1. Navigate to Frontend Directory
cd frontend/dashboard

# 2. Install Node Dependencies
npm install

# 3. Configure Frontend Environment Variables
# Copy `.env.example` to `.env` inside `frontend/dashboard/`
cp .env.example .env

# 4. Start Development Server
npm run dev
```

---

## Environment & Configuration Architecture

| Service | Runtime / Ecosystem | Environment Location | Config File |
| :--- | :--- | :--- | :--- |
| **Backend API** | Python 3.10+ | Root `venv/` | [`backend/.env`](file:///c:/Users/niket/Documents/Hackathon-106/Google-Code-For-Communities-/backend/.env) (Template: [`.env.example`](file:///c:/Users/niket/Documents/Hackathon-106/Google-Code-For-Communities-/.env.example)) |
| **Frontend Dashboard** | Node.js / React / Vite | `frontend/dashboard/node_modules` | [`frontend/dashboard/.env`](file:///c:/Users/niket/Documents/Hackathon-106/Google-Code-For-Communities-/frontend/dashboard/.env) (Template: [`frontend/dashboard/.env.example`](file:///c:/Users/niket/Documents/Hackathon-106/Google-Code-For-Communities-/frontend/dashboard/.env.example)) |

* **Firebase & Google Maps Web SDK Keys**: Configured in `frontend/dashboard/.env` (`VITE_FIREBASE_*`, `VITE_GOOGLE_MAPS_API_KEY`).
* **Firebase Staff Credentials**: Pre-seeded staff demo accounts across 12 government departments are documented in [`credentials.md`](file:///c:/Users/niket/Documents/Hackathon-106/Google-Code-For-Communities-/credentials.md).

---

## Hackathon Alignment

| Requirement | SPIN Implementation |
|---|---|
| End-to-end flow | Citizen webhook → ADK pipeline → dashboard |
| Google AI | Gemini (ADK LlmAgent) + Vertex AI Vision |
| Real/realistic data | BigQuery + mock Gati Shakti fallback |
| Built for India | Bhashini 22-language ASR/translation |
| Multilingual/voice | Bhashini ASR + citizen voice UI |

## Deploy (Cloud Run A2A)

```bash
export GOOGLE_CLOUD_PROJECT=your-project
bash deploy/cloud-run.sh
```

Set `SPIN_USE_REMOTE_AGENTS=true` to switch root agent to distributed `RemoteA2aAgent` topology.
