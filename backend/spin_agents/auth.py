"""
Authentication module for SPIN Portal.

- Citizen Portal : Password-based signup, login, and reset flow.
- Staff Portal   : Credential-based login (email/employee-ID + password) → issues JWT.
"""

import os
import uuid
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

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=24))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


# ──────────────────────────────────────────────
# Citizen Password-based endpoints
# ──────────────────────────────────────────────

@router.post("/citizen/signup")
async def citizen_signup(req: CitizenSignupRequest, db: AsyncSession = Depends(get_db)):
    """
    Creates a new citizen account with a hashed password.
    Returns a JWT upon successful creation.
    """
    # 1. Normalize phone if needed (frontend typically sends normalized format, but backend can enforce E.164 if configured)
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
    return current_user


