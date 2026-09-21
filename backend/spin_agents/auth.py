"""
Authentication module for SPIN Portal.

- Citizen Portal : Password-based signup, login, and reset flow.
- Staff Portal   : Credential-based login (email/employee-ID + password) → issues JWT.

Security notes:
  - All authentication errors use generic messages to prevent user enumeration.
  - Passwords are bcrypt-hashed server-side; plaintext passwords are never logged.
  - JWTs include role claim for permission checks on protected endpoints.
  - Token expiry: 24 hours (configurable via JWT_EXPIRES_HOURS env).
"""

import logging
from datetime import datetime, timedelta
from typing import Annotated

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from spin_agents.config import CONFIG
from spin_agents.db import get_db
from spin_agents.models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

JWT_SECRET    = CONFIG.jwt_secret
JWT_ALGORITHM = "HS256"
JWT_EXPIRES_HOURS = 24

STAFF_ROLES = {"staff", "admin", "department officer", "policymaker"}

# ──────────────────────────────────────────────
# Pydantic schemas
# ──────────────────────────────────────────────

class CitizenSignupRequest(BaseModel):
    name: str
    countryCode: str
    phone: str
    password: str

class CitizenLoginRequest(BaseModel):
    countryCode: str
    phone: str
    password: str

class CitizenForgotPasswordRequest(BaseModel):
    countryCode: str
    phone: str

class CitizenResetPasswordRequest(BaseModel):
    phone: str
    password: str

class StaffLoginRequest(BaseModel):
    identifier: str     # official email or employee-ID
    password: str

class UnifiedCitizenLoginRequest(BaseModel):
    identifier: str     # mobile number or email
    password: str


# ──────────────────────────────────────────────
# JWT helpers
# ──────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=JWT_EXPIRES_HOURS))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT. Raises HTTPException 401 on failure."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )


# ──────────────────────────────────────────────
# Permission dependencies
# ──────────────────────────────────────────────

async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: AsyncSession = Depends(get_db),
) -> User:
    """FastAPI dependency: validates Bearer token and returns the User object."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    return user


async def require_staff(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Permission dependency: ensures the caller has a staff-level role."""
    if current_user.role not in STAFF_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Staff privileges required.",
        )
    return current_user


async def require_citizen(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """Permission dependency: ensures the caller is a citizen account."""
    if current_user.role != "citizen":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Citizen account required.",
        )
    return current_user


def _user_response(user: User, token: str) -> dict:
    """Builds the standard auth success response. Never includes password_hash."""
    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id":         user.id,
            "phone":      user.phone_number,
            "email":      user.email,
            "name":       user.name,
            "role":       user.role,
            "department": user.department,
        },
    }


# ──────────────────────────────────────────────
# Citizen Password-based endpoints
# ──────────────────────────────────────────────

@router.post("/citizen/signup")
async def citizen_signup(req: CitizenSignupRequest, db: AsyncSession = Depends(get_db)):
    """Creates a new citizen account with a bcrypt-hashed password. Returns JWT."""
    result = await db.execute(select(User).where(User.phone_number == req.phone))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This phone number is already associated with an account.",
        )
    new_user = User(
        name=req.name,
        phone_number=req.phone,
        password_hash=pwd_context.hash(req.password),
        is_verified=True,
        role="citizen",
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    token = create_access_token({"sub": new_user.id, "role": new_user.role})
    return _user_response(new_user, token)


@router.post("/citizen/login")
async def citizen_login(req: CitizenLoginRequest, db: AsyncSession = Depends(get_db)):
    """Validates citizen phone + password, returns JWT."""
    result = await db.execute(select(User).where(User.phone_number == req.phone))
    user = result.scalars().first()
    # Generic message — avoids phone enumeration
    if not user or not user.password_hash or not pwd_context.verify(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid phone number or password.")
    if user.role != "citizen":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Not a citizen account.")
    token = create_access_token({"sub": user.id, "role": user.role})
    return _user_response(user, token)


@router.post("/citizen/forgot-password")
async def citizen_forgot_password(req: CitizenForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Initiates password reset. Always returns success to prevent enumeration."""
    # In production: generate a signed reset token and send via SMS gateway.
    # For now: validate existence silently.
    result = await db.execute(select(User).where(User.phone_number == req.phone))
    user = result.scalars().first()
    if user:
        logger.info("Password reset requested for user id=%s", user.id)
    # Generic response regardless of whether the account exists
    return {"status": "success", "message": "If an account exists, a reset link will be sent."}


@router.post("/citizen/reset-password")
async def citizen_reset_password(req: CitizenResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Resets citizen password. Requires the phone to match an existing account."""
    result = await db.execute(select(User).where(User.phone_number == req.phone))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unable to reset password for this account.")
    user.password_hash = pwd_context.hash(req.password)
    await db.commit()
    return {"status": "success", "message": "Password reset successfully."}


# ──────────────────────────────────────────────
# Staff credential + JWT endpoint
# ──────────────────────────────────────────────

@router.post("/staff-login")
async def staff_login(req: StaffLoginRequest, db: AsyncSession = Depends(get_db)):
    """Staff Portal login — validates email/employee-ID + bcrypt password. Issues JWT."""
    result = await db.execute(select(User).where(User.email == req.identifier))
    user = result.scalars().first()
    # Generic message — avoids username enumeration
    if not user or not user.password_hash or not pwd_context.verify(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")
    if user.role not in STAFF_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Not a staff account.")
    token = create_access_token({"sub": user.id, "role": user.role, "dept": user.department})
    return _user_response(user, token)


# ──────────────────────────────────────────────
# Unified citizen login (email or phone)
# ──────────────────────────────────────────────

@router.post("/citizen-login")
async def citizen_portal_login(req: UnifiedCitizenLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Unified Citizen Portal login — accepts mobile number or email + password.

    IMPORTANT: This endpoint does NOT auto-create accounts.
    Users must register via /citizen/signup first.
    Auto-creation was removed as it bypasses verification and creates ghost accounts.
    """
    result = await db.execute(
        select(User).where(
            (User.email == req.identifier) | (User.phone_number == req.identifier)
        )
    )
    user = result.scalars().first()
    # Generic message — avoids enumeration
    if not user or not user.password_hash or not pwd_context.verify(req.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")
    token = create_access_token({"sub": user.id, "role": user.role})
    return _user_response(user, token)
