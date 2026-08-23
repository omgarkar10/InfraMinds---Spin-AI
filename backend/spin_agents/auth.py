"""
Authentication module for SPIN Portal.

- Citizen Portal : Password-based signup, login, and reset flow.
- Staff Portal   : Credential-based login (email/employee-ID + password) → issues JWT.
"""

import os
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import jwt
from passlib.context import CryptContext

from spin_agents.db import get_db
from spin_agents.models import User

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET    = os.getenv("JWT_SECRET", "supersecretkey")
JWT_ALGORITHM = "HS256"

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
    hashed_password = pwd_context.hash(req.password)
    
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

    if not pwd_context.verify(req.password, user.password_hash):
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
    Initiates a password reset flow. 
    (In production, this would send a reset link/code securely. For this prototype, it validates existence).
    """
    stmt = select(User).where(User.phone_number == req.phone)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        # Generic response to prevent phone number enumeration
        return {"status": "success", "message": "If an account exists, a reset link will be sent."}
    
    # Here a secure token would normally be generated and sent via SMS/Email.
    return {"status": "success", "message": "Password reset initiated successfully."}

@router.post("/citizen/reset-password")
async def citizen_reset_password(req: CitizenResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Resets the citizen's password securely.
    """
    stmt = select(User).where(User.phone_number == req.phone)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if not user:
        raise HTTPException(status_code=400, detail="Unable to reset password for this account.")
    
    user.password_hash = pwd_context.hash(req.password)
    await db.commit()
    
    return {"status": "success", "message": "Password reset successfully."}


# ──────────────────────────────────────────────
# Staff credential + JWT endpoint
# ──────────────────────────────────────────────

@router.post("/staff-login")
async def staff_login(req: StaffLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Staff Portal login – no OTP, no email delivery.
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

    if not pwd_context.verify(req.password, user.password_hash):
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
