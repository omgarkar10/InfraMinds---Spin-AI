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

## Quick Start

```bash
# Backend
cp .env.example .env   # fill in GCP + Bhashini keys
cd backend && pip install -r requirements.txt
adk web spin_agents     # ADK dev UI on :8000
uvicorn spin_agents.api:app --port 8080  # REST API

# Frontend
cd frontend/dashboard && npm install && npm run dev
```

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
