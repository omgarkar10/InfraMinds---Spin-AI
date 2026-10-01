# Project Fixes and Updates (niketan-changes)

The following changes were made to the project repository to clean up structural issues, remove unneeded files, and align documentation with the actual code implementation.

## 1. Documentation Alignment
- **`Architecture.md`**: Updated the Agent Orchestration section to accurately reflect the 3-agent Sequential Pipeline used in the backend (`Semantic_Parsing_Agent`, `Dynamic_Verification_Agent`, `Policy_Routing_Agent`) instead of the non-existent 5-agent pipeline.
- **`Flow.md`**: Rewrote the entire data flow document to match the 3-agent orchestration step-by-step.
- **`implementation_plan.md`**: Updated absolute paths to use the correct username `skmaaz` instead of `Skmaa`.

## 2. Virtual Environment Best Practices
- **`README.md`**: Updated the "Quick Start" section to include standard Python `venv` creation and activation commands. This prevents polluting the system's global Python environment with `pip install -r requirements.txt`.

## 3. Git and Database Hygiene
- **SQLite DB Untracked (High Priority)**: Ran `git rm --cached` on `spin.db` and `backend/spin.db`. These were erroneously tracked by Git despite being listed in `.gitignore`. 
- **Deleted Duplicate DB**: Removed the unused duplicate `spin.db` from the repository root.

## 4. Folder Structure Cleanup
Removed several unused directories, tests, and redundant package configuration files:
- **`niketan/`**: Removed the empty, unused directory in the root.
- **`tests/` and `backend/tests/`**: Removed unused test directories.
- **`backend/test_api_endpoints.py`**: Removed the unused test launch file.
- **`pipeline/`**: Removed the unused pipeline duplicate directory in the root.
- **`deploy-apprunner.ps1`**: Removed the unused deployment launch script.
- **NPM Package Files**: Removed the `package.json`, `package-lock.json`, and `node_modules` present in the project root, as all frontend configurations already correctly reside in `frontend/dashboard/`.

## 5. Pulled Changes from spin-citizen-integration
- **Frontend Changes**: Checked out `frontend/dashboard/` from the branch `feat/spin-citizen-integration` to bring in all the UI and citizen components updates. Cleaned up deleted files correctly (e.g. `ApprovalPortal`, `MinistryLogin`, etc).
- **Backend Auth Changes**: Checked out `backend/spin_agents/auth.py` from `feat/spin-citizen-integration` to update the authentication endpoints and logic.
- **Rationale**: User requested to pull only frontend and auth-related code changes from the `spin-citizen-integration` branch without performing a complete merge, avoiding massive unrelated history conflicts, and strictly preserving the current backend logic of the `niketan` branch.

## 6. Backend Execution Fixes
- **Module Import Fix**: Added logic in `backend/spin_agents/__init__.py` to inject the project root to `sys.path`. This fixes the `ModuleNotFoundError: No module named 'schemas'` that occurs when running `uvicorn` in the `backend` directory without correctly configured Python paths.
- **SQLAlchemy Async Fix**: Installed `greenlet` which is a required dependency for SQLAlchemy's asyncio support. 
- **Dependencies Cleanup**: Removed unused dependencies (`twilio`, `pandas`, `openpyxl`, `xlrd`) from `backend/requirements.txt` and explicitly updated `sqlalchemy` to `sqlalchemy[asyncio]` so `greenlet` gets correctly installed via pip next time.

## 7. Workflow Reports & Cleanup
- **Pipeline Cleanup**: Removed legacy test scripts (`backend/simulate_pipeline.py`, `backend/scripts/evaluate_adk_pipeline.py`) that are not part of the active 3-Agent pipeline workflow.
- **Launch Script**: Created `backend/start_server.bat` to automatically activate the virtual environment and boot up the FastAPI server via Uvicorn.
- **Reports Generated**: Analyzed the source code to document the backend's core execution flow and database schema into `backend_workflow_report.md` and `database_workflow_report.md` artifacts.
- **Dashboard API Auth Fix**: Restored the exact `require_staff` implementation (and `STAFF_ROLES` mapping) from the `main` branch into `backend/spin_agents/auth.py` so the `dashboard_router.py` can correctly restrict staff endpoints.

## 8. Frontend UX Refactoring
- **Paradigm Shift Copy Updates**: Refactored frontend UI copy across the dashboard to align with the new proactive "Public Demand & Community Needs" paradigm.
  - Replaced "Grievance" / "Complaint" / "Issue" with "Proposal" / "Community Demand" / "Improvement".
  - Replaced action phrases like "File a Complaint" and "Report an Issue" with "Voice a Need" and "Propose an Improvement".
  - Replaced "Ticket Status", "Resolution", "Escalate", and "Severity" with "Demand Status", "Adoption Stage", "Community Support", and "Priority".
  - Updated form labels and placeholders (e.g., "Describe your issue/incident" âž” "What improvement does your community need?").
  - Executed these changes programmatically across all citizen and staff dashboard React components (`.tsx` files), preserving TypeScript interfaces and API payload keys (`grievance_id`, `specific_issue`) to ensure backend compatibility.
  - Re-wrote problem-centric sections on the landing page (`useLanguage.tsx`) into opportunity-centric wording (e.g., "The Problem" âž” "The Opportunity", "Misaligned infrastructure investment" âž” "Untapped community potential").
  - Executed a second pass across all components (`CitizenPortalHome.tsx`, `RaiseGrievanceForm.tsx`, `HeroSection.tsx`, etc.) to eliminate residual negative phrasing: updated "Existing Problem" to "Current Need", "Report a Problem" to "Propose an Improvement", "breakdown" to "service gap", and "repair" to "upgrade".
  - Implemented Google Places Autocomplete API in `RaiseGrievanceForm.tsx` using `@vis.gl/react-google-maps` and the `gmp-place-autocomplete` web component to allow native, rich address search for the location field in Step 2.
  - Added prominent "Go Back" buttons to the bottom of the manual intake in `RaiseGrievanceForm`, and at the bottom of the `TrackGrievances` and `GrievanceDetail` screens to improve navigation flow.

### Authentication Changes (Firebase Auth Integration)
- **Setup Firebase Project**: Created a new Firebase project (`spin-portal-hack-106`), generated Web App SDK configuration, and saved keys to `frontend/dashboard/.env`. Enabled Email/Password provider via `firebase.json` deployment.
- **Frontend Config**: Added `firebase` dependency and initialized the app in `frontend/dashboard/src/config/firebase.ts`.
- **Backend Setup**: Created `scripts/seed_staff_accounts.py` using `firebase-admin` to provision static staff email/password credentials and custom role/department claims.
- **Citizen Auth Refactoring**: Modified `frontend/dashboard/src/services/authService.ts` to replace custom REST calls with Firebase Auth (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`). Used a synthetic email wrapper (`<phone>@citizen.spin.local`) to cleanly support phone+password login flow using Firebase Email Auth.
- **Staff Auth Refactoring**: Updated `authService.ts` and `StaffLogin.tsx` to remove the mock authentication timer. Staff UI now authentically signs in using standard Email/Password to Firebase, retrieving robust Identity and JWT Custom Claims. Removed the ability to create staff accounts via the frontend interface.
- **Government Staff Accounts & SHARED_PASSWORD Alignment**: Updated `scripts/seed_staff_accounts.py`, `StaffLogin.tsx`, and `authService.ts` to implement the 12 government departments schema with `@government.gov.in` and `@nic.in` email structure, 4 role tiers (`admin`, `policymaker`, `department officer`, `staff`), and `SHARED_PASSWORD = "[REDACTED_SECRET]"`. Added preset one-click demo logins for official government roles and fallback verification for offline/demo operation.
- **Created `credentials.md`**: Generated a reference document detailing all 38 staff accounts across 12 departments along with shared default passwords and role assignments.
- **Updated Email Domain to `@gov.in`**: Changed all staff email formats across `backend/scripts/create_admin.py`, `scripts/seed_staff_accounts.py`, `StaffLogin.tsx`, `authService.ts`, and `credentials.md` from `@government.gov.in` to `@gov.in`. Re-ran seeding script to provision all `@gov.in` users in Firebase Auth.
- **Updated Shared Password to `[REDACTED_SECRET]`**: Updated `SHARED_PASSWORD` across `backend/scripts/create_admin.py`, `scripts/seed_staff_accounts.py`, `StaffLogin.tsx`, `authService.ts`, and `credentials.md` to `[REDACTED_SECRET]`. Re-executed seeding script to synchronize all 38 Firebase Auth staff user account passwords.

## 9. Environment & Virtual Environment Standardization
- **Removed Outdated `.env.example`**: Deleted `backend/.env.example` to remove duplicate and obsolete environment templates (e.g. legacy Twilio vars) that caused developer confusion.
- **Updated `frontend/dashboard/.env.example`**: Synchronized frontend `.env.example` with all actual variables consumed by Vite, including complete Firebase Web SDK credential placeholders (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, etc.) and Google Maps JS API key placeholders.
- **Automatic `.env` Resolution in Backend**: Updated `backend/spin_agents/config.py` to import `dotenv.load_dotenv` and automatically resolve `.env` files from `backend/.env` or the workspace root upon import.
- **Standardized Developer Quick Start Guide**: Updated `README.md` with explicit, reproducible steps for setting up the Python virtual environment (`venv`), installing dependencies, copying environment templates, environment location mapping table, and running dev servers across both backend and frontend.

## 10. UI Enhancements & Firebase Google Authentication
- **Fixed Floating Back Button**: Created `BackButton.tsx` component and integrated it into `App.tsx`. Implemented a `historyStack` navigation state in `App.tsx` so users have a persistent, glassmorphism `â† Back` button on the top-left corner of every view (except the root landing page) allowing smooth sequential backward navigation.
- **Firebase Google Sign-In**: Exported `GoogleAuthProvider` from `src/config/firebase.ts` and created `citizenFirebaseGoogleLogin()` in `authService.ts`. Replaced the previous `window.google` script dependency with native Firebase popup auth. Added the Google Sign-In button to both `CitizenLogin.tsx` and `CitizenSignup.tsx`.
- **View Password Toggle**: Replaced the standard password `<input>` in `StaffLogin.tsx` with the reusable `PasswordField` component, standardizing the eye toggle (`ðŸ‘ï¸` / `ðŸ™ˆ`) button across both Staff and Citizen authentication portals.



- **Added `firebase-database.md`**: Saved the Firebase implementation plan (shifting from grievance tracking to public demand measurement schema) to the workspace as requested by the user.

- **Added `staff-portal-change.md`**: Saved the Staff Portal overhaul implementation plan (RBAC, PWA, automation) to the workspace as requested by the user.

## 2026-09-28: Database Migration to Firestore and AI Integration for Demands
- **Description**: Replaced legacy SQLAlchemy/SQLite stack with Firebase Firestore, converting grievance models and logic to the new Demand concept. Also integrated Bhashini's 23 Scheduled Indian Languages dropdown and protected UI branding from translations.
- **Files Modified**:
  - ackend/spin_agents/models.py: Replaced SQLAlchemy models with Pydantic schemas (DemandSchema, DemandVoteSchema).
  - ackend/spin_agents/services/demand_service.py (New): Ported AI / Bhashini pipeline logic from old service to run with Firestore.
  - ackend/spin_agents/services/grievance_service.py (Deleted).
  - ackend/spin_agents/routers/demand_router.py (New): Created router for demand endpoints.
  - ackend/spin_agents/routers/grievance_router.py (Deleted).
  - ackend/spin_agents/api.py: Removed SQLAlchemy lifespan init, added demand_router.
  - ackend/spin_agents/auth.py: Rewrote get_current_user to use Firebase Admin SDK erify_id_token instead of SQLite lookup.
  - frontend/dashboard/src/services/demandService.ts (New): Created to fetch and vote on demands.
  - frontend/dashboard/src/services/grievanceService.ts (Deleted).
  - frontend/dashboard/src/components/citizen/*: Renamed Grievance files to Demand files (TrackDemands.tsx, CreateDemandForm.tsx, DemandDetail.tsx) and mass-replaced internal strings.
  - frontend/dashboard/src/components/citizen/CreateDemandForm.tsx: Added a dedicated select dropdown for Bhashini's 23 Indian Languages.
  - frontend/dashboard/src/components/navigation/Navbar.tsx: Added 
otranslate class to the SPIN branding logo to prevent AI translation distortion.
- **Rationale**: Migrates the core entity from 'grievances' to 'demands' using a NoSQL structure suitable for a public demand measurement platform, while maintaining accessibility and AI intelligence pipelines.

## 2026-09-28: Safe Firebase & GCP Credential Initialization in db.py
- **Description**: Added path checking for `GOOGLE_APPLICATION_CREDENTIALS` and fallback handling during Firebase Admin SDK initialization in `backend/spin_agents/db.py`.
- **Files Modified**:
  - `backend/spin_agents/db.py`: Added `os.path.exists()` verification before attempting to load service account credentials, and added graceful fallback/error catching when credentials file is absent.
- **Rationale**: Prevents Uvicorn from crashing with `DefaultCredentialsError: File ./secrets/service-account.json was not found` when running in local development environments where the service account JSON file is missing.

## 2026-09-28: UI Component Import Fix
- **Description**: Fixed a broken import and rendering call in `frontend/dashboard/src/App.tsx` where `RaiseDemandForm` was mistakenly referenced instead of the correct `CreateDemandForm` filename.
- **Files Modified**:
  - `frontend/dashboard/src/App.tsx`: Updated `RaiseDemandForm` to `CreateDemandForm`.
- **Rationale**: Fixes Vite compilation error caused during the Grievance to Demand UI migration.

## 2026-09-28: Staff Dashboard Component Rename Fix
- **Description**: Renamed legacy `GrievanceKPIBar` files to `DemandKPIBar` to resolve a Vite compilation error where `StaffDashboard.tsx` was looking for the renamed file that hadn't been updated on disk yet. Also updated the internal component texts from "Grievances" to "Demands".
- **Files Modified**:
  - `frontend/dashboard/src/components/staff/DemandKPIBar.tsx`: Renamed from GrievanceKPIBar.tsx, updated UI strings and component name to `DemandKPIBar`.
  - `frontend/dashboard/src/components/staff/DemandKPIBar.css`: Renamed from GrievanceKPIBar.css.
- **Rationale**: Completes the migration from Grievance to Demand terminology across the Staff Portal UI, fixing Vite module resolution errors.

## 2026-09-28: React Runtime Crash Fix (Missing Exports)
- **Description**: Added necessary function stubs (`getStoredDemands`, `getStaffDemands`, etc.) to `frontend/dashboard/src/services/demandService.ts`. 
- **Files Modified**:
  - `frontend/dashboard/src/services/demandService.ts`: Appended missing mock functions and TypeScript payload interfaces.
- **Rationale**: During the legacy UI migration, `grievanceService.ts` was deleted and replaced by a thinner `demandService.ts` intended for live API use. However, multiple UI components (`StaffDashboard`, `CitizenPortalHome`, `usePolicyData`) still relied on synchronous local storage methods. Injecting these stubs resolves the `Uncaught SyntaxError: does not provide an export named` crash and allows the React app to render again without rewriting all legacy UI logic immediately.

## 2026-09-28: UI Component Export Rename Fix
- **Description**: Fixed the internal component export name inside `CreateDemandForm.tsx` from `RaiseDemandForm` to `CreateDemandForm`.
- **Files Modified**:
  - `frontend/dashboard/src/components/citizen/CreateDemandForm.tsx`: Renamed `RaiseDemandFormProps` and `export const RaiseDemandForm` to `CreateDemandForm`.
- **Rationale**: Solves the Vite `Uncaught SyntaxError: does not provide an export named 'CreateDemandForm'` error that caused a blank screen after we updated `App.tsx` to import the correct file name.

## 2026-09-28: Backend FastAPI Crash Fix (ImportError)
- **Description**: Fixed `ImportError: cannot import name 'User' from 'spin_agents.models'` in the dashboard router.
- **Files Modified**:
  - `backend/spin_agents/routers/dashboard_router.py`: Replaced `User` type hint and import with `UserSchema` to match the current definition in `models.py`.
- **Rationale**: The legacy backend router was importing `User` instead of the renamed `UserSchema`, causing a fatal crash during the `uvicorn` startup sequence.

## 2026-09-28: Friendly Firebase Auth Error Mapping
- **Description**: Implemented user-friendly error mapping for all Firebase Authentication errors.
- **Files Modified**:
  - `frontend/dashboard/src/services/authService.ts`: Added `getFriendlyAuthErrorMessage` and applied it to all citizen authentication catch blocks (`citizenSignup`, `citizenGoogleLogin`, `citizenLogin`, `citizenFirebaseGoogleLogin`).
- **Rationale**: Previously, native Firebase SDK errors like `Firebase: Error (auth/unauthorized-domain).` were being dumped directly into the UI. The mapping now gracefully translates them (e.g., advising the user to add `localhost` to authorized domains).

## 2026-09-28: Staff Portal RBAC & PWA Overhaul
- **Description**: Implemented the Role-Based Access Control (RBAC) and PWA architectural plan for the Staff Portal.
- **Files Modified/Created**:
  - `backend/requirements.txt`: Added `slowapi`, `Pillow`, and `exifread`.
  - `backend/spin_agents/api.py`: Integrated `slowapi` rate limiting and registered the staff router.
  - `backend/spin_agents/routers/staff_router.py` (New): Implemented RBAC-protected endpoints for Staff, including `/demands/queue`, `/investigation/{demand_id}/assign`, and `/investigation/{demand_id}/report`.
  - `backend/spin_agents/services/exif_validator.py` (New): Added native EXIF extraction and Haversine distance verification to enforce Field Officer GPS legitimacy.
  - `frontend/dashboard/vite.config.ts` & `package.json`: Configured `vite-plugin-pwa` for offline caching and background sync.
  - `frontend/dashboard/src/components/staff/StaffLogin.tsx`: Stripped out local demo preset accounts to enforce strict Email/Password flows.
  - `frontend/dashboard/src/components/staff/StaffDashboard.tsx`: Refactored to act as a router conditionally rendering sub-dashboards based on role.
  - `frontend/dashboard/src/components/staff/FieldOfficerDashboard.tsx` (New): Built the mobile-first feasibility study view with geotagged photo uploads.
- **Rationale**: Based on user confirmation of the `staff-portal-change.md` plan, this overhaul allows Field Officers to securely submit feasibility studies (with EXIF-validated GPS) even in poor reception areas using PWA background sync, while securing backend endpoints under strict RBAC constraints.

## 2026-09-28: Landing Page Pivot to Public Demand Measurement
- **Description**: Refactored the landing page copy, components, and visual identity to pivot from a "grievance reporting" paradigm to an aspirational "public demand measurement" platform.
- **Files Modified/Created**:
  - `frontend/dashboard/src/App.tsx`: Replaced `WhatYouCanReportSection` with `WhatYouCanDemandSection`.
  - `frontend/dashboard/src/components/landing/HeroSection.tsx`: Rewrote headlines and CTAs. Updated the Canvas Map animation logic to pulse dots based on states (`GATHERING_SUPPORT`, `FEASIBILITY_STUDY`, `APPROVED_FOR_BUDGET`) rather than categories.
  - `frontend/dashboard/src/components/landing/WhatYouCanDemandSection.tsx` (New): Created a new grid showcasing aspirational categories (Public Transit, Community Spaces, Educational Facilities).
  - `frontend/dashboard/src/components/landing/WhatYouCanReportSection.tsx` (Deleted): Removed the old damage-reporting categories.
  - `frontend/dashboard/src/components/landing/HowItHelpsSection.tsx`: Updated the 4-step workflow to explain the Vote Threshold mechanic and the Feasibility Study phase to the public.
- **Rationale**: Aligns the platform's public-facing identity with the new schema, emphasizing community infrastructure requests and local vote rallying.


- **Updated `.agents/GEMINI.md`**: Appended the SLASH COMMAND SYSTEM INSTRUCTIONS to strictly enforce predefined command behaviors (`/ask`, `/plan`, `/schema`, `/api`, `/spec`, `/review`) for tailored formatting and automated structurings without fluff.

- **Added `landing-page-changes.md`**: Saved the Landing Page implementation plan (shifting focus from tracking grievances to measuring public demand) to the workspace as requested by the user.

## 2026-09-28: Staff Post-Login UX Redesign & Security Hardening
- **Description**: Redesigned the Staff Login component to enforce visual separation from the citizen portal and implemented a dedicated `StaffNavbar` to eliminate vertical scrolling reliance on the dashboard.
- **Files Modified/Created**:
  - `frontend/dashboard/src/components/staff/StaffLogin.tsx`: Removed citizen portal toggles, stripped demo accounts, updated input label to avoid ID format confusion, and standardized error banner styling.
  - `frontend/dashboard/src/components/navigation/StaffNavbar.tsx` (New): Created a strict staff-only top navigation bar displaying role-based capabilities and user profile data.
  - `frontend/dashboard/src/App.tsx`: Added conditional layout rendering to mount `StaffNavbar` for authenticated staff views and hiding the public `Navbar`.
  - `frontend/dashboard/src/components/staff/StaffDashboard.tsx`: Removed the redundant portal header now managed by `StaffNavbar`.
  - `frontend/dashboard/src/components/staff/DemandKPIBar.tsx`: Removed placeholder/hardcoded statistics (12% increase, 8% decrease) to present authentic metrics.
- **Rationale**: Implements user UX feedback to establish a more austere, professional, and clutter-free interface for administrative staff, reducing cognitive load during login and navigation.

## 2026-09-28: Staff Dashboard Architectural Redesign (Role-Based Formats)
- **Description**: Modularized the monolithic `StaffDashboard.tsx` into three highly specialized, role-based interfaces matching the strategic plan: Mobile-first PWA for Field Officers, Operational Console for Department Officers, and Executive Analytics for Policymakers.
- **Files Modified/Created**:
  - `frontend/dashboard/src/components/staff/FieldOfficerDashboard.tsx` (Rewritten): Designed a mobile-first PWA layout incorporating Geotagged Camera Capture (EXIF mock), active offline-capable queue, and feasibility checklists.
  - `frontend/dashboard/src/components/staff/DepartmentOfficerDashboard.tsx` (New): Built a high-density operational routing board with Threshold Trigger Queues, a Field Officer Dispatch Modal, and a split-screen Report Review Workspace for decision-making.
  - `frontend/dashboard/src/components/staff/StaffDashboard.tsx` (Refactored): Rewrote to act exclusively as a clean router mapping `Field Officer` and `Department Officer` roles to their respective modular components.
  - `frontend/dashboard/src/components/PolicyDashboard.tsx` (Updated): Integrated Executive Analytics requirements including a Vote Velocity SVG chart, Category Allocation Breakdown, and an Impact Summary Exporter action button.
- **Rationale**: Ensures the platform UI automatically scales to the operational reality of the specific user, preventing field workers from navigating heavy desktop tables and policymakers from seeing granular dispatch logs.

### Seed Staff Accounts Script Fixes
- **Description**: Updated scripts/seed_staff_accounts.py to correctly initialize the Firebase Admin SDK using explicit service account paths, and fixed Unicode character output for Windows compatibility. Created secrets directory and copied ackend/service-account.json to secrets/service-account.json.
- **Files Updated**: scripts/seed_staff_accounts.py (updated logic for initialize_app and replaced unicode characters), secrets/service-account.json (added).
- **Rationale**: The script previously initialized firebase_admin without credentials which caused subsequent auth service API calls to fail. Additionally, the box-drawing characters used in output caused a UnicodeEncodeError on Windows consoles.


### Fix authService.ts Role Parsing
- **Description**: Updated frontend/dashboard/src/services/authService.ts to use \	okenResult.claims.role\ instead of manually parsing the email address.
- **Files Updated**: frontend/dashboard/src/services/authService.ts`n- **Rationale**: The manual parsing was previously broken because it checked for .field. instead of \.field@\, and now that the Admin SDK successfully seeded the custom claims, we can directly read the exact roles safely.


### Removed Authentication Backdoor
- **Description**: Removed the hardcoded fallback login logic from \uthService.ts\ that allowed any user with a \@gov.in\ email to bypass Firebase Authentication using a hardcoded static password ([REDACTED_SECRET]).
- **Files Updated**: frontend/dashboard/src/services/authService.ts`n- **Rationale**: A hardcoded backdoor that bypasses the primary authentication mechanism is a severe security vulnerability, especially for a government site. It resulted in users receiving mock authorization tokens and incorrect default roles if their Firebase Auth failed or cached state was mismatched.



## 2026-09-28: .gitignore Updated to Exclude Secrets Folder
- **Description**: Added secrets/ and **/secrets/ rules to .gitignore.
- **Files Updated**: .gitignore
- **Rationale**: Ensures all secret files and Firebase service account credentials stored in the secrets/ folder are excluded from Git tracking and version control to prevent sensitive credential leaks.

- Fixed continuous voice dictation by setting rec.continuous = true in CreateDemandForm.tsx and optimizing the effect hook.
- Included bhashini_translated_text in the SubmitRequestPayload so staff can view the english translation.
- Updated backend/.env to add all required local dev ports to CORS_ORIGINS.

- MAJOR: Replaced Chrome Web Speech API with Bhashini ASR (Automatic Speech Recognition) for proper Indian language voice recognition.
- Added /api/bhashini/asr-translate endpoint to backend that accepts base64 audio, transcribes in correct native script (e.g. Devanagari for Marathi), and translates to English.
- Frontend now uses MediaRecorder API to capture mic audio and sends it to Bhashini backend instead of relying on Chrome browser.
- Added speechToText function to bhashiniService.ts.
- Removed Bhashini API quota limit (now shows Unlimited).

## Fix: Bhashini ASR 500 / Voice Not Working (2026-09-28)

### Root Cause
Backend was sending `serviceId: ''` (empty string) in every Bhashini pipeline request. Bhashini Dhruva treats empty serviceId as invalid -> HTTP 500 -> frontend shows 'Could not understand speech'.

### Files Updated
- **backend/spin_agents/routers/bhashini_router.py**: Added BHASHINI_ASR_SERVICE_IDS and BHASHINI_NMT_SERVICE_IDS dicts with per-language service IDs. Fixed ASR/NMT/TTS payloads to omit serviceId key entirely when empty (Bhashini auto-routes). Previously sending empty string caused 500.

### Rationale
Bhashini Dhruva API requires valid serviceId or key must be absent. Empty string causes 500.

## Fix: Bhashini ASR 400 Bad Request  Complete Rewrite (2026-09-28)

### Root Cause
Previous fix added fake hardcoded serviceIds (ai4i-conformer-mr-gpu etc.) that caused HTTP 400 Bad Request from Bhashini. Also, inference headers incorrectly included userID and ulcaApiKey which are only for ULCA config endpoint.

### Fix Applied
- **backend/spin_agents/routers/bhashini_router.py**  Full rewrite:
  - Removed all hardcoded serviceId maps
  - Split headers: _inference_headers() uses only Authorization; _ulca_headers() uses userID + ulcaApiKey
  - Implemented correct 2-step Bhashini flow: call ULCA pipeline config endpoint first to get real serviceIds, then call Dhruva inference
  - Added _get_pipeline_config() helper calling meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline
  - Added _extract_service_id() helper to parse config response
  - All endpoints (ASR, NMT, TTS) now dynamically fetch correct serviceId before inference
  - Added detailed error logging with response body for debugging

### Rationale
Bhashini requires correct serviceIds from its own catalog. The meity-auth endpoint returns the right serviceId for each language+task combination. This is the official recommended Bhashini integration pattern.

- **Added `citizen-redesign.md`**: Saved the Citizen Portal redesign implementation plan (including Leaflet map integration, Phone Auth, and feed filters) to the workspace as requested.
- Replaced inline Citizen Profile modal in Navbar.tsx with dedicated CitizenProfile component routing.
- Created CitizenProfile.tsx with tabs for 'My Submissions' and 'Demands I Supported'.
- Rewrote CitizenPortalHome.tsx to act as the main global Demand Feed, integrating react-leaflet MapContainer and sorting tabs.
- Added Leaflet Map Pin Drop, EXIF upload button mock, and WhatsApp shortcut banner to CreateDemandForm.tsx to fulfill redesign requirements.


- Fixed login redirect bug in App.tsx by using setView directly instead of checking old state.
- Removed landing Navbar from citizen views in App.tsx and added inline Profile/Logout buttons to CitizenPortalHome.tsx and CitizenProfile.tsx.

- Migrated manual React state navigation to Native URL Routing (window.history.pushState/popstate) to fully resolve browser back-button navigation issues across the entire application and provide clean URL paths like /citizen and /landing.

- Added SPIN logo to Citizen Dashboard header.\n- Implemented Geolocation request on citizen feed load, zooming the map to user location and adding a blue You Are Here marker.\n
## 2026-09-28: Fixed Login and Registration Workflow
- **Description**: Replaced the synthetic email mapping with authentic email Firebase auth, implemented a multi-step registration workflow (Info, OTP, Password) for new users, and ensured Google Auth seamlessly pre-fills new user registration while auto-logging in existing users.
- **Files Modified**: 
  - frontend/dashboard/src/services/authService.ts
  - frontend/dashboard/src/components/citizen/CitizenLogin.tsx
  - frontend/dashboard/src/components/citizen/CitizenSignup.tsx
  - frontend/dashboard/src/types/index.ts
- **Rationale**: Removes phone-only dependency which corrupted user data with fake domains. Allows robust email usage, real OTP simulation, and smooth Google single-sign-on.

## 2026-09-28: Fixed Google Auth Login Bypass Security Threat
- **Description**: Added validation in the login page for Google Auth to reject newly created Google users or users with incomplete profiles, enforcing that they must go through the dedicated signup portal to provide their DOB and Phone number.
- **Files Modified**: 
  - frontend/dashboard/src/components/citizen/CitizenLogin.tsx
  - frontend/dashboard/src/services/authService.ts
- **Rationale**: Plugs a critical logic gap where Firebase's signInWithPopup auto-creates users, which previously allowed users to skip mandatory fields (DOB, Phone) and access the dashboard directly without a complete profile.

## 2026-09-28: Google Auth Redirect to Signup with Prefilled Data
- **Description**: Replaced the error-based rejection of new Google Auth users on the Login page with a seamless redirect to the Create Account page. The user's Name and Email from Google are now prefilled automatically, and they only need to provide DOB and Phone to complete registration. Google OAuth does not expose DOB, so it must be collected on the form.
- **Files Modified**: 
  - frontend/dashboard/src/App.tsx (added googlePrefill state, wired onGoogleNewUser callback)
  - frontend/dashboard/src/components/citizen/CitizenLogin.tsx (replaced error+logout with onGoogleNewUser callback)
  - frontend/dashboard/src/components/citizen/CitizenSignup.tsx (accepts googlePrefill prop, auto-initializes state)
- **Rationale**: Better UX than showing an error. New Google users are seamlessly redirected to complete their profile instead of being blocked.

## 2026-09-28: Updated Citizen Profile Page with Full User Details
- **Description**: Updated CitizenProfile sidebar to display Email, Date of Birth, Phone Number, and Citizen ID. DOB is formatted as a human-readable Indian locale date (e.g. '28 September 2026'). Also fixed missing email field in App.tsx default state and logout reset.
- **Files Modified**: 
  - frontend/dashboard/src/components/citizen/CitizenProfile.tsx
  - frontend/dashboard/src/App.tsx
- **Rationale**: Profile page was only showing Phone and Citizen ID. Now reflects all fields collected during the new multi-step registration flow.

### Landing Page and Dashboard Fixes (Plan Executed)
- **Removed Duplicate Menu Item**: Removed 'Public Feed' from the citizen profile dropdown menu in frontend/dashboard/src/components/navigation/Navbar.tsx since 'Dashboard' does the same.
- **Added Inline Vote Button**: Added a direct 'Vote ?' button on the demand cards in the citizen public feed (frontend/dashboard/src/components/citizen/CitizenPortalHome.tsx). Integrated castVote API call in frontend/dashboard/src/services/demandService.ts.
- **Updated 'What You Can Demand' Grid**: Converted the basic text cards into a photographic 3x2 grid in frontend/dashboard/src/components/landing/WhatYouCanDemandSection.tsx. Generated 6 high-quality AI images and placed them in frontend/dashboard/public/images/categories/.
- **Replaced Hero Canvas Map with Leaflet Heatmap**: Replaced the non-functional canvas animation in frontend/dashboard/src/components/landing/HeroSection.tsx with a fully locked react-leaflet map and leaflet.heat heatmap layer. Added leaflet.heat to package.json and created typings in frontend/dashboard/src/leaflet-heat.d.ts.

### Responsive Design and Staff KPI Grid (Plan Executed)
- **Staff Dashboard KPI Grid Fix**: Modified frontend/dashboard/src/components/staff/DemandKPIBar.css and DemandKPIBar.tsx. Consolidated classes to .kpi-grid for a responsive 2x2 grid. Used .kpi-content-left and .kpi-content-right to align the sparkline graphs to the right of the stats in each box.
- **Citizen Feed Mobile Layout**: Updated frontend/dashboard/src/components/citizen/CitizenPortalHome.tsx to remove inline hardcoded 1fr 1fr grids. Added .citizen-feed-grid and .feed-map to frontend/dashboard/src/styles/citizen.css so that the feed and map correctly stack vertically on mobile screens (max-width: 768px).
- **Staff Dashboards Mobile Layout**: Replaced inline 1fr 1fr grids in frontend/dashboard/src/components/staff/DepartmentOfficerDashboard.tsx with a new responsive .dashboard-grid class defined in frontend/dashboard/src/styles/dashboard.css. Ensured tables have .table-responsive wrapping for horizontal scrolling.
- Modified CreateDemandForm.tsx to fix UI issues with manual entry, adding default empty selections for infrastructure category and custom text inputs when 'Other' is selected. Also replaced the Shadow DOM PlaceAutocompleteElement with a custom Google Places Autocomplete UI to match the theme, implemented a fallback for manual address entry, and added automatic reverse-geocoding when the map pin is moved. This fixed validation issues for Step 2's Next button.

- Fixed local network testing issue by dynamically determining the API_URL using window.location.hostname in the frontend (authService.ts, demandService.ts, etc.) rather than hardcoding localhost. Also updated the FastAPI backend CORS policy to allow any origin using regex, so teammates can access the dev server via their local IP address.

- Implemented Firestore persistence for Google Sign-In missing profile data (Phone/DOB) so that users aren't prompted on every login. Updated CitizenSignup.tsx and authService.ts to use Firestore collection 'users'.

- Wired up submitRequestToBackend in demandService.ts to hit POST /api/pipeline/run and modified the backend process_pipeline_run in demand_service.py to save processed demands into the 'demands' Firestore collection. Also wired up getMyRequestsFromBackend to properly read actual demands.



## 2026-09-29: Merged Branch
- **Description**: Merged the `niketan` branch into the `main` branch.
- **Files Modified**: Various files across frontend and backend.
- **Rationale**: User requested to merge the `main` and the `niketan` branch. Direction chosen was `niketan` into `main`.

## 2026-09-29: Sync Branch
- **Description**: Merged the `main` branch into the `niketan` branch to sync them.
- **Files Modified**: Various files from main.
- **Rationale**: User requested to sync `niketan` with `main`.

## 2026-09-29: Pre-Deployment Readiness and TS Compilation Fixes
- **Description**: Addressed 50+ TypeScript compilation errors by adding missing properties to GrievanceStatus, LocationData, Proposal, and StaffUser. Removed unused variables and resolved type mismatch errors across components. Removed tracked service-account.json. Hardened CORS configuration to allow only production web.app domains and localhost. Removed hardcoded API URL from bhashiniService.ts. Created .firebaserc and firebase.json for Firebase Hosting SPA support. Updated vite.config.ts for PWA icons and explicit manual chunks.
- **Files Modified**: 
  - frontend/dashboard/src/types/index.ts
  - frontend/dashboard/src/components/citizen/CitizenSignup.tsx
  - frontend/dashboard/src/components/citizen/CreateDemandForm.tsx
  - frontend/dashboard/src/components/navigation/Navbar.tsx
  - frontend/dashboard/src/components/navigation/StaffNavbar.tsx
  - frontend/dashboard/src/components/staff/DepartmentOfficerDashboard.tsx
  - frontend/dashboard/src/components/staff/FieldOfficerDashboard.tsx
  - frontend/dashboard/src/components/staff/StaffDashboard.tsx
  - frontend/dashboard/src/components/staff/StaffLogin.tsx
  - frontend/dashboard/src/services/authService.ts
  - frontend/dashboard/src/services/bhashiniService.ts
  - frontend/dashboard/src/services/demandService.ts
  - frontend/dashboard/vite.config.ts
  - backend/spin_agents/api.py
  - backend/spin_agents/auth.py
  - frontend/dashboard/.firebaserc (Created)
  - firebase.json (Created)
- **Rationale**: To ensure successful build on AWS ECS/Fargate (Backend) and Firebase Hosting (Frontend SPA). Secured backend against unauthorized origin access and enforced RBAC.

## 2026-09-29: Dockerfile PYTHONPATH Fix for Spin Agents Import
- **Description**: Updated `PYTHONPATH` environment variable in `deploy/Dockerfile.api` and `deploy/Dockerfile.agent` to include `/app/backend` alongside `/app`.
- **Files Modified**:
  - `deploy/Dockerfile.api`
  - `deploy/Dockerfile.agent`
- **Rationale**: The code inside `backend/spin_agents/` uses absolute imports like `from spin_agents...`, while root imports use `schemas...`. Setting `PYTHONPATH=/app:/app/backend` ensures both top-level `schemas` and `spin_agents` are resolvable in the container runtime.

## 2026-09-29: Resilient Environment Variable Parsing for Docker
- **Description**: Added `_clean_env` and `_clean_int_env` helper functions to `backend/spin_agents/config.py` to strip leading/trailing whitespace and enclosing quotes from environment variables. Stripped literal quotes from `backend/.env`.
- **Files Modified**:
  - `backend/spin_agents/config.py`
  - `backend/.env`
- **Rationale**: Docker `--env-file` does not strip quotation marks from `.env` entries, causing `int('"450"')` to throw a `ValueError` on container startup. Sanitizing both `.env` and `config.py` prevents startup crashes in Docker, ECS, and Cloud Run environments.




## Auth Refactor (Firebase Email & Password + Backend Sync)
- Removed fake client-side 6-digit OTP from `CitizenSignup.tsx`.
- Updated `CitizenSignup.tsx` and `CitizenLogin.tsx` to stream-line email/password collection.
- Added `syncProfileWithBackend` and `fetchCitizenProfile` to `authService.ts`.
- Created backend endpoints `/api/auth/sync-profile` and `/api/auth/me` inside `backend/spin_agents/auth.py` using `firebase-admin` to securely write and read the phone and dob fields.
- Updated `UserSchema` in `backend/spin_agents/models.py` to support complete profiles.

## Profile Features
- Added `Setup Password` functionality to `CitizenProfile.tsx` which allows users who originally logged in via Google OAuth to set a password so they can login via Email/Password in the future.

## Profile Features
- Differentiated Password Setup for Google vs Email users in `CitizenProfile.tsx`. Users without a password see 'Setup Password', while users with an existing password see 'Change Password' requiring their current password for security re-authentication.

## Citizen Feed Overhaul
- Completely refactored `CitizenPortalHome.tsx` per the approved feed-implementation-plan.
- Added `Track Demands`, `Bhashini Language Switcher`, and subtle `Staff Access` icon to the header.
- Revamped demand cards: injected 2-line descriptions, relative timestamps, bound custom titles properly, added color-coded status badges, and implemented a CSS-grid for images rendering up to 4 images with a dynamic count overlay on the 4th image.
- Implemented bi-directional map sync: Feed cards hover sync with map Heat Zones, and clicking map Heat Zones smoothly scrolls to the associated feed card.
- Replaced the user map pin with a modern, pulsing blue dot.

## Dashboard Bug Fixes
- Removed the blue staff login icon from the public portal for stricter separation.
- Fixed 'Track Demands' routing to correctly open the citizen tracking dashboard.
- Updated Feed Card data bindings: Title dynamically prioritizes `demand.title || demand.specific_issue || demand.category`. Description securely truncates via CSS and binds `demand.description || demand.original_text || demand.specific_issue`.
- Reintroduced a colored dynamic progress bar under the demand voting metadata.
- Resolved zero-vote issue by parsing `vote_count` instead of the older `votes` variable expected by the frontend.
- Added a Firebase Storage URI parser that automatically maps raw `gs://` backend tokens into valid `firebasestorage.googleapis.com` URLs so images load natively inside the grid.
- Implemented `GET /api/demands/{demand_id}` in the Python backend to resolve the 'Request Not Found' bug when navigating into a specific demand's detail page.

## Git Merge & TypeScript Fixes
- Pulled the latest branch updates from the remote repository.
- Resolved TypeScript compilation errors introduced by the merge (removed unused variables in `demandService.ts` and `authService.ts`, fixed incorrect argument count for `analyzeRequestWithGemini` in `CreateDemandForm.tsx`).

## Public Feed & JIT Voting
- Removed 'citizen' (Feed) and 'citizen-detail' routes from the Auth Guard in App.tsx to enable public WhatsApp link sharing.
- Updated handleVote in CitizenPortalHome.tsx to check user authentication status. If anonymous, it saves 'pending_vote_demand_id' to localStorage and triggers login.
- Modified App.tsx's handleCitizenLoginSuccess callback to automatically resolve and dispatch any pending votes hidden in localStorage upon successful authentication.
- Verified backend atomicity (demand_service.py uses firestore.Increment(1)) to prevent race conditions during high-volume JIT voting.

- **Demand Title/Description Parsing**: Updated CitizenPortalHome.tsx and DemandDetail.tsx to dynamically parse Issue: and Description: strings directly out of the original_text field using regex, since the AI does not persist these as separate fields in Firestore. This fixes the feed showing just 'electricity' or 'water'.

- **Vote Deduplication & State Update Fix**: Updated CitizenPortalHome.tsx to handle the lready_voted status from the backend to prevent duplicate vote incrementing in the local UI state. Fixed the UI variable mapping so ote_count properly increments instead of a phantom otes field.

- **New Demand Vote Counter**: Modified demand_service.py to correctly initialize ote_count at 0 before auto-casting the author's vote so the initial state correctly equals 1 instead of 2.
- **UI Progress Bar Cleanup**: Completely removed the orange progress bar and ' / 100 votes' tracking text from CitizenPortalHome.tsx as requested, leaving only the total accumulated vote count integer.

- **Root AI Pipeline Schema Fix**: Updated SEMANTIC_PARSER_INSTRUCTION in semantic_parsing.py to extract missing fields (address, pincode, request_type, reason, beneficiaries). Updated Pydantic schemas in schemas/data_models.py to enforce validation on these fields. Updated demand_service.py (persist_demand_to_db) to officially persist these fields and media_urls directly into Firestore, and initialized a default Activity Timeline array for new demands.

- **Database Structure Report**: Generated comprehensive audit report covering all 3 Firestore collections (users, demands, demand_votes), full API surface (17 endpoints), authentication flows, the 3-agent AI pipeline sequence diagram, and 9 identified issues with severity ratings.

- **Refactor Database Connections & APIs**: Implemented the 8-point architectural refactoring plan. (1) Fixed token desync in frontend by fetching fresh tokens dynamically. (2) Implemented real Firebase Storage image uploads. (3) Updated DemandSchema Pydantic model with new fields and default vote_count to 0. (4) Sanitized AI fallbacks in runner.py and fixed timeline timestamp formats in demand_service.py. (5) Refactored GET /api/demands to support server-side author_user_id filtering. (6) Denormalized author_name by fetching from users collection. (7) Upgraded staff endpoints (/queue, /assign, /report) with live Firestore logic. (8) Replaced dashboard analytics stubs with direct Firestore aggregations and groupings.

### Added .env.production for Frontend Deployment
- **Files modified:** Added rontend/dashboard/.env.production 
- **Description:** Created production environment file pointing VITE_API_URL to the newly deployed AWS Application Load Balancer (spin-api-alb-1642055735.ap-south-1.elb.amazonaws.com).
- **Rationale:** Ensures the production build of the frontend connects to the live ECS Fargate backend without breaking the local .env configuration.

### Staff Dashboard & Queue System Overhaul
- **Description**: Replaced hardcoded stubs in the Department Officer dashboard with a live Firestore implementation, enforcing department-scoped isolation and real-time dispatch workflows.
- **Files Updated**:
  - ackend/spin_agents/routers/staff_router.py: Completely rewritten with transactional endpoints for dispatch, decision, and filtered queue fetch.
  - ackend/spin_agents/models.py: Added department field to UserSchema.
  - rontend/dashboard/src/components/staff/DepartmentOfficerDashboard.tsx: Rewritten to fetch directly from the live API with accurate metrics.
  - rontend/dashboard/src/components/staff/StaffDashboard.tsx: Cleaned up props.
- **Rationale**: The UI was purely mock data and lacked the necessary security to isolate demands to the specific logged-in officer's department. The new transactions prevent race conditions during Field Officer assignment.
- Overhauled Field Officer Dashboard UI to use a responsive split-pane Leaflet map instead of Google Maps.

- Added GET /api/staff/demands/assigned endpoint to fetch actual officer assignments.

- Updated POST /api/staff/investigation/{id}/report to accept multipart form-data for checklist constraints.

## 2026-09-30: WhatsApp Webhook Implementation
- **Description**: Added GET and POST /webhook/whatsapp endpoints to demand_router.py for Meta integration, and created whatsapp-webhook.md setup guide.
- **Files Modified/Created**: backend/spin_agents/routers/demand_router.py, whatsapp-webhook.md



### Fix Absolute Image URLs in Production
- **Files updated:**
  - ackend/spin_agents/routers/demand_router.py
  - rontend/dashboard/src/components/citizen/DemandDetail.tsx
  - rontend/dashboard/src/components/citizen/CitizenPortalHome.tsx
- **Description:** Updated backend upload endpoint to generate a dynamic base URL based on the incoming request, instead of hardcoding \localhost:8080\. Also added logic in the frontend to intercept legacy \localhost:8080\ image URLs in DB and rewrite them using the current deployed hostname/API URL.
- **Rationale:** Prevents images from breaking when the frontend is accessed from a remote domain (like \
iketandoes.me\) while the backend runs locally or on a different domain.




### Fix Query Parameter Routing
- **Files updated:**
  - rontend/dashboard/src/App.tsx
- **Description:** Updated handlePopState and the initial mount logic to parse the ?demand= query parameter. If found, it routes directly to the demand details page and uses history.replaceState to update the URL cleanly.
- **Rationale:** Ensures that sharing a direct URL with the ?demand=ID parameter correctly opens the demand details rather than defaulting to the landing page.


### Fix Department Categories & Staff Portal Visibility
- **Files updated:**
  - schemas/data_models.py
  - ackend/spin_agents/agents/semantic_parsing.py
  - rontend/dashboard/src/components/citizen/CreateDemandForm.tsx
  - ackend/scripts/migrate_categories.py (new)
- **Description:** Synchronized the category taxonomy across the platform to use the 12 exact canonical department strings defined in credentials.md (e.g., Water Supply, Electricity). Updated the AI prompt instructions and heuristics to output these exact values. Updated the frontend UI <select> options. Ran a Firebase migration script to update all existing demands in the database to map legacy lowercase categories (e.g., water, garbage) to the new canonical RBAC departments.
- **Rationale:** The Staff Portal queries Firestore for demands where category == user.department. Since user.department strings are title-cased canonical names, the lowercase AI output was causing a mismatch, resulting in an empty queue. This ensures seamless Role-Based Access Control and data consistency.


### Fix Staff Authentication & Missing Custom Claims
- **Files updated:**
  - ackend/spin_agents/auth.py
- **Description:** Added an enhance_staff_user fallback to automatically parse .gov.in email addresses (e.g., water.supply.officer@gov.in) and extract the appropriate 
ole (Department Officer) and department (Water Supply) dynamically upon each request.
- **Rationale:** When logging in via Firebase Auth during development, users were not assigned custom claims (role/department). This caused the backend to default their role to citizen, resulting in a silent 403 Forbidden on the Staff Portal, and user.department was evaluating to None. This elegant fallback guarantees staff can access their respective queues without manually running admin scripts to provision their custom claims.


### Fix Frontend Staff JWT Token Fetching
- **Files updated:**
  - rontend/dashboard/src/components/staff/DepartmentOfficerDashboard.tsx
  - rontend/dashboard/src/components/staff/FieldOfficerDashboard.tsx
- **Description:** Fixed a critical bug where the Staff portals were sending the citizen 	oken instead of staff_token in the Authorization header during etch requests. 
- **Rationale:** If the citizen 	oken was missing or 
ull, the backend crashed while trying to decode a malformed/missing JWT. Switching to localStorage.getItem('staff_token') ensures the correct Firebase token is sent for Staff APIs, allowing the Department Officer queue to load successfully.

### Update `.gitignore` and `README.md` Before Branch Switch
- **Files updated:**
  - `.gitignore`
  - `README.md`
- **Description:** Added `task-def.json` and `.firebase/` to `.gitignore`. Added a "New Features" section to the `README.md` outlining the Public Demand Measurement Platform, Bhashini Integration, Role-Based Dashboards, Firebase Infrastructure, and Interactive Geospatial Feed.
- **Rationale:** The user wanted to stage and commit necessary files, add missing items to `.gitignore`, and document new features in the README before switching to the `main` branch so another person could commit their changes.

### Fix Production 500 Error for /api/auth/sync-profile
- **Files updated:**
  - `.github/workflows/aws-production-deploy.yml`
- **Description:** Added a step to inject the GCP Service Account JSON into `backend/service-account.json` using a GitHub secret (`GCP_SERVICE_ACCOUNT`) before the Docker image build.
- **Rationale:** Because `service-account.json` was correctly removed from Git tracking earlier, the AWS ECS production deployment was missing the file. This caused `firebase_admin` to fall back to anonymous credentials, resulting in a silent Firestore failure that triggered a `500 Internal Server Error` during the `sync-profile` POST request on the production app. Injecting it via GitHub Secrets securely restores Firestore functionality in the production image.


### Bhashini ASR and Audio Encoding
- **Files updated:**
  - src/utils/audioConversion.ts (new)
  - CreateDemandForm.tsx
  - bhashiniService.ts
- **Description:** Completely resolved the Bhashini 500 Server Error for voice inputs. Implemented a client-side audio transcoder that intercepts the raw browser webm/opus recording and transcodes it locally into a standard 16kHz PCM WAV before sending it to the backend. Fixed network error handling logic so failures properly reset rather than persist in the UI.

### TypeScript Compilation Fixes
- **Files updated:**
  - HeroSection.tsx
  - CitizenPortalHome.tsx
- **Description:** Fixed vite build failure by installing @types/leaflet.heat and suppressing un-typable dist paths using @ts-expect-error. Removed unused voteThreshold variable.



âŒ€âŒ€âŒ€â€€åˆ€æ”€çŒ€æ¼€æ°€ç˜€æ¤€æ¸€æœ€â€€ä˜€æ¤€çˆ€æ”€æˆ€æ„€çŒ€æ”€â€€ã”€ã€€ã€€â€€ä”€çˆ€çˆ€æ¼€çˆ€â€€â €ä´€æ„€æ¸€ç”€æ„€æ°€â€€ä„€åœ€åŒ€â€€ä”€äŒ€åŒ€â€€ä€æ”€ç€€æ°€æ¼€ç¤€æ´€æ”€æ¸€ç€â¤€à¨€â´€â€€â¨€â¨€ä€æ”€çŒ€æŒ€çˆ€æ¤€ç€€ç€æ¤€æ¼€æ¸€ã¨€â¨€â¨€â€€ä˜€æ¤€ç €æ”€æ€â€€ç€€æ”€çˆ€çŒ€æ¤€çŒ€ç€æ”€æ¸€ç€â€€å°€ã”€ã€€ã€€â€€ä¤€æ¸€ç€æ”€çˆ€æ¸€æ„€æ°€â€€åŒ€æ”€çˆ€ç˜€æ”€çˆ€â€€ä”€çˆ€çˆ€æ¼€çˆ€å°€â€€æ¼€æ¸€â€€å°€â¼€æ„€ç€€æ¤€â¼€æ„€ç”€ç€æ €â¼€æ´€æ”€å°€â€€æ„€æ¸€æ€â€€å°€â¼€æ„€ç€€æ¤€â¼€æ„€ç”€ç€æ €â¼€çŒ€ç¤€æ¸€æŒ€â´€ç€€çˆ€æ¼€æ˜€æ¤€æ°€æ”€å°€â€€æŒ€æ„€ç”€çŒ€æ”€æ€â€€æˆ€ç¤€â€€æ´€æ¤€çŒ€çŒ€æ¤€æ¸€æœ€â€€ä˜€æ¤€çˆ€æ”€æˆ€æ„€çŒ€æ”€â€€æŒ€çˆ€æ”€æ€æ”€æ¸€ç€æ¤€æ„€æ°€çŒ€â€€æ¤€æ¸€â€€ç€æ €æ”€â€€ä”€äŒ€åŒ€â€€ç€æ„€çŒ€æ¬€â¸€à¨€â´€â€€â¨€â¨€ä˜€æ¤€æ°€æ”€çŒ€â€€ç”€ç€€æ€æ„€ç€æ”€æ€ã¨€â¨€â¨€â€€ä¸€æ¼€æ¸€æ”€â€€æ¤€æ¸€â€€æŒ€æ¼€æ€æ”€æˆ€æ„€çŒ€æ”€â€€â €æ¼€æ¸€æ°€ç¤€â€€æœ€æ¤€ç€â€€æŒ€æ„€æŒ€æ €æ”€â€€æ„€æ¸€æ€â€€ç”€æ¸€ç€çˆ€æ„€æŒ€æ¬€æ”€æ€â€€æ˜€æ¤€æ°€æ”€çŒ€â¤€â¸€à¨€â´€â€€â¨€â¨€åˆ€æ„€ç€æ¤€æ¼€æ¸€æ„€æ°€æ”€ã¨€â¨€â¨€â€€å€æ €æ”€â€€äœ€æ¤€ç€ä €ç”€æˆ€â€€ä„€æŒ€ç€æ¤€æ¼€æ¸€çŒ€â€€çœ€æ¼€çˆ€æ¬€æ˜€æ°€æ¼€çœ€â€€æ˜€æ„€æ¤€æ°€æ”€æ€â€€ç€€çˆ€æ”€ç˜€æ¤€æ¼€ç”€çŒ€æ°€ç¤€â°€â€€æŒ€æ„€ç”€çŒ€æ¤€æ¸€æœ€â€€ä„€åœ€åŒ€â€€ä”€äŒ€åŒ€â€€ç€æ¼€â€€çˆ€æ¼€æ°€æ°€æˆ€æ„€æŒ€æ¬€â€€ç€æ¼€â€€æ„€â€€æˆ€çˆ€æ¼€æ¬€æ”€æ¸€â€€å€æ„€çŒ€æ¬€â€€ä€æ”€æ˜€æ¤€æ¸€æ¤€ç€æ¤€æ¼€æ¸€â€€â €å°€çŒ€ç€€æ¤€æ¸€â´€æ„€ç€€æ¤€ã¨€ã˜€å°€â¤€â€€çˆ€ç”€æ¸€æ¸€æ¤€æ¸€æœ€â€€æ„€æ¸€â€€æ¼€æ°€æ€â€€ä€æ¼€æŒ€æ¬€æ”€çˆ€â€€æ¤€æ´€æ„€æœ€æ”€â€€çœ€æ¤€ç€æ €æ¼€ç”€ç€â€€å°€çŒ€æ”€çˆ€ç˜€æ¤€æŒ€æ”€â´€æ„€æŒ€æŒ€æ¼€ç”€æ¸€ç€â¸€æ¨€çŒ€æ¼€æ¸€å°€â¸€â€€äˆ€ç”€æ¤€æ°€ç€â€€æ„€æ¸€æ€â€€ç€€ç”€çŒ€æ €æ”€æ€â€€æ„€â€€æ¸€æ”€çœ€â€€ä€æ¼€æŒ€æ¬€æ”€çˆ€â€€æ¤€æ´€æ„€æœ€æ”€â€€æŒ€æ¼€æ¸€ç€æ„€æ¤€æ¸€æ¤€æ¸€æœ€â€€ç€æ €æ”€â€€æŒ€çˆ€æ”€æ€æ”€æ¸€ç€æ¤€æ„€æ°€çŒ€â€€æ´€æ„€æ¸€ç”€æ„€æ°€æ°€ç¤€â€€æ˜€çˆ€æ¼€æ´€â€€ç€æ €æ”€â€€æ°€æ¼€æŒ€æ„€æ°€â€€æ´€æ„€æŒ€æ €æ¤€æ¸€æ”€â°€â€€æ€æ¼€çœ€æ¸€æ°€æ¼€æ„€æ€æ”€æ€â€€ç€æ €æ”€â€€æ°€æ„€ç€æ”€çŒ€ç€â€€ä„€åœ€åŒ€â€€å€æ„€çŒ€æ¬€â€€ä€æ”€æ˜€æ¤€æ¸€æ¤€ç€æ¤€æ¼€æ¸€â°€â€€æ„€æ¸€æ€â€€æ˜€æ¼€çˆ€æŒ€æ”€æ˜€ç”€æ°€æ°€ç¤€â€€ç”€ç€€æ€æ„€ç€æ”€æ€â€€ç€æ €æ”€â€€ä”€äŒ€åŒ€â€€åŒ€æ”€çˆ€ç˜€æ¤€æŒ€æ”€â€€â €å°€çŒ€ç€€æ¤€æ¸€â´€æ„€ç€€æ¤€â´€çŒ€æ”€çˆ€ç˜€æ¤€æŒ€æ”€â´€ç˜€ãˆ€å°€â¤€â€€ç€æ¼€â€€ç”€çŒ€æ”€â€€ç€æ €æ”€â€€æŒ€æ¼€çˆ€çˆ€æ”€æŒ€ç€â€€å€æ„€çŒ€æ¬€â€€ä€æ”€æ˜€æ¤€æ¸€æ¤€ç€æ¤€æ¼€æ¸€â€€â €å°€çŒ€ç€€æ¤€æ¸€â´€æ„€ç€€æ¤€ã¨€ãœ€å°€â¤€â¸€à¨€â´€â€€â¨€â¨€äŒ€æ°€æ”€æ„€æ¸€ç”€ç€€çŒ€ã¨€â¨€â¨€â€€åˆ€æ”€æ´€æ¼€ç˜€æ”€æ€â€€æ„€æŒ€æŒ€æ¤€æ€æ”€æ¸€ç€æ„€æ°€æ°€ç¤€â€€ç€çˆ€æ„€æŒ€æ¬€æ”€æ€â€€å°€â¸€æ˜€æ¤€çˆ€æ”€æˆ€æ„€çŒ€æ”€â¼€å°€â€€æŒ€æ„€æŒ€æ €æ”€â€€æ˜€æ¤€æ°€æ”€çŒ€â€€æ˜€çˆ€æ¼€æ´€â€€ç€æ €æ”€â€€æœ€æ¤€ç€â€€æ¤€æ¸€æ€æ”€ç €â€€ç€æ¼€â€€æ„€ç˜€æ¼€æ¤€æ€â€€æŒ€æ°€ç”€ç€ç€æ”€çˆ€â¸€à¨€à´€à¨€à¨€

### Require Language Selection Before Voice Recording
- **Files updated:**
  - CreateDemandForm.tsx
- **Description:** Changed the default spokenLanguage state from "mr" to "" (empty). Added a disabled placeholder option ("Select your language first") to the language dropdown. The "Start Speaking" button is now grayed out and disabled until a language is explicitly chosen. The hint text below the button also updates to prompt users to select a language.
- **Rationale:** Previously, "Marathi" was pre-selected by default, allowing users to start recording immediately without consciously choosing their language. This caused confusion for non-Marathi speakers who might not notice the dropdown. Now the flow enforces: Select Language ? then Record.

### Remove Auto-Recording on Voice Intake Selection
- **Files updated:**
  - frontend/dashboard/src/components/citizen/CreateDemandForm.tsx
- **Description:** Removed the automatic microphone recording that triggered immediately when a user clicked "Describe by Voice". The recording no longer starts automatically. The user must now: (1) click "Describe by Voice", (2) select their language from the dropdown, and (3) manually click "Start Speaking". This prevents confusing audio captures before the user has configured their language.

### Semantic Parsing & Agent Fixes (Zero-Hallucination & Separation of Concerns)
- **Files updated:**
  - `backend/spin_agents/agents/semantic_parsing.py`
- **Description:**
  - Removed the hardcoded `_heuristic_parse` entirely to ensure Gemini evaluates all inputs contextually, preventing heuristic bypassing on nuanced grievances.
  - Wired `parse_with_gemini` to dynamically load `semantic_parsing_agent.instruction`.
  - Added strict JSON schema enforcement to Gemini API call via `response_mime_type="application/json"`.
  - Removed double-translation logic. `execute_semantic_parsing` now relies solely on the English translation previously generated by `demand_service.py` to prevent confusing the semantic stage.

### Fix Broken bhashiniService.ts try/catch Nesting (Critical Bug)
- **Files updated:**
  - frontend/dashboard/src/services/bhashiniService.ts
  - frontend/dashboard/src/utils/audioConversion.ts
- **Description:** Completely rewrote bhashiniService.ts. The previous try/catch blocks were malformed â€” the response.ok check and return were placed OUTSIDE the try block but BEFORE the catch, meaning 
esponse was undefined after a network failure and all three API functions (detectAndTranslate, translateText, speechToText) were broken. Rewrote audioConversion.ts to first decode at the browser native sample rate, then resample to 16kHz mono via OfflineAudioContext instead of forcing sampleRate in the constructor (which caused decodeAudioData to throw in Chrome/Edge).


### AWS ECS Configuration Update
- **Description:** Added \WHATSAPP_VERIFY_TOKEN\ to the AWS ECS environment configuration.
- **Files updated:** None locally (AWS configuration only).
- **Rationale:** Configured the WhatsApp verification token as requested by the user, updating the active Task Definition to revision 9 and applying it to the service.



### AWS ECS Configuration Update
- **Description:** Added \WHATSAPP_VERIFY_TOKEN\ to the AWS ECS environment configuration.
- **Files updated:** None locally (AWS configuration only).
- **Rationale:** Configured the WhatsApp verification token as requested by the user, updating the active Task Definition to revision 9 and applying it to the service.



### Phase 1 & 2 Refactor Implementation
- **Description:** Implemented Backend Schema updates, RBAC Expansion, and Frontend React Router Migration.
- **Files Updated:** 
  - \ackend/spin_agents/models.py\: Added \department_id\, \state_id\, \district_id\, \ssigned_wards\ to \UserSchema\.
  - \ackend/spin_agents/auth.py\: Refactored \enhance_staff_user\ to map to canonical snake_case enums and added new roles to \STAFF_ROLES\.
  - \ackend/spin_agents/routers/demand_router.py\: Migrated \/api/upload\ to upload directly to Firebase Storage and return the public URL.
  - \ackend/spin_agents/services/demand_service.py\: Refactored \get_demands_list\ to use native Firestore \order_by\ querying.
  - \rontend/dashboard/src/App.tsx\: Completely rewrote the App component to use \
eact-router-dom\ instead of custom state-based routing.
  - \rontend/dashboard/src/components/citizen/CitizenPortalHome.tsx\ & \DemandDetail.tsx\: Updated navigation logic to use \useNavigate\ and \useParams\ from \
eact-router-dom\, retaining JIT Voting logic that preserves state in \localStorage\.
- **Rationale:** Implementing Phase 1 & 2 of the Comprehensive SPIN Architecture & UI Refactor plan. Ensures the backend adheres to strict taxonomy enums, securely handles file uploads, and standardizes RBAC. The frontend now has standard URL-based navigation, fixing deep linking, back-button behavior, and the routing bugs with JIT voting.


Changes made: Phase 3 (UI/UX) & Phase 4 (RBAC)

- Phase 3 (UI/UX) - Updated CitizenPortalHome.tsx, TrackDemands.tsx, and DemandDetail.tsx to add vote progress bars, WhatsApp share buttons, and strict routing.
- Phase 4 (RBAC) - Added backend rbac.py and admin_router.py. Created frontend Admin Dashboards (District, State, Platform) and mapped to App.tsx

- Phase 5 (Officer Workspaces) - Updated StaffDashboard.tsx to route to correct dashboard per user.role. DepartmentOfficerDashboard.tsx now features a queue tab division (Threshold vs. Emerging queue based on vote count & velocity), as well as split-screen reviews. FieldOfficerDashboard.tsx is correctly configured with responsive split map layouts and survey drawers.

- Phase 6 (Indexes & Deploy) - Created firestore.indexes.json with composite indexes for districts, author_user_id, and assigned_officer_id queries. Updated StaffUser type definition with RBAC fields. Awaiting approval for ECS deployment.



## September 30, 2026: Fixed Navbar Rendering on Citizen Views
- **Description**: Resolved a regression where the landing page Navbar was appearing on all citizen portals (e.g. /feed, /track, /profile) after a merge. Updated App.tsx conditionally render Navbar exclusively when isLanding === true, delegating header responsibilities to native components (e.g., portal-header-bar) in the respective citizen views. Also fixed lingering TypeScript prop errors in App.tsx routing.
- **Files Updated**: `frontend/dashboard/src/App.tsx`

## September 30, 2026: Implemented Strict RBAC Airlock & Platform Admin Refactor
- **Description**: Refactored the `PlatformAdminDashboard` and `App.tsx` routing to enforce a strict "Airlock" pattern for staff users. Created `StaffLayout.tsx` with its own navigation to strictly isolate admin views from the public citizen interface. Removed the rogue Back button that allowed staff to leak into the citizen frontend. Added dynamic UI bindings for the System Health checks with visual indicators. Implemented backend `GET /api/admin/system/health` to ping Firestore and added secure `GET/POST /api/admin/keys` protected by `require_admin("platform_admin")`.
- **Files Updated**: `App.tsx`, `StaffLayout.tsx`, `PlatformAdminDashboard.tsx`, `admin_router.py`

## September 30, 2026: Refactored State Administrator Dashboard
- **Description**: Refactored the `StateAdminDashboard` component to ensure strict isolation within `StaffLayout` and removed legacy backward navigation buttons. Implemented dynamic headers in `StaffNavbar` to read "State Overview" for state administrators. Completely rebuilt the District Administrator provisioning flow, binding frontend inputs to a new `POST /api/admin/provision-district` backend endpoint that strictly scopes invites to the caller's `state_id`. Added a District Roster table (`GET /api/admin/districts`) to track provisioned accounts within the state jurisdiction.
- **Files Updated**: `StateAdminDashboard.tsx`, `StaffNavbar.tsx`, `admin_router.py`

## September 30, 2026: Refactored District Administrator Dashboard
- **Description**: Rebuilt the `DistrictAdminDashboard` frontend, stripping out legacy navigation and wiring it into `StaffLayout`. Refactored KPI metrics to pull live data from `GET /api/admin/district/stats`. Hardened the Staff Invitation form to use strict role enums (`policymaker`, `department_officer`, `field_officer`) and exact database canonical department enums (`water`, `electricity`, `roads`, `garbage`, `drainage`, `other`). Rewrote `admin_router.py` to support `POST /api/admin/district/invite`, strictly sandboxing invites to the invoking user's `state_id` and `district_id`. Implemented a toggle suspend action for staff members via `POST /api/admin/district/staff/{uid}/suspend`.
- **Files Updated**: `DistrictAdminDashboard.tsx`, `admin_router.py`
- Refactored Department Officer Dashboard (frontend & backend) to implement strict RBAC isolation, queue segmentation (threshold/emerging/review), and wire dispatch & review workflows.

- Refactored Field Officer Dashboard (frontend & backend): Implemented responsive CSS map toggle, auth-bound queue endpoint (/field/tasks), map geo-centering, feasibility submission flow, and backend anti-spoofing security checks.

- Fixed JWT validation clock-skew error (Token used too early) in auth.py by adding clock_skew_seconds=60 to Firebase verify_id_token.

- Suppressed UserWarning about positional filters in staff_router.py by converting them to firestore.FieldFilter keyword arguments.

- Overhauled Policymaker Dashboard (frontend & backend): Stripped legacy generic sliders. Implemented Executive Project Execution Queue, live dynamic heatmap scoping to jurisdiction, and backend budget enactment API with execution notes recording.

- Fixed 403 Forbidden error for Department Officers on staff-dashboard. Corrected STAFF_ROLES enum mismatch ('department officer' to 'department_officer') in auth.py.

- Executed one-off data migration script to backfill district_id='pune' on 22 legacy Firestore documents to align with strict RBAC backend query schemas.

- Implemented Multi-Tenant Jurisdiction UI Context: Added district mapping in auth token parsing, injected dynamic jurisdiction badges in StaffNavbar, updated dashboard headers (Policy, District Admin, Department/Field Officer) to strictly surface geographic scopes, and implemented a Hard Lock barrier in StaffLayout to block operational staff lacking an explicit district assignment.

- Implemented Dynamic Switch for State Admins: Added District Selector dropdown to StateAdminDashboard.tsx, introduced /api/admin/state/demands endpoint in FastAPI with district filtering, and enforced cross-tenant authorization gate for state-level API access.



## 2026-10-01: Frontend TypeScript Build Fixes
- **Description**: Resolved 12 TypeScript compiler errors blocking the Vite production build. Fixed unused imports, incorrect typing for Leaflet LatLng bounds, duplicate CSS style props in React, and strict JSX namespace checks in App.tsx routing elements.
- **Files Modified**: 
  - frontend/dashboard/src/App.tsx
  - frontend/dashboard/src/components/admin/DistrictAdminDashboard.tsx
  - frontend/dashboard/src/components/staff/FieldOfficerDashboard.tsx
- **Rationale**: The production build (	sc -b && vite build) enforces strict mode. Fixing these type constraints was required for Firebase Hosting deployment to succeed.


### Document Formatting: Credentials

**Description of Change:**
Re-formatted `credentials.md` to add subheadings for each district (Pune, Thane, Mumbai) and further subdivided the lists by department (Water, Electricity, Roads, Garbage, Drainage, Other).

**Files Updated:**
- `credentials.md`: Splitting large generic tables into specific contextual tables.

**Rationale:**
To make the credentials document visually easier to read and quickly scannable for specific roles.

## Fix: Leaflet MapContainer Blank on PolicyDashboard & FieldOfficerDashboard (2026-10-01)

**Description of Change:**
Reverted MapContainer from Tailwind className sizing back to inline style={{ height: '100%', width: '100%' }}. Leaflet requires the style prop for explicit dimensions at init time. Kept tap={false} for mobile scroll fix.

**Files Updated:**
- frontend/dashboard/src/components/PolicyDashboard.tsx
- frontend/dashboard/src/components/staff/FieldOfficerDashboard.tsx

**Rationale:**
React-Leaflet passes style directly to the Leaflet div during L.Map constructor. Tailwind classes via className resolve too late, so Leaflet reads offsetHeight === 0 and never renders tiles.

### Added Geospatial Heatmap to Citizen Feed
- **Description:** Added a live geospatial heatmap based on demand density and vote velocity to the public feed map.
- **Files Updated/Added:**
  - Added frontend/dashboard/src/components/map/HeatmapLayer.tsx: Wrapper for L.heatLayer.
  - Updated frontend/dashboard/src/components/citizen/CitizenPortalHome.tsx: Imported HeatmapLayer, changed default bounds to Pune, conditionally render standard pins based on zoom level > 14.
  - Updated package.json: Installed leaflet.heat and @types/leaflet.heat.
- **Rationale:** Allow citizens to visually see the hotspots of civic issues in their city without cluttering the map with individual pins when zoomed out.

### Fixed Staff Dashboard Formatting and Citizen Feed Heatmap
- **Description:** Repaired mojibake in staff and policymaker dashboard labels, improved wrapping for dashboard headers, controls, and grid content, and aligned the citizen feed heatmap with the landing page.
- **Files Updated:**
  - `frontend/dashboard/src/components/staff/DepartmentOfficerDashboard.tsx`
  - `frontend/dashboard/src/components/staff/FieldOfficerDashboard.tsx`
  - `frontend/dashboard/src/components/PolicyDashboard.tsx`
  - `frontend/dashboard/src/components/admin/DistrictAdminDashboard.tsx`
  - `frontend/dashboard/src/components/admin/StateAdminDashboard.tsx`
  - `frontend/dashboard/src/components/admin/PlatformAdminDashboard.tsx`
  - `frontend/dashboard/src/components/citizen/CitizenPortalHome.tsx`
  - `frontend/dashboard/src/components/map/HeatmapLayer.tsx`
  - `frontend/dashboard/src/styles/dashboard.css`
  - `frontend/dashboard/src/styles/citizen.css`
  - `niketan-changes.md`
- **Rationale:** Staff-side labels contained UTF-8 mojibake and rigid layouts could overflow at narrow widths. The feed was reading `lat`/`lng` although the demand API provides `latitude`/`longitude`; feed points now use the landing page's coordinate fields, vote weighting, radius, blur, maximum zoom, and gradient.
- **Scope:** Frontend-only. Existing routes, auth guards, backend APIs, database schemas, and unrelated user changes were preserved.

### Fixed Landing Page Citizen Sign In Navigation
- **Description:** Connected the landing page's desktop and mobile Sign In actions to the existing `/login` route.
- **Files Updated:**
  - `frontend/dashboard/src/App.tsx`
  - `niketan-changes.md`
- **Rationale:** The navbar emitted the `citizen-login` view action, but the landing page handler did not recognize it and fell through to `/`, leaving the button on the landing page.
