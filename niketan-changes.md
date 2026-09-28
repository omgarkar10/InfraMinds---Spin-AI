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
 -   * * R a t i o n a l e * * :   T h e   s c r i p t   p r e v i o u s l y   i n i t i a l i z e d    i r e b a s e _ a d m i n   w i t h o u t   c r e d e n t i a l s   w h i c h   c a u s e d   s u b s e q u e n t   a u t h   s e r v i c e   A P I   c a l l s   t o   f a i l .   A d d i t i o n a l l y ,   t h e   b o x - d r a w i n g   c h a r a c t e r s   u s e d   i n   o u t p u t   c a u s e d   a   U n i c o d e E n c o d e E r r o r   o n   W i n d o w s   c o n s o l e s .  
 
 # # #   F i x   a u t h S e r v i c e . t s   R o l e   P a r s i n g 
 -   * * D e s c r i p t i o n * * :   U p d a t e d   \  r o n t e n d / d a s h b o a r d / s r c / s e r v i c e s / a u t h S e r v i c e . t s \   t o   u s e   \ 	 o k e n R e s u l t . c l a i m s . r o l e \   i n s t e a d   o f   m a n u a l l y   p a r s i n g   t h e   e m a i l   a d d r e s s . 
 -   * * F i l e s   U p d a t e d * * :   \  r o n t e n d / d a s h b o a r d / s r c / s e r v i c e s / a u t h S e r v i c e . t s \ ` n -   * * R a t i o n a l e * * :   T h e   m a n u a l   p a r s i n g   w a s   p r e v i o u s l y   b r o k e n   b e c a u s e   i t   c h e c k e d   f o r   \ . f i e l d . \   i n s t e a d   o f   \ . f i e l d @ \ ,   a n d   n o w   t h a t   t h e   A d m i n   S D K   s u c c e s s f u l l y   s e e d e d   t h e   c u s t o m   c l a i m s ,   w e   c a n   d i r e c t l y   r e a d   t h e   e x a c t   r o l e s   s a f e l y .  
 
 # # #   R e m o v e d   A u t h e n t i c a t i o n   B a c k d o o r 
 -   * * D e s c r i p t i o n * * :   R e m o v e d   t h e   h a r d c o d e d   f a l l b a c k   l o g i n   l o g i c   f r o m   \  u t h S e r v i c e . t s \   t h a t   a l l o w e d   a n y   u s e r   w i t h   a   \ @ g o v . i n \   e m a i l   t o   b y p a s s   F i r e b a s e   A u t h e n t i c a t i o n   u s i n g   a   h a r d c o d e d   s t a t i c   p a s s w o r d   ( \ s e c u r e s p i n 2 6 \ ) . 
 -   * * F i l e s   U p d a t e d * * :   \  r o n t e n d / d a s h b o a r d / s r c / s e r v i c e s / a u t h S e r v i c e . t s \ ` n -   * * R a t i o n a l e * * :   A   h a r d c o d e d   b a c k d o o r   t h a t   b y p a s s e s   t h e   p r i m a r y   a u t h e n t i c a t i o n   m e c h a n i s m   i s   a   s e v e r e   s e c u r i t y   v u l n e r a b i l i t y ,   e s p e c i a l l y   f o r   a   g o v e r n m e n t   s i t e .   I t   r e s u l t e d   i n   u s e r s   r e c e i v i n g   m o c k   a u t h o r i z a t i o n   t o k e n s   a n d   i n c o r r e c t   d e f a u l t   r o l e s   i f   t h e i r   F i r e b a s e   A u t h   f a i l e d   o r   c a c h e d   s t a t e   w a s   m i s m a t c h e d .  
 

## 2026-09-28: .gitignore Updated to Exclude Secrets Folder
- **Description**: Added secrets/ and **/secrets/ rules to .gitignore.
- **Files Updated**: .gitignore
- **Rationale**: Ensures all secret files and Firebase service account credentials stored in the secrets/ folder are excluded from Git tracking and version control to prevent sensitive credential leaks.

- **Added `citizen-redesign.md`**: Saved the Citizen Portal redesign implementation plan (including Leaflet map integration, Phone Auth, and feed filters) to the workspace as requested.
-   R e p l a c e d   i n l i n e   C i t i z e n   P r o f i l e   m o d a l   i n   N a v b a r . t s x   w i t h   d e d i c a t e d   C i t i z e n P r o f i l e   c o m p o n e n t   r o u t i n g . 
 -   C r e a t e d   C i t i z e n P r o f i l e . t s x   w i t h   t a b s   f o r   ' M y   S u b m i s s i o n s '   a n d   ' D e m a n d s   I   S u p p o r t e d ' . 
 -   R e w r o t e   C i t i z e n P o r t a l H o m e . t s x   t o   a c t   a s   t h e   m a i n   g l o b a l   D e m a n d   F e e d ,   i n t e g r a t i n g   r e a c t - l e a f l e t   M a p C o n t a i n e r   a n d   s o r t i n g   t a b s . 
 -   A d d e d   L e a f l e t   M a p   P i n   D r o p ,   E X I F   u p l o a d   b u t t o n   m o c k ,   a n d   W h a t s A p p   s h o r t c u t   b a n n e r   t o   C r e a t e D e m a n d F o r m . t s x   t o   f u l f i l l   r e d e s i g n   r e q u i r e m e n t s .  
 
- Fixed login redirect bug in App.tsx by using setView directly instead of checking old state.
- Removed landing Navbar from citizen views in App.tsx and added inline Profile/Logout buttons to CitizenPortalHome.tsx and CitizenProfile.tsx.

- Migrated manual React state navigation to Native URL Routing (window.history.pushState/popstate) to fully resolve browser back-button navigation issues across the entire application and provide clean URL paths like /citizen and /landing.

- Added SPIN logo to Citizen Dashboard header.\n- Implemented Geolocation request on citizen feed load, zooming the map to user location and adding a blue You Are Here marker.\n