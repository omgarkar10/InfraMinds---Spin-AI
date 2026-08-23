# SPIN Technical Decisions

This file logs every meaningful architectural decision made while building SPIN.

## D01: Google Agent Development Kit (ADK) over LangChain/LlamaIndex
- **Why**: ADK provides native, enterprise-grade integration with Vertex AI Agent Engine and strictly manages single-parent multi-agent topologies (preventing infinite AI loops).
- **Tradeoff**: Narrower ecosystem compared to LangChain, but vastly more stable for production GovTech deployments.

## D02: Payload Funneling vs. Conversational Context
- **Why**: Passing the full conversation history from the Intake agent to the Database agent wastes massive amounts of tokens. 
- **Solution**: The system enforces "Payload Funneling", where agents communicate *exclusively* via strictly typed JSON metadata dictionaries.

## D03: BigQuery for Warehousing
- **Why**: Handling spatial intersections (PostGIS/Gati Shakti) and massive-scale demographic data across BRICS nations requires a true data warehouse, not a standard relational database like PostgreSQL.

## D04: Bhashini API Integration
- **Why**: To bridge the rural digital divide in India, the system standardizes all edge input (22 Indian languages) into English at the very first step (`Chatbot_Intake_Agent`). This simplifies downstream LLM processing and reduces prompt token usage.

## D05: Citizen Password Authentication & Production Labeling
- **Why**: Transitioned citizen login from demo/mock OTP to standard password-based credential authentication against the backend `/auth/citizen-login` endpoint.
- **Outcome**: Removed prototype/demo disclaimers from citizen & staff login screens and updated homepage system impact metrics with real data provenance labels (e.g. CPGRAMS data).

## D06: Hierarchical Geographic Filtering, Budget Model Alignment, and Ministry Sign-Off Workflow
- **Why**: Policymakers need state-to-district cascade navigation across all 36 Indian States/UTs, fiscal reallocation options matching all 9 civic infrastructure grievance categories, and a formal inter-ministerial approval trail.
- **Implementation**: Created [`indiaGeoData.ts`](file:///c:/Users/Skmaa/Google-Code-For-Communities-/frontend/dashboard/src/data/indiaGeoData.ts), expanded [`BudgetReallocationPanel.tsx`](file:///c:/Users/Skmaa/Google-Code-For-Communities-/frontend/dashboard/src/components/BudgetReallocationPanel.tsx) with per-category recommended amounts and quick-apply actions, built [`ApprovalPortal.tsx`](file:///c:/Users/Skmaa/Google-Code-For-Communities-/frontend/dashboard/src/components/approval/ApprovalPortal.tsx) and [`MinistryReviewPortal.tsx`](file:///c:/Users/Skmaa/Google-Code-For-Communities-/frontend/dashboard/src/components/ministry/MinistryReviewPortal.tsx) with direct links on the homepage navbar and footer.
