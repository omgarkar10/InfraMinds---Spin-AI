## Goal Description
Overhaul the Staff Portal to support the new "Public Demand" model. The system will transition to a Role-Based Access Control (RBAC) architecture separating Field Officers, Department Officers, Policymakers, and System Admins. Key features include an offline-capable PWA for Field Officers to submit geotagged feasibility studies, automated routing of high-vote demands to Department Officers, and a secure authentication flow that strictly binds jurisdiction to the user session without front-end state/district selection.

## User Review Required
> [!IMPORTANT]
> **PWA Background Sync:** To support offline background sync for Field Officers submitting reports with poor cellular reception, we will introduce a Service Worker. This requires migrating from standard `fetch` calls to a Sync Manager queue for media uploads.
> 
> **EXIF Data Extraction:** Native EXIF extraction for GPS validation on the backend requires the Python `Pillow` and `exifread` libraries. Any images stripped of EXIF data by intermediate processing (e.g., WhatsApp compression) will be rejected. Please confirm this strict security policy is acceptable for Field Officers.

## Open Questions
> [!NOTE]
> 1. **Authentication Strategy:** The requirements state JWT/OAuth2. Since Firebase Auth is already used for citizens, should we continue using Firebase Auth (with Custom Claims for roles/jurisdiction) for Staff, or build a custom JWT issuer purely in the Python backend? (The plan assumes Firebase Auth with Custom Claims).
> 2. **Automated Assignment Logic:** Should demands that cross the vote threshold be assigned to the Department Officer's general queue, or directly auto-assigned to an available Field Officer based on proximity/workload?

## Proposed Changes

---

### Backend Components

#### [MODIFY] `backend/requirements.txt`
Add necessary libraries for rate limiting and image processing.
```diff
+ slowapi>=0.1.9
+ Pillow>=10.2.0
+ exifread>=3.0.0
```

#### [MODIFY] `backend/spin_agents/api.py`
Integrate rate limiting on login routes and register the new staff API endpoints.
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/v1/staff/auth/login")
@limiter.limit("5/minute")
async def staff_login(request: Request, credentials: dict):
    # Logic to validate credentials and return JWT with jurisdiction bound
    pass
```

#### [NEW] `backend/spin_agents/routers/staff_router.py`
Implement the RESTful endpoints for the staff RBAC system.
```python
@router.get("/demands/queue")
async def get_demand_queue(user=Depends(verify_staff_token)):
    # Returns demands based on user.role and user.jurisdiction
    pass

@router.post("/investigation/{demand_id}/assign")
async def assign_investigation(demand_id: str, payload: dict, user=Depends(verify_staff_token)):
    # Verify user is DEPARTMENT_OFFICER in correct jurisdiction
    pass

@router.post("/investigation/{demand_id}/report")
async def submit_feasibility_report(demand_id: str, file: UploadFile = File(...), user=Depends(verify_staff_token)):
    # Verify user is FIELD_OFFICER
    # Process file to extract EXIF GPS coordinates and validate against demand target_location
    pass

@router.get("/analytics/heatmaps")
async def get_heatmaps(user=Depends(verify_staff_token)):
    # Verify user is POLICYMAKER
    pass
```

#### [NEW] `backend/spin_agents/services/exif_validator.py`
Utility to extract and validate GPS coordinates from uploaded images.
```python
import exifread

def validate_image_gps(file_bytes, expected_lat, expected_lng, tolerance_meters=100):
    tags = exifread.process_file(file_bytes)
    # Logic to extract GPSInfo and compare using Haversine formula
    return is_valid
```

---

### Frontend Configuration

#### [MODIFY] `frontend/dashboard/package.json`
Add the Vite PWA plugin.
```diff
+ "vite-plugin-pwa": "^0.19.0",
+ "workbox-window": "^7.0.0"
```

#### [MODIFY] `frontend/dashboard/vite.config.ts`
Configure the PWA plugin for offline caching and background sync for Field Officers.
```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SPIN Staff Field Portal',
        short_name: 'SPIN Field',
        theme_color: '#0a2540',
        icons: [/* icons here */]
      },
      workbox: {
        runtimeCaching: [
          // Cache Maps API and static assets
        ]
      }
    })
  ]
}));
```

---

### Frontend UI & Components

#### [MODIFY] `frontend/dashboard/src/components/staff/StaffLogin.tsx`
Strip out all demo preset accounts. Ensure the login form only collects Email, Password, and Captcha.
```diff
- // Remove handleQuickDemoLogin
- // Remove DEMO PRESET ACCOUNTS UI section
```

#### [MODIFY] `frontend/dashboard/src/components/staff/StaffDashboard.tsx`
Refactor this monolithic component to act as a Router that dynamically imports and renders the correct dashboard based on the user's role:
```tsx
export const StaffDashboard: React.FC = () => {
  const { role } = useStaffContext();

  switch(role) {
    case 'FIELD_OFFICER': return <FieldOfficerDashboard />;
    case 'DEPARTMENT_OFFICER': return <DepartmentOfficerDashboard />;
    case 'POLICYMAKER': return <PolicymakerDashboard />;
    case 'SYSTEM_ADMIN': return <SystemAdminDashboard />;
    default: return <UnauthorizedView />;
  }
}
```

#### [NEW] `frontend/dashboard/src/components/staff/FieldOfficerDashboard.tsx`
Implementation of the Mobile-First feasibility study interface with Map integration and geotagged photo upload capabilities.

## Verification Plan

### Automated Tests
1. **Rate Limiting:** `pytest backend/tests/test_auth.py` -> Send 6 rapid login requests and verify the 6th returns a 429 status code.
2. **EXIF Validation:** `pytest backend/tests/test_exif.py` -> Upload mock images with valid and invalid (or stripped) EXIF data to ensure rejection of untracked photos.

### Manual Verification
1. Open the staff login page and verify no demo buttons exist.
2. Login with a test Field Officer account on a mobile device (or devtools mobile emulation).
3. Attempt to submit a feasibility report while device network is disconnected, verifying the Service Worker queues the request.
4. Reconnect the network and verify the background sync successfully uploads the report.
5. Login as a Department Officer and verify that a demand artificially pushed past the "vote threshold" automatically appears in the assignment queue without manual intervention.
