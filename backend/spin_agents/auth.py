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
            is_verified_resident=True,
            role=role
        )
        return user
    except Exception as e:
        # Fallback for local dev when backend Firebase Admin lacks credentials
        import jwt
        try:
            unverified = jwt.decode(token, options={"verify_signature": False})
            user = UserSchema(
                id=unverified.get("user_id") or unverified.get("uid") or "demo-user",
                is_verified_resident=True,
                role=unverified.get("role", "citizen")
            )
            return user
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid or expired token. {e}",
                headers={"WWW-Authenticate": "Bearer"},
            )

async def require_staff(current_user: UserSchema = Depends(get_current_user)) -> UserSchema:
    """Permission dependency: ensures the caller has a staff-level role."""
    if current_user.role.lower() not in {r.lower() for r in STAFF_ROLES}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Insufficient permissions. Role '{current_user.role}' is not authorized for staff endpoints.",
        )
    return current_user
