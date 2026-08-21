# SPIN Architecture

This document provides a high-level map of the Symbiotic Public Infrastructure Network (SPIN) architecture.

## Overview
SPIN operates as an Agent-to-Agent (A2A) decoupled microservice architecture, allowing the system to scale massively and process multilingual citizen infrastructure grievances. The system is designed strictly via the Google Agent Development Kit (ADK) leveraging Vertex AI.

## Layers

### 1. Citizen Edge
- **Interfaces**: Low-bandwidth messaging apps (WhatsApp, Telegram) and direct voice input.
- **Integration**: Bhashini APIs (ASR & Text Translation for 22 Indian languages).

### 2. Agent Orchestration (ADK)
The system uses a `SequentialAgent` structure managed by a Root Agent to strictly enforce the single-parent rule.
- **Chatbot_Intake_Agent**: Collects initial multimodal telemetry.
- **HitlLocationGate**: Evaluates if the grievance has valid spatial tracking; enforces Human-in-the-Loop if missing.
- **Semantic_Parsing_Agent**: Performs deep Entity Extraction using Vertex AI Vision models and Gemini for classification.
- **Geospatial_Correlation_Agent**: Connects directly to Google BigQuery and PM Gati Shakti APIs for GIS overlapping.
- **Policy_Dashboard_Agent**: Distills data into natural language summaries and reverse-notifies the citizen.

### 3. Policymaker Dashboard (Frontend)
- **Tech Stack**: React + TypeScript.
- **Features**: Visual Google Maps heat layers ("Red Zones"), side-panel executive summaries, and single-click budget reallocation controls.
