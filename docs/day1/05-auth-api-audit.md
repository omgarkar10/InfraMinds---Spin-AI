# 05 — Authentication & API Security Audit

**Document:** `docs/day1/05-auth-api-audit.md`  
**Auditor / Role:** M1 — AI & Backend Lead  
**Target Audience:** Beginner Backend Developer (Maaz) & GCC Team  
**Classification:** VERIFIED (Inspected from `spin_agents/auth.py`, `spin_agents/api.py`, and `services/authService.ts`)  

---

## 1. Beginner-Friendly Guide to Authentication in SPIN

Before diving into the findings, here is a quick overview of how authentication is supposed to work in a production government application:

1. **Identification vs. Authentication**:
   - *Identification* is telling the system who you are (e.g., your phone number or official email).
   - *Authentication* is proving that you are who you claim to be (e.g., typing the correct secret password or OTP).
2. **JSON Web Tokens (JWT)**:
   - When a user successfully logs in, the backend creates a digitally signed token called a JWT.
   - The token contains claims (like user ID and role). It is signed using a secret key (`JWT_SECRET`).
   - The user's browser sends this token in the `Authorization: Bearer <token>` header with every subsequent request.
3. **Authorization (Role-Based Access Control)**:
   - Even if you have a valid token, you should only be allowed to access routes matching your role (e.g., a citizen cannot view internal staff grievances or sign off on public budgets).

---

## 2. Route Inventory & Comparison

| Method | Registered Route | Handler Function | Request Schema | Auth Required? | Database Operation | Observed Caller |
|:---|:---|:---|:---|:---|:---|:---|
| `POST` | `/api/auth/citizen/signup` | `citizen_signup` | `CitizenSignupRequest` (name, phone, password) | None (Public) | Checks existing phone; hashes password; inserts `User(role="citizen")` | Frontend `authService.ts:20` |
| `POST` | `/api/auth/citizen/login` | `citizen_login` | `CitizenLoginRequest` (countryCode, phone, password) | None (Public) | Verifies phone & bcrypt hash; issues JWT | Frontend `authService.ts:37` |
| `POST` | `/api/auth/citizen/forgot-password` | `citizen_forgot_password` | `CitizenForgotPasswordRequest` (phone) | None (Public) | Checks user existence | Frontend `authService.ts:54` |
| `POST` | `/api/auth/citizen/reset-password` | `citizen_reset_password` | `CitizenResetPasswordRequest` (phone, password) | None (Public) | **Overwrites password directly without OTP or token!** | Frontend `authService.ts:67` |
| `POST` | `/api/auth/staff-login` | `staff_login` | `StaffLoginRequest` (identifier, password) | None (Public) | Verifies email & bcrypt hash; checks role in `{"staff", "admin", ...}`; issues JWT | Frontend `authService.ts:84` |
| `POST` | `/api/auth/citizen-login` | `citizen_login` *(overwritten symbol)* | `CitizenLoginRequest` (identifier, password) | None (Public) | **Auto-creates user on failed login! Overwrites missing password!** | **Orphaned / Unused by frontend** |

---

## 3. Detailed Security Findings & Vulnerability Register

### SEC-01: Auto-Account Creation on Login (`/api/auth/citizen-login`)
- **Severity:** HIGH
- **Verified File/Function:** `backend/spin_agents/auth.py:235-283`
- **Observed Behavior:**
  If a user attempts to log in with an identifier that does not exist in the database, the handler automatically creates a new `User` record:
  ```python
  if not user:
      # Auto-create citizen user with hashed password
      user = User(
          email=req.identifier if is_email else None,
          phone_number=req.identifier if not is_email else None,
          password_hash=pwd_context.hash(req.password),
          role="citizen",
          is_verified=True
      )
      db.add(user)
      await db.commit()
  ```
- **Security Impact:** Anyone making a typo during login creates a permanent, verified database account. Furthermore, this endpoint overrides the Python symbol `citizen_login` in `auth.py`.
- **Frontend Impact:** The frontend `authService.ts` calls `/api/auth/citizen/login`, making `/api/auth/citizen-login` a dangerous legacy duplicate.
- **Required Fix:** Deprecate and remove `/api/auth/citizen-login` in Day 2.

---

### SEC-02: Unauthenticated Password Hijacking (`/api/auth/citizen/reset-password`)
- **Severity:** CRITICAL
- **Verified File/Function:** `backend/spin_agents/auth.py:167-182`
- **Observed Behavior:**
  ```python
  @router.post("/citizen/reset-password")
  async def citizen_reset_password(req: CitizenResetPasswordRequest, db: AsyncSession = Depends(get_db)):
      stmt = select(User).where(User.phone_number == req.phone)
      result = await db.execute(stmt)
      user = result.scalars().first()
      if not user:
          raise HTTPException(status_code=400, detail="Unable to reset password for this account.")
      user.password_hash = pwd_context.hash(req.password)
      await db.commit()
      return {"status": "success", "message": "Password reset successfully."}
  ```
- **Security Impact:** The endpoint performs **zero verification** (no OTP, no reset token, no email link). Any attacker who knows any citizen's phone number can send a POST request with that phone number and a new password, immediately seizing control of the citizen's account!
- **Required Fix:** Require a one-time verification token (or mock OTP token during demo) before allowing password hash replacement.

---

### SEC-03: Hardcoded JWT Fallback Secret
- **Severity:** HIGH
- **Verified File/Function:** `backend/spin_agents/auth.py:25`
- **Observed Behavior:**
  ```python
  JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey")
  ```
- **Security Impact:** If `JWT_SECRET` is not set in `.env`, the fallback string `"supersecretkey"` is used. Anyone can forge arbitrary admin or policymaker tokens using this well-known key.
- **Required Fix:** In production, raise a startup configuration exception if `JWT_SECRET` is unset or equal to the default development secret.

---

### SEC-04: Completely Unprotected Operational & Policy Endpoints
- **Severity:** CRITICAL (Immediate Blocker for Public Demos)
- **Verified File/Function:** `backend/spin_agents/api.py:177-263`
- **Observed Behavior:**
  The following endpoints have NO authentication or authorization dependencies:
  1. `POST /api/dashboard/policy-action` (Allows anyone on the internet to approve or reject infrastructure projects and trigger citizen notifications!)
  2. `GET /api/grievances` (Allows anyone to list all citizen complaints stored in SQLite).
  3. `GET /api/dashboard/red-zones` (Exposes critical municipal failure hotspots to unauthenticated callers).
  4. `POST /api/pipeline/run` (Allows unauthenticated callers to trigger heavy LLM execution).
- **Security Impact:** Public demo exposure allows unauthorized modification of government records and public policy actions.
- **Required Fix:** Implement a reusable FastAPI security dependency (`Depends(get_current_user)`) that verifies the Bearer JWT and checks required roles (`policymaker`, `admin`, `staff`).

---

## 4. Audit Summary Matrix

| Issue ID | Severity | Component | Finding | Target Remediation |
|:---|:---|:---|:---|:---|
| **SEC-01** | HIGH | `auth.py` | Duplicate `/citizen-login` auto-creates accounts on login. | Day 2 |
| **SEC-02** | CRITICAL | `auth.py` | Password reset has no verification; allows account takeover. | Day 2 |
| **SEC-03** | HIGH | `auth.py` | Default hardcoded fallback JWT secret `"supersecretkey"`. | Day 2 |
| **SEC-04** | CRITICAL | `api.py` | `/api/dashboard/policy-action` and `/api/grievances` lack authentication. | Day 2 |
| **API-01** | MEDIUM | `test_api_endpoints.py` | Tests query `/api/staff/grievances` which does not exist in `api.py`. | Day 2 |
