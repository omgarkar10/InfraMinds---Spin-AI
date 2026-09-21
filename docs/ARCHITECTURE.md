# SPIN Architecture

## Overview
SPIN (Symbiotic Public Infrastructure Network) is an AI-powered infrastructure demand intelligence platform. 

The application is structured into two main tiers:
1. **Frontend (Dashboard)**: React + TypeScript + Vite.
2. **Backend**: FastAPI + Python + Google ADK (Agent Development Kit).

## Agent Topology (Backend)
The backend utilizes Google ADK to orchestrate a multi-agent pipeline for grievance processing:
- **Chatbot_Intake_Agent**: Parses incoming unstructured text/audio from citizens and translates via Bhashini.
- **HITL_Location_Gate**: Pauses the pipeline if precise location data is missing.
- **Semantic_Parsing_Agent**: Extracts the domain, issue type, severity, and confidence from the complaint using Gemini.
- **Geospatial_Correlation_Agent**: Correlates the reported location with PM Gati Shakti layers to identify overlapping public works.
- **Policy_Dashboard_Agent**: Aggregates weekly metrics and identifies "Red Zone" critical infrastructure clusters.

## Data Flow
Citizen -> Webhook / Portal -> Intake -> Semantic Parsing -> Geospatial DB (BigQuery/SQLite) -> Policy Dashboard

## Authentication
- **Citizen Auth**: Phone + Password authentication via backend APIs, dispensing JWT tokens.
- **Staff Auth**: Identifier + Password based authentication, dispensing JWT tokens. Includes role-based access control (Admin, Policymaker, Department Officer).

## External Integrations
- **Google Gemini**: Primary LLM for semantic parsing and entity extraction.
- **Vertex AI Vision**: Image analysis for citizen-uploaded infrastructure damage.
- **Bhashini API**: Multilingual support (22 Indian languages) for translation and ASR.
- **PM Gati Shakti**: GIS layer correlation for national infrastructure projects.
- **Google Maps API**: Frontend geospatial visualization and heatmap rendering.
