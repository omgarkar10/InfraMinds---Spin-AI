# SPIN — Symbiotic Public Infrastructure Network

Multilingual AI Public Demand & Community Needs platform for [Code for Communities 2](https://hack2skill.com/event/codeforcommunities2/) hackathon.

## 🚀 Live Deployment
- **Web App (Citizen & Staff Portals):** [https://niketandoes.me](https://niketandoes.me)
- **Secure Backend API:** `https://api.niketandoes.me/api`

## ✨ Best of the Site
- **Dynamic Civic Stepper & Lifecycle Visualization**: Every community demand is tracked across 7 authoritative backend states, mapping perfectly into a 5-stage UI Civic Stepper for ultimate public transparency.
- **Hierarchical Multi-Tenant RBAC**: Strict role-based isolation mapping from `Platform Admin > State Admin > District Admin > Policymaker > Dept Officer > Field Officer`, ensuring secure, district-scoped data visibility and programmatic credential generation via short-codes.
- **Multilingual Bhashini Voice Demands**: Submit voice-recorded civic infrastructure demands natively in 23 Scheduled Indian Languages directly through the browser.
- **In-Page Evidence Lightbox & Geospatial Heatmaps**: Real-time Leaflet heatmaps integrated directly into the Policy Dashboard alongside an immersive evidence lightbox for inspecting geotagged field surveys with soft-EXIF validation.
- **Automated AI Policy Briefs**: Vertex AI analyzes the highest-voted community demands to auto-generate intelligence briefs and stage them in the Executive Queue for rapid budget approval and enactment.
- **Frictionless WhatsApp Virality**: Just-In-Time (JIT) citizen voting allows demands to be shared directly via WhatsApp, engaging citizens dynamically.

## New Features
- **Public Demand Measurement Platform**: Evolved from grievance reporting to a proactive community voting and infrastructure request ecosystem.
- **Hierarchical Multi-Tenant RBAC**: Complex role hierarchy (`Platform Admin > State Admin > District Admin > Policymaker > Dept Officer > Field Officer`) ensuring strict district-scoped multi-tenancy.
- **JIT Citizen Voting**: Frictionless voting experience utilizing deep-links and Just-In-Time (JIT) authentication logic.
- **Multilingual Bhashini Integration**: Submit voice demands in 23 Scheduled Indian Languages with native ASR translation capabilities.
- **Robust Role-Based Staff Dashboards**: Dedicated operational workspaces tailored to every RBAC tier with split-screen reviews, dispatch boards, and geospatial heatmaps.
- **Firebase Infrastructure**: End-to-end Firebase Authentication, Firestore NoSQL DB (with composite indexing), and Cloud Storage for performance and scalability.
- **Interactive Geospatial Feed**: Real-time Leaflet heatmap synchronization with live community demands and geotagged field reports.

## Architecture

```
Citizen Edge (WhatsApp/Telegram/Voice/PWA)
        │
        ▼
┌─────────────────────────────────────────────────────────┐
│  Root SequentialAgent (ADK)                             │
│  ┌────────────────────────┐  ┌───────────────────────┐  │
│  │ Semantic_Parsing_Agent │→ │ Dynamic_Verification_ │  │
│  │     + Bhashini         │  │       Agent           │  │
│  └────────────────────────┘  └───────────────────────┘  │
│                                           │             │
│                                           ▼             │
│                                ┌──────────────────────┐ │
│                                │ Policy_Routing_Agent │ │
│                                └──────────────────────┘ │
└─────────────────────────────────────────────────────────┘
        │ (District-Scoped Queue Routing via Firestore)
        ▼
Multi-Tenant Staff Portals (React + Leaflet + Google Maps)
  ├─ Platform/State/District Admins (Provisioning & Health)
  ├─ Policymaker Dashboards (Budget Allocation & Trends)
  ├─ Department Officers (Dispatch & Feasibility Review)
  └─ Field Officers (Geotagged PWA Surveys)
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
