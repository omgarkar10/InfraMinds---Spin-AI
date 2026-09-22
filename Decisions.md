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

## D08: Day 1 M1 — Canonical Schemas, Pipeline Trace, and Security Audit
- **Why**: Day 1 M1 work establishes backend architectural contracts to prevent schema drift across 5 engineering workstreams. The BigQuery location mismatch (`lat_long: {lat, lng}` vs expected `latitude`/`longitude`) was silently zeroing all geospatial coordinates to (0.0, 0.0) in the warehouse. Six Pydantic V2 schemas establish canonical contracts for the full citizen→policy pipeline.
- **Implementation**: Created [`schemas.py`](file:///c:/Users/Skmaa/Google-Code-For-Communities-/backend/spin_agents/schemas.py) with `CitizenRequest`, `ParsedRequest`, `CommunityCluster`, `DataContext`, `PriorityRecommendation`, `PolicyAction`, and shared `Location` sub-model. Tests created at [`test_canonical_schemas.py`](file:///c:/Users/Skmaa/Google-Code-For-Communities-/backend/test_canonical_schemas.py). 7 Day 1 documentation files created under `docs/day1/`. 4 CRITICAL security issues identified in auth (password reset, unauthenticated policy-action endpoint, hardcoded JWT secret, duplicate auto-create auth route). All require Day 2 remediation.

## D07: Fix White Screen Uncaught Exception & Explicit Type Annotations Labeling
- **Why**: Transitioned citizen login from demo/mock OTP to standard password-based credential authentication against the backend `/auth/citizen-login` endpoint.
- **Outcome**: Removed prototype/demo disclaimers from citizen & staff login screens and updated homepage system impact metrics with real data provenance labels (e.g. CPGRAMS data).

## D06: Hierarchical Geographic Filtering, Budget Model Alignment, and Ministry Sign-Off Workflow
- **Why**: Policymakers need state-to-district cascade navigation across all 36 Indian States/UTs, fiscal reallocation options matching all 9 civic infrastructure grievance categories, and a formal inter-ministerial approval trail.
- **Implementation**: Created [`indiaGeoData.ts`](file:///c:/Users/Skmaa/Google-Code-For-Communities-/frontend/dashboard/src/data/indiaGeoData.ts), expanded [`BudgetReallocationPanel.tsx`](file:///c:/Users/Skmaa/Google-Code-For-Communities-/frontend/dashboard/src/components/BudgetReallocationPanel.tsx) with per-category recommended amounts and quick-apply actions, built [`ApprovalPortal.tsx`](file:///c:/Users/Skmaa/Google-Code-For-Communities-/frontend/dashboard/src/components/approval/ApprovalPortal.tsx) and [`MinistryReviewPortal.tsx`](file:///c:/Users/Skmaa/Google-Code-For-Communities-/frontend/dashboard/src/components/ministry/MinistryReviewPortal.tsx) with direct links on the homepage navbar and footer.

## D09: Day 1 M1 Final Schema Corrections & Unresolved Contract Policies
- **Why**: Address misleading defaults and missing validation constraints identified during independent review without modifying running runtime APIs, ADK agents, or frontend components.
- **Implementation**:
  1. **Location**: Enforced coordinate pairing (both latitude and longitude present, or neither), non-finite (NaN/Inf) rejection, preservation of legitimate 0.0 values, and zero coordinate invention.
  2. **CitizenRequest**: Default language set to `"auto"` (removing assumed Hindi default), blank citizen/request identifiers rejected, evidence list capped at 10 items.
  3. **ParsedRequest**: Removed misleading `"hi"` detected-language default (now required), default status set to `"needs_human_review"` (never defaulted to completed), incomplete locations permitted when awaiting location.
  4. **CommunityCluster**: Enforced dominant category membership in `infrastructure_categories`, rejected count/id length mismatches (replacing silent auto-reconciliation), `is_red_zone` defaults to `None` (unclassified).
  5. **DataContext**: Represented unknown data quality and provenance explicitly with `None` (removing assumed 1.0 quality score and false real-data assumption).
  6. **PriorityRecommendation**: Removed hardcoded `gemini-2.5-flash@adk-v2.7` model version default (now defaults to `None`), validated that score component values are non-negative finite numbers.
  7. **PolicyAction**: Preserved pure canonical governance audit model with strictly required reviewer identity and recommendation ID without dummy defaults.
- **Unresolved Contract Decisions (PENDING TEAM APPROVAL)**:
  - *Threshold for Mandatory Human Review*: Whether `confidence < 0.70` should automatically trigger `needs_human_review = True` in Pydantic or remain an agent prompt instruction is **PENDING TEAM APPROVAL**.
  - *Frontend PolicyAction Migration*: Mapping legacy frontend payload (`grievance_id`, `user_id`, `action`, `budget_cr`) to canonical `PolicyAction` (`decision`, `allocated_budget_cr`, `reviewer_id`, `reviewer_role`) via JWT-authenticated middleware adapter is scheduled for **Day 2**.
  - *Route Protection Cutover*: Requiring `Authorization: Bearer <token>` on `/api/dashboard/policy-action` is coordinated for **Day 2** once frontend attaches auth headers.
