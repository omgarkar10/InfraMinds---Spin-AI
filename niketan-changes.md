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
  - Updated form labels and placeholders (e.g., "Describe your issue/incident" ➔ "What improvement does your community need?").
  - Executed these changes programmatically across all citizen and staff dashboard React components (`.tsx` files), preserving TypeScript interfaces and API payload keys (`grievance_id`, `specific_issue`) to ensure backend compatibility.
  - Re-wrote problem-centric sections on the landing page (`useLanguage.tsx`) into opportunity-centric wording (e.g., "The Problem" ➔ "The Opportunity", "Misaligned infrastructure investment" ➔ "Untapped community potential").
  - Executed a second pass across all components (`CitizenPortalHome.tsx`, `RaiseGrievanceForm.tsx`, `HeroSection.tsx`, etc.) to eliminate residual negative phrasing: updated "Existing Problem" to "Current Need", "Report a Problem" to "Propose an Improvement", "breakdown" to "service gap", and "repair" to "upgrade".
  - Implemented Google Places Autocomplete API in `RaiseGrievanceForm.tsx` using `@vis.gl/react-google-maps` and the `gmp-place-autocomplete` web component to allow native, rich address search for the location field in Step 2.
  - Added prominent "Go Back" buttons to the bottom of the manual intake in `RaiseGrievanceForm`, and at the bottom of the `TrackGrievances` and `GrievanceDetail` screens to improve navigation flow.

### Authentication Changes (Firebase Auth Integration)
- **Setup Firebase Project**: Created a new Firebase project (`spin-portal-hack-106`), generated Web App SDK configuration, and saved keys to `frontend/dashboard/.env`. Enabled Email/Password provider via `firebase.json` deployment.
- **Frontend Config**: Added `firebase` dependency and initialized the app in `frontend/dashboard/src/config/firebase.ts`.
- **Backend Setup**: Created `scripts/seed_staff_accounts.py` using `firebase-admin` to provision static staff email/password credentials and custom role/department claims.
- **Citizen Auth Refactoring**: Modified `frontend/dashboard/src/services/authService.ts` to replace custom REST calls with Firebase Auth (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`). Used a synthetic email wrapper (`<phone>@citizen.spin.local`) to cleanly support phone+password login flow using Firebase Email Auth.
- **Staff Auth Refactoring**: Updated `authService.ts` and `StaffLogin.tsx` to remove the mock authentication timer. Staff UI now authentically signs in using standard Email/Password to Firebase, retrieving robust Identity and JWT Custom Claims. Removed the ability to create staff accounts via the frontend interface.
- **Government Staff Accounts & SHARED_PASSWORD Alignment**: Updated `scripts/seed_staff_accounts.py`, `StaffLogin.tsx`, and `authService.ts` to implement the 12 government departments schema with `@government.gov.in` and `@nic.in` email structure, 4 role tiers (`admin`, `policymaker`, `department officer`, `staff`), and `SHARED_PASSWORD = "SecureSPIN2026!"`. Added preset one-click demo logins for official government roles and fallback verification for offline/demo operation.
- **Created `credentials.md`**: Generated a reference document detailing all 38 staff accounts across 12 departments along with shared default passwords and role assignments.
- **Updated Email Domain to `@gov.in`**: Changed all staff email formats across `backend/scripts/create_admin.py`, `scripts/seed_staff_accounts.py`, `StaffLogin.tsx`, `authService.ts`, and `credentials.md` from `@government.gov.in` to `@gov.in`. Re-ran seeding script to provision all `@gov.in` users in Firebase Auth.
- **Updated Shared Password to `securespin26`**: Updated `SHARED_PASSWORD` across `backend/scripts/create_admin.py`, `scripts/seed_staff_accounts.py`, `StaffLogin.tsx`, `authService.ts`, and `credentials.md` to `securespin26`. Re-executed seeding script to synchronize all 38 Firebase Auth staff user account passwords.

## 9. Environment & Virtual Environment Standardization
- **Removed Outdated `.env.example`**: Deleted `backend/.env.example` to remove duplicate and obsolete environment templates (e.g. legacy Twilio vars) that caused developer confusion.
- **Updated `frontend/dashboard/.env.example`**: Synchronized frontend `.env.example` with all actual variables consumed by Vite, including complete Firebase Web SDK credential placeholders (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, etc.) and Google Maps JS API key placeholders.
- **Automatic `.env` Resolution in Backend**: Updated `backend/spin_agents/config.py` to import `dotenv.load_dotenv` and automatically resolve `.env` files from `backend/.env` or the workspace root upon import.
- **Standardized Developer Quick Start Guide**: Updated `README.md` with explicit, reproducible steps for setting up the Python virtual environment (`venv`), installing dependencies, copying environment templates, environment location mapping table, and running dev servers across both backend and frontend.

## 10. UI Enhancements & Firebase Google Authentication
- **Fixed Floating Back Button**: Created `BackButton.tsx` component and integrated it into `App.tsx`. Implemented a `historyStack` navigation state in `App.tsx` so users have a persistent, glassmorphism `← Back` button on the top-left corner of every view (except the root landing page) allowing smooth sequential backward navigation.
- **Firebase Google Sign-In**: Exported `GoogleAuthProvider` from `src/config/firebase.ts` and created `citizenFirebaseGoogleLogin()` in `authService.ts`. Replaced the previous `window.google` script dependency with native Firebase popup auth. Added the Google Sign-In button to both `CitizenLogin.tsx` and `CitizenSignup.tsx`.
- **View Password Toggle**: Replaced the standard password `<input>` in `StaffLogin.tsx` with the reusable `PasswordField` component, standardizing the eye toggle (`👁️` / `🙈`) button across both Staff and Citizen authentication portals.



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
  - rontend/dashboard/src/services/demandService.ts (New): Created to fetch and vote on demands.
  - rontend/dashboard/src/services/grievanceService.ts (Deleted).
  - rontend/dashboard/src/components/citizen/*: Renamed Grievance files to Demand files (TrackDemands.tsx, CreateDemandForm.tsx, DemandDetail.tsx) and mass-replaced internal strings.
  - rontend/dashboard/src/components/citizen/CreateDemandForm.tsx: Added a dedicated select dropdown for Bhashini's 23 Indian Languages.
  - rontend/dashboard/src/components/navigation/Navbar.tsx: Added 
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

 # # #   S e e d   S t a f f   A c c o u n t s   S c r i p t   F i x e s 
 -   * * D e s c r i p t i o n * * :   U p d a t e d   s c r i p t s / s e e d _ s t a f f _ a c c o u n t s . p y   t o   c o r r e c t l y   i n i t i a l i z e   t h e   F i r e b a s e   A d m i n   S D K   u s i n g   e x p l i c i t   s e r v i c e   a c c o u n t   p a t h s ,   a n d   f i x e d   U n i c o d e   c h a r a c t e r   o u t p u t   f o r   W i n d o w s   c o m p a t i b i l i t y .   C r e a t e d   s e c r e t s   d i r e c t o r y   a n d   c o p i e d    a c k e n d / s e r v i c e - a c c o u n t . j s o n   t o   s e c r e t s / s e r v i c e - a c c o u n t . j s o n . 
 -   * * F i l e s   U p d a t e d * * :   s c r i p t s / s e e d _ s t a f f _ a c c o u n t s . p y   ( u p d a t e d   l o g i c   f o r   i n i t i a l i z e _ a p p   a n d   r e p l a c e d   u n i c o d e   c h a r a c t e r s ) ,   s e c r e t s / s e r v i c e - a c c o u n t . j s o n   ( a d d e d ) . 
 -   * * R a t i o n a l e * * :   T h e   s c r i p t   p r e v i o u s l y   i n i t i a l i z e d    i r e b a s e _ a d m i n   w i t h o u t   c r e d e n t i a l s   w h i c h   c a u s e d   s u b s e q u e n t   a u t h   s e r v i c e   A P I   c a l l s   t o   f a i l .   A d d i t i o n a l l y ,   t h e   b o x - d r a w i n g   c h a r a c t e r s   u s e d   i n   o u t p u t   c a u s e d   a   U n i c o d e E n c o d e E r r o r   o n   W i n d o w s   c o n s o l e s . 
 
 
 # # #   F i x   a u t h S e r v i c e . t s   R o l e   P a r s i n g 
 -   * * D e s c r i p t i o n * * :   U p d a t e d   \  r o n t e n d / d a s h b o a r d / s r c / s e r v i c e s / a u t h S e r v i c e . t s \   t o   u s e   \ 	 o k e n R e s u l t . c l a i m s . r o l e \   i n s t e a d   o f   m a n u a l l y   p a r s i n g   t h e   e m a i l   a d d r e s s . 
 -   * * F i l e s   U p d a t e d * * :   \  r o n t e n d / d a s h b o a r d / s r c / s e r v i c e s / a u t h S e r v i c e . t s \ ` n -   * * R a t i o n a l e * * :   T h e   m a n u a l   p a r s i n g   w a s   p r e v i o u s l y   b r o k e n   b e c a u s e   i t   c h e c k e d   f o r   \ . f i e l d . \   i n s t e a d   o f   \ . f i e l d @ \ ,   a n d   n o w   t h a t   t h e   A d m i n   S D K   s u c c e s s f u l l y   s e e d e d   t h e   c u s t o m   c l a i m s ,   w e   c a n   d i r e c t l y   r e a d   t h e   e x a c t   r o l e s   s a f e l y . 
 
 
 # # #   R e m o v e d   A u t h e n t i c a t i o n   B a c k d o o r 
 -   * * D e s c r i p t i o n * * :   R e m o v e d   t h e   h a r d c o d e d   f a l l b a c k   l o g i n   l o g i c   f r o m   \  u t h S e r v i c e . t s \   t h a t   a l l o w e d   a n y   u s e r   w i t h   a   \ @ g o v . i n \   e m a i l   t o   b y p a s s   F i r e b a s e   A u t h e n t i c a t i o n   u s i n g   a   h a r d c o d e d   s t a t i c   p a s s w o r d   ( \ s e c u r e s p i n 2 6 \ ) . 
 -   * * F i l e s   U p d a t e d * * :   \  r o n t e n d / d a s h b o a r d / s r c / s e r v i c e s / a u t h S e r v i c e . t s \ ` n -   * * R a t i o n a l e * * :   A   h a r d c o d e d   b a c k d o o r   t h a t   b y p a s s e s   t h e   p r i m a r y   a u t h e n t i c a t i o n   m e c h a n i s m   i s   a   s e v e r e   s e c u r i t y   v u l n e r a b i l i t y ,   e s p e c i a l l y   f o r   a   g o v e r n m e n t   s i t e .   I t   r e s u l t e d   i n   u s e r s   r e c e i v i n g   m o c k   a u t h o r i z a t i o n   t o k e n s   a n d   i n c o r r e c t   d e f a u l t   r o l e s   i f   t h e i r   F i r e b a s e   A u t h   f a i l e d   o r   c a c h e d   s t a t e   w a s   m i s m a t c h e d . 
 
 

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
-   R e p l a c e d   i n l i n e   C i t i z e n   P r o f i l e   m o d a l   i n   N a v b a r . t s x   w i t h   d e d i c a t e d   C i t i z e n P r o f i l e   c o m p o n e n t   r o u t i n g . 
 -   C r e a t e d   C i t i z e n P r o f i l e . t s x   w i t h   t a b s   f o r   ' M y   S u b m i s s i o n s '   a n d   ' D e m a n d s   I   S u p p o r t e d ' . 
 -   R e w r o t e   C i t i z e n P o r t a l H o m e . t s x   t o   a c t   a s   t h e   m a i n   g l o b a l   D e m a n d   F e e d ,   i n t e g r a t i n g   r e a c t - l e a f l e t   M a p C o n t a i n e r   a n d   s o r t i n g   t a b s . 
 -   A d d e d   L e a f l e t   M a p   P i n   D r o p ,   E X I F   u p l o a d   b u t t o n   m o c k ,   a n d   W h a t s A p p   s h o r t c u t   b a n n e r   t o   C r e a t e D e m a n d F o r m . t s x   t o   f u l f i l l   r e d e s i g n   r e q u i r e m e n t s . 
 
 
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
- **Removed Duplicate Menu Item**: Removed 'Public Feed' from the citizen profile dropdown menu in rontend/dashboard/src/components/navigation/Navbar.tsx since 'Dashboard' does the same.
- **Added Inline Vote Button**: Added a direct 'Vote ?' button on the demand cards in the citizen public feed (rontend/dashboard/src/components/citizen/CitizenPortalHome.tsx). Integrated castVote API call in rontend/dashboard/src/services/demandService.ts.
- **Updated 'What You Can Demand' Grid**: Converted the basic text cards into a photographic 3x2 grid in rontend/dashboard/src/components/landing/WhatYouCanDemandSection.tsx. Generated 6 high-quality AI images and placed them in rontend/dashboard/public/images/categories/.
- **Replaced Hero Canvas Map with Leaflet Heatmap**: Replaced the non-functional canvas animation in rontend/dashboard/src/components/landing/HeroSection.tsx with a fully locked 
eact-leaflet map and leaflet.heat heatmap layer. Added leaflet.heat to package.json and created typings in rontend/dashboard/src/leaflet-heat.d.ts.

### Responsive Design and Staff KPI Grid (Plan Executed)
- **Staff Dashboard KPI Grid Fix**: Modified rontend/dashboard/src/components/staff/DemandKPIBar.css and DemandKPIBar.tsx. Consolidated classes to .kpi-grid for a responsive 2x2 grid. Used .kpi-content-left and .kpi-content-right to align the sparkline graphs to the right of the stats in each box.
- **Citizen Feed Mobile Layout**: Updated rontend/dashboard/src/components/citizen/CitizenPortalHome.tsx to remove inline hardcoded 1fr 1fr grids. Added .citizen-feed-grid and .feed-map to rontend/dashboard/src/styles/citizen.css so that the feed and map correctly stack vertically on mobile screens (max-width: 768px).
- **Staff Dashboards Mobile Layout**: Replaced inline 1fr 1fr grids in rontend/dashboard/src/components/staff/DepartmentOfficerDashboard.tsx with a new responsive .dashboard-grid class defined in rontend/dashboard/src/styles/dashboard.css. Ensured tables have .table-responsive wrapping for horizontal scrolling.
-   M o d i f i e d   \ C r e a t e D e m a n d F o r m . t s x \   t o   f i x   U I   i s s u e s   w i t h   m a n u a l   e n t r y ,   a d d i n g   d e f a u l t   e m p t y   s e l e c t i o n s   f o r   i n f r a s t r u c t u r e   c a t e g o r y   a n d   c u s t o m   t e x t   i n p u t s   w h e n   ' O t h e r '   i s   s e l e c t e d .   A l s o   r e p l a c e d   t h e   S h a d o w   D O M   P l a c e A u t o c o m p l e t e E l e m e n t   w i t h   a   c u s t o m   G o o g l e   P l a c e s   A u t o c o m p l e t e   U I   t o   m a t c h   t h e   t h e m e ,   i m p l e m e n t e d   a   f a l l b a c k   f o r   m a n u a l   a d d r e s s   e n t r y ,   a n d   a d d e d   a u t o m a t i c   r e v e r s e - g e o c o d i n g   w h e n   t h e   m a p   p i n   i s   m o v e d .   T h i s   f i x e d   v a l i d a t i o n   i s s u e s   f o r   S t e p   2 ' s   N e x t   b u t t o n . 
 
 -   F i x e d   l o c a l   n e t w o r k   t e s t i n g   i s s u e   b y   d y n a m i c a l l y   d e t e r m i n i n g   t h e   A P I _ U R L   u s i n g   w i n d o w . l o c a t i o n . h o s t n a m e   i n   t h e   f r o n t e n d   ( a u t h S e r v i c e . t s ,   d e m a n d S e r v i c e . t s ,   e t c . )   r a t h e r   t h a n   h a r d c o d i n g   l o c a l h o s t .   A l s o   u p d a t e d   t h e   F a s t A P I   b a c k e n d   C O R S   p o l i c y   t o   a l l o w   a n y   o r i g i n   u s i n g   r e g e x ,   s o   t e a m m a t e s   c a n   a c c e s s   t h e   d e v   s e r v e r   v i a   t h e i r   l o c a l   I P   a d d r e s s . 
 
 -   I m p l e m e n t e d   F i r e s t o r e   p e r s i s t e n c e   f o r   G o o g l e   S i g n - I n   m i s s i n g   p r o f i l e   d a t a   ( P h o n e / D O B )   s o   t h a t   u s e r s   a r e n ' t   p r o m p t e d   o n   e v e r y   l o g i n .   U p d a t e d   C i t i z e n S i g n u p . t s x   a n d   a u t h S e r v i c e . t s   t o   u s e   F i r e s t o r e   c o l l e c t i o n   ' u s e r s ' . 
 
 -   W i r e d   u p   s u b m i t R e q u e s t T o B a c k e n d   i n   d e m a n d S e r v i c e . t s   t o   h i t   P O S T   / a p i / p i p e l i n e / r u n   a n d   m o d i f i e d   t h e   b a c k e n d   p r o c e s s _ p i p e l i n e _ r u n   i n   d e m a n d _ s e r v i c e . p y   t o   s a v e   p r o c e s s e d   d e m a n d s   i n t o   t h e   ' d e m a n d s '   F i r e s t o r e   c o l l e c t i o n .   A l s o   w i r e d   u p   g e t M y R e q u e s t s F r o m B a c k e n d   t o   p r o p e r l y   r e a d   a c t u a l   d e m a n d s . 
 
 

## 2026-09-29: Merged Branch
- **Description**: Merged the `niketan` branch into the `main` branch.
- **Files Modified**: Various files across frontend and backend.
- **Rationale**: User requested to merge the `main` and the `niketan` branch. Direction chosen was `niketan` into `main`.

## 2026-09-29: Sync Branch
- **Description**: Merged the `main` branch into the `niketan` branch to sync them.
- **Files Modified**: Various files from main.
- **Rationale**: User requested to sync `niketan` with `main`.
