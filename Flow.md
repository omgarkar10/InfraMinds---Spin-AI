# SPIN Execution Flow

This document traces the exact path a payload takes as it travels through the SPIN system.

## 1. Intake & Translation
**Component**: `Chatbot_Intake_Agent`
- Citizen submits a grievance (audio/text).
- If regional language, `bhashini_translate_tool` standardizes it to English.
- Payload Output: `{ "original_text", "english_translation", "user_id", "media_url", "location_data", "hitl_required" }`

## 2. HITL Gate (Human-in-the-Loop)
**Component**: `HitlLocationGate`
- Intercepts payload. If `location_data` is null, execution pauses.
- Prompts user to supply GPS/landmark.
- Proceeds only when `pipeline_status == "location_confirmed"`.

## 3. Semantic Analysis
**Component**: `Semantic_Parsing_Agent`
- Evaluates `english_translation` to assign `domain` (Water/Road/Power) and `severity` (1-10).
- If `media_url` exists, runs `vision_analyze_tool` to confirm physical damage.
- Payload Appended: `{ "domain", "severity", "image_verified", "lat_long" }`

## 4. Geospatial Correlation
**Component**: `Geospatial_Correlation_Agent`
- Reads `lat_long` and routes the coordinates to `gati_shakti_query_tool`.
- Commits final merged JSON string into BigQuery via `bigquery_insert_tool`.
- Payload Appended: `{ "priority_gap" }`

## 5. Dashboard Generation
**Component**: `Policy_Dashboard_Agent`
- Queries `bigquery_summary_tool` for aggregate data.
- Emits natural language executive summary.
- If policy approved in UI, triggers `bhashini_reverse_notify_tool` to text the original citizen in their native language.

---

## 6. Citizen Portal Journey (Added 23 Sep 2026)

### Registration
`CitizenSignup.tsx` → `POST /api/auth/citizen/signup` (name, phone, password)
→ bcrypt hash stored in SQLite `users` table
→ JWT returned → `localStorage.citizen_token` + `isLoggedIn: true`
→ Redirect to **Citizen Dashboard** (`CitizenPortalHome.tsx`)

### Login
`CitizenLogin.tsx` → `POST /api/auth/citizen/login` (phone, password)
→ bcrypt verify → JWT returned on success
→ `401 Unauthorized` displayed on failure (no auto account creation)
→ Redirect to **Citizen Dashboard**

### Submit Request (4-step form)
`RaiseGrievanceForm.tsx` (Step 1 → Step 4):
1. **Step 1**: Citizen picks Type A (Existing Problem) or Type B (New Development). Provides category, description, and specific issue. Optional: speak via Web Speech API → editable transcript → optional `POST /api/requests/analyze` for Gemini AI extraction.
2. **Step 2**: Nationwide state/district selection (36 States/UTs). Optional GPS coordinate capture with citizen confirmation. No silent Pune/Maharashtra default.
3. **Step 3**: Optional JPG/PNG/WEBP/PDF upload → `POST /api/requests/upload` → stored in `backend/uploads/`.
4. **Step 4**: Full review screen. Declaration checkbox. On confirm → `POST /api/requests/submit` (JWT Bearer) → SQLite persist → BigQuery best-effort sync → Returns genuine `SPIN-2026-XXXXXX` ID.

### My Requests / Tracking
`TrackGrievances.tsx` → `GET /api/requests/my` (JWT) → own requests listed
`GrievanceDetail.tsx` → `GET /api/requests/{request_id}` (JWT) → 403 if not owner

### Authorization Enforcement
All citizen request endpoints check `current_user.id == grievance.user_id` OR `current_user.role in ["staff", "admin"]`.
Citizen B cannot access Citizen A's submissions → **403 Forbidden**.
