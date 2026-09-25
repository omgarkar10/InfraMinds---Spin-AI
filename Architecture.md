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
- **Semantic_Parsing_Agent**: Handles semantic parsing and multimodal ingestion, combining intake and translation.
- **Dynamic_Verification_Agent**: Handles dynamic verification and read-back, acting as the Human-in-the-Loop (HITL) gate.
- **Policy_Routing_Agent**: Handles deterministic routing, geospatial correlation, policy formulation, and citizen reverse notification.

### 3. Policymaker Dashboard (Frontend)
- **Tech Stack**: React + TypeScript.
- **Features**: Visual Google Maps heat layers ("Red Zones"), side-panel executive summaries, and single-click budget reallocation controls.
