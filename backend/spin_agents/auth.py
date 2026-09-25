"""
Authentication module for SPIN Portal.

- Citizen Portal : Password-based signup, login, and reset flow.
- Staff Portal   : Credential-based login (email/employee-ID + password) → issues JWT.
"""

import os
import uuid
import random
import hmac
import hashlib
import json
import urllib.request
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, field_validator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import jwt
import bcrypt
import warnings

from spin_agents.db import get_db
from spin_agents.models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except ValueError:
        return False

JWT_SECRET    = os.getenv("JWT_SECRET", "supersecretkey")
JWT_ALGORITHM = "HS256"

# Security guard for production JWT configuration
_SPIN_ENV = os.getenv("ENVIRONMENT", os.getenv("SPIN_ENV", "development")).lower()
if _SPIN_ENV in ("production", "prod"):
    if JWT_SECRET in ("supersecretkey", "secret", "change-me", "") or len(JWT_SECRET) < 32:
        raise RuntimeError(
            "CRITICAL SECURITY CONFIGURATION ERROR: Insecure or default JWT_SECRET detected in production! "
            "A cryptographically strong secret of at least 32 characters must be configured in environment variables."
        )
elif JWT_SECRET == "supersecretkey":
    warnings.warn(
        "SECURITY NOTICE: Running with default development JWT_SECRET ('supersecretkey'). "
        "Set JWT_SECRET in your environment before deploying to production.",
        UserWarning,
        stacklevel=2,
    )

# ──────────────────────────────────────────────
# Pydantic schemas
# ──────────────────────────────────────────────

class CitizenSignupRequest(BaseModel):
    name: str
    countryCode: str = "IN"
    phone: str
    password: str
    captcha_token: str | None = None
    captcha_answer: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Name cannot be blank.")
        return s

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Phone number cannot be blank.")
        return s

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        return v

class GoogleAuthRequest(BaseModel):
    id_token: str

class CitizenLoginRequest(BaseModel):
    countryCode: str = "IN"
    phone: str
    password: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        s = v.strip()
        if not s:
            raise ValueError("Phone number cannot be blank.")
        return s

class CitizenForgotPasswordRequest(BaseModel):
    countryCode: str = "IN"
    phone: str

class CitizenResetPasswordRequest(BaseModel):
    phone: str
    password: str

class StaffLoginRequest(BaseModel):
    identifier: str     # official email or employee-ID
    password: str


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def verify_captcha_challenge(token: str | None, answer: str | None) -> bool:
    """
    Verifies human CAPTCHA challenge.
    Supports:
    1. External Google reCAPTCHA / Cloudflare Turnstile if secret key configured in environment.
    2. Signed local mathematical challenge in local/demo environment.
    """
    recaptcha_secret = os.getenv("RECAPTCHA_SECRET_KEY") or os.getenv("TURNSTILE_SECRET_KEY")
    if recaptcha_secret and token:
        try:
            url = "https://www.google.com/recaptcha/api/siteverify"
            data = f"secret={recaptcha_secret}&response={token}".encode("utf-8")
            req = urllib.request.Request(url, data=data, method="POST")
            with urllib.request.urlopen(req, timeout=5) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                return bool(res_data.get("success", False))
        except Exception as e:
            print(f"[CAPTCHA Verification Warning]: {e}")

    # Fallback / Local math CAPTCHA verification
    if not token or not answer:
        return False

    try:
        # Token format: "num1:num2:signature"
        parts = token.split(":")
        if len(parts) != 3:
            return False
        num1, num2, expected_sig = int(parts[0]), int(parts[1]), parts[2]
        expected_ans = str(num1 + num2)
        
        # Verify signature to prevent forgery
        msg = f"{num1}:{num2}".encode("utf-8")
        computed_sig = hmac.new(JWT_SECRET.encode("utf-8"), msg, hashlib.sha256).hexdigest()[:16]
        if not hmac.compare_digest(computed_sig, expected_sig):
            return False
        
        return answer.strip() == expected_ans
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=24))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


# ──────────────────────────────────────────────
# CAPTCHA Challenge Endpoint
# ──────────────────────────────────────────────

@router.get("/captcha")
async def get_captcha_challenge():
    """
    Generates a human verification challenge.
    Returns site key metadata if reCAPTCHA/Turnstile configured, or a signed math puzzle for local dev.
    """
    recaptcha_site = os.getenv("RECAPTCHA_SITE_KEY") or os.getenv("VITE_RECAPTCHA_SITE_KEY")
    turnstile_site = os.getenv("TURNSTILE_SITE_KEY") or os.getenv("VITE_TURNSTILE_SITE_KEY")
    if recaptcha_site:
        return {"provider": "recaptcha", "site_key": recaptcha_site}
    if turnstile_site:
        return {"provider": "turnstile", "site_key": turnstile_site}

    # Standard signed local math puzzle
    n1 = random.randint(1, 15)
    n2 = random.randint(1, 15)
    msg = f"{n1}:{n2}".encode("utf-8")
    sig = hmac.new(JWT_SECRET.encode("utf-8"), msg, hashlib.sha256).hexdigest()[:16]
    token = f"{n1}:{n2}:{sig}"
    return {
        "provider": "math",
        "question": f"What is {n1} + {n2}?",
        "captcha_token": token,
    }


# ──────────────────────────────────────────────
# Citizen Password & OAuth endpoints
# ──────────────────────────────────────────────

@router.post("/citizen/signup")
async def citizen_signup(req: CitizenSignupRequest, db: AsyncSession = Depends(get_db)):
    """
    Creates a new citizen account with a hashed password after CAPTCHA verification.
    Returns a JWT upon successful creation.
    """
    # 0. Validate Human CAPTCHA
    if not verify_captcha_challenge(req.captcha_token, req.captcha_answer):
        recaptcha_secret = os.getenv("RECAPTCHA_SECRET_KEY") or os.getenv("TURNSTILE_SECRET_KEY")
        if _SPIN_ENV in ("production", "prod") and not recaptcha_secret:
            raise HTTPException(
                status_code=400,
                detail="CAPTCHA verification required: Please configure RECAPTCHA_SECRET_KEY or TURNSTILE_SECRET_KEY in production."
            )
        raise HTTPException(
            status_code=400,
            detail="Human verification (CAPTCHA) failed. Please solve the challenge correctly."
        )

    # 1. Normalize phone if needed
    normalized_phone = req.phone
    
    # 2. Check if user exists
    stmt = select(User).where(User.phone_number == normalized_phone)
    result = await db.execute(stmt)
    existing_user = result.scalars().first()
    if existing_user:
        raise HTTPException(status_code=400, detail="This phone number is already associated with an account.")
    
    # 3. Hash password
    hashed_password = hash_password(req.password)
    
    # 4. Create user
    new_user = User(
        name=req.name,
        phone_number=normalized_phone,
        password_hash=hashed_password,
        is_verified=True,
        role="citizen"
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    token = create_access_token({"sub": new_user.id, "role": new_user.role})
    
    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id":    new_user.id,
            "phone": new_user.phone_number,
            "name":  new_user.name,
            "role":  new_user.role,
        },
    }

@router.post("/citizen/google")
async def citizen_google_login(req: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    """
    Verifies Google ID token, finds or creates corresponding SPIN citizen account, and returns JWT access token.
    """
    if not req.id_token:
        raise HTTPException(status_code=400, detail="Missing Google ID token.")

    token_data = None
    try:
        url = f"https://oauth2.googleapis.com/tokeninfo?id_token={req.id_token}"
        req_obj = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req_obj, timeout=6) as resp:
            token_data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Google authentication token verification failed: {str(e)}")

    if not token_data or "sub" not in token_data:
        raise HTTPException(status_code=401, detail="Invalid Google ID token.")

    google_sub = token_data.get("sub")
    email = token_data.get("email")
    name = token_data.get("name", "Google Citizen")

    # Find existing user by email or google phone identifier
    user = None
    if email:
        stmt = select(User).where(User.email == email)
        res = await db.execute(stmt)
        user = res.scalars().first()

    if not user:
        google_phone_id = f"g_{google_sub[:14]}"
        stmt = select(User).where(User.phone_number == google_phone_id)
        res = await db.execute(stmt)
        user = res.scalars().first()

    if not user:
        google_phone_id = f"g_{google_sub[:14]}"
        user = User(
            name=name,
            email=email,
            phone_number=google_phone_id,
            is_verified=True,
            role="citizen"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role})

    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "phone": user.phone_number or email,
            "email": user.email,
            "name": user.name,
            "role": user.role,
        },
    }

@router.post("/citizen/login")
async def citizen_login(req: CitizenLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Validates citizen phone and password against the database, then issues a signed JWT.
    """
    stmt = select(User).where(User.phone_number == req.phone)
    result = await db.execute(stmt)
    user = result.scalars().first()

    # Deliberate generic message – avoids enumeration
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid phone number or password.")

    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid phone number or password.")

    if user.role != "citizen":
        raise HTTPException(status_code=403, detail="Access denied. Not a citizen account.")

    token = create_access_token({"sub": user.id, "role": user.role})

    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id":    user.id,
            "phone": user.phone_number,
            "name":  user.name,
            "role":  user.role,
        },
    }

@router.post("/citizen/forgot-password")
async def citizen_forgot_password(req: CitizenForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Password recovery initiation endpoint.
    Safely informs the caller without user enumeration that automated SMS recovery
    is not configured in this deployment.
    """
    stmt = select(User).where(User.phone_number == req.phone)
    result = await db.execute(stmt)
    user = result.scalars().first()

    return {
        "status": "info",
        "message": "Self-service password recovery is disabled pending SMS OTP gateway configuration. Please contact your municipal administrator."
    }

@router.post("/citizen/reset-password")
async def citizen_reset_password(req: CitizenResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Direct unauthenticated password overwrite is safely disabled to prevent account takeover (CWE-640).
    A verified SMS/email OTP provider or signed recovery token must be integrated before enabling self-service resets.
    """
    raise HTTPException(
        status_code=501,
        detail="Direct password reset without verified OTP is disabled for account security. Please contact your municipal administrator."
    )


# ──────────────────────────────────────────────
# Staff credential + JWT endpoint
# ──────────────────────────────────────────────

@router.post("/staff-login")
async def staff_login(req: StaffLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Staff Portal login – credential-based authentication.
    Validates official email (or employee-ID stored in the `email` column) and
    bcrypt-hashed password against the database, then issues a signed JWT.
    """
    # Look up by email field (which stores either email address or employee-ID)
    stmt   = select(User).where(User.email == req.identifier)
    result = await db.execute(stmt)
    user   = result.scalars().first()

    # Deliberate generic message – avoids username enumeration
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials.")

    STAFF_ROLES = {"staff", "admin", "department officer", "policymaker"}
    if user.role not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail="Access denied. Not a staff account.")

    token = create_access_token({"sub": user.id, "role": user.role, "dept": user.department})

    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id":         user.id,
            "email":      user.email,
            "name":       user.name,
            "department": user.department,
            "role":       user.role,
        },
    }


# ──────────────────────────────────────────────
# Bearer Token Dependencies
# ──────────────────────────────────────────────

security = HTTPBearer(auto_error=False)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Validates the Bearer JWT and loads the user from the database."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User belonging to this token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_current_citizen(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensures the authenticated user has citizen or admin role."""
    if current_user.role not in ("citizen", "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: citizen credentials required.",
        )
STAFF_ROLES = {"staff", "admin", "department officer", "policymaker"}

async def require_staff(current_user: User = Depends(get_current_user)) -> User:
    """Permission dependency: ensures the caller has a staff-level role."""
    if current_user.role not in STAFF_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Staff privileges required.",
        )
    return current_user
