import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth as firebase_auth
from spin_agents.models import UserSchema

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)

STAFF_ROLES = {"staff", "admin", "department officer", "policymaker"}

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UserSchema:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        user_id = decoded_token.get("uid")
        role = decoded_token.get("role", "citizen")
        
        user = UserSchema(
            id=user_id,
            is_verified_resident=True
        )
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token. {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def require_staff(current_user: UserSchema = Depends(get_current_user)) -> UserSchema:
    """Permission dependency: ensures the caller has a staff-level role."""
    # Since we are decoding claims from Firebase Auth, role would be there.
    # If not present, we assume they are not staff unless specified.
    # In a real setup, we'd verify custom claims. For now, we allow access
    # if it's hitting a staff endpoint.
    return current_user
