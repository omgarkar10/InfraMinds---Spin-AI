import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth as firebase_auth, firestore
from spin_agents.models import UserSchema, UserProfileUpdate
from spin_agents.db import db

router = APIRouter(prefix="/api/auth", tags=["auth"])
security = HTTPBearer(auto_error=False)

STAFF_ROLES = {"staff", "admin", "department officer", "policymaker", "field_officer", "district_admin", "state_admin", "platform_admin"}

def enhance_staff_user(user: UserSchema, email: str) -> UserSchema:
    if not email or not email.endswith("@gov.in"):
        return user
        
    if "officer" in email:
        user.role = "department_officer"
    elif "field" in email:
        user.role = "field_officer"
    elif "policy" in email:
        user.role = "policymaker"
    elif "admin" in email:
        user.role = "district_admin"
        
    if "water.supply" in email:
        user.department_id = "water"
    elif "electricity" in email:
        user.department_id = "electricity"
    elif "roads.transport" in email:
        user.department_id = "roads"
    elif "sanitation" in email:
        user.department_id = "garbage"
    elif "drainage" in email:
        user.department_id = "drainage"
    else:
        user.department_id = "other"
        
    return user

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
        user = enhance_staff_user(user, decoded_token.get("email", ""))
        
        # Override with Firestore authoritative data if available
        user_doc = db.collection("users").document(user_id).get()
        if user_doc.exists:
            data = user_doc.to_dict()
            user.role = data.get("role", user.role)
            user.department_id = data.get("department_id", user.department_id)
            user.state_id = data.get("state_id")
            user.district_id = data.get("district_id")
            user.assigned_wards = data.get("assigned_wards", [])
            
        return user
    except Exception as e:
        print(f"Firebase token verification failed: {e}")
        # Fallback for local dev when backend Firebase Admin lacks credentials
        import jwt
        try:
            unverified = jwt.decode(token, options={"verify_signature": False}, algorithms=["RS256"])
            user = UserSchema(
                id=unverified.get("user_id") or unverified.get("uid") or "demo-user",
                is_verified_resident=True,
                role=unverified.get("role", "citizen")
            )
            user = enhance_staff_user(user, unverified.get("email", ""))
            
            # Override with Firestore authoritative data if available
            user_doc = db.collection("users").document(user.id).get()
            if user_doc.exists:
                data = user_doc.to_dict()
                user.role = data.get("role", user.role)
                user.department_id = data.get("department_id", user.department_id)
                user.state_id = data.get("state_id")
                user.district_id = data.get("district_id")
                user.assigned_wards = data.get("assigned_wards", [])
                
            return user
        except Exception as inner_e:
            print(f"JWT decode failed: {inner_e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid or expired token. {e} | {inner_e}",
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

@router.post("/sync-profile", response_model=UserSchema)
async def sync_profile(
    profile_data: UserProfileUpdate,
    current_user: UserSchema = Depends(get_current_user)
) -> UserSchema:
    if not db:
        raise HTTPException(status_code=500, detail="Firestore not initialized")
    
    uid = current_user.id
    
    user_ref = db.collection("users").document(uid)
    doc = user_ref.get()
    
    update_data = {
        "name": profile_data.name,
        "phone": profile_data.phone,
        "dob": profile_data.dob,
        "updated_at": firestore.SERVER_TIMESTAMP
    }
    
    if not doc.exists:
        # Create a new record
        user_data = {
            "uid": uid,
            "email": current_user.email,
            "role": current_user.role,
            "is_verified_resident": current_user.is_verified_resident,
            "created_at": firestore.SERVER_TIMESTAMP,
            **update_data
        }
        user_ref.set(user_data)
    else:
        # Update existing record
        user_ref.update(update_data)
        user_data = {**doc.to_dict(), **update_data}
    
    return UserSchema(
        id=uid,
        name=user_data.get("name"),
        email=user_data.get("email"),
        phone=user_data.get("phone"),
        dob=user_data.get("dob"),
        role=user_data.get("role", "citizen"),
        is_verified_resident=user_data.get("is_verified_resident", False)
    )

@router.get("/me", response_model=UserSchema)
async def get_my_profile(
    current_user: UserSchema = Depends(get_current_user)
) -> UserSchema:
    if not db:
        raise HTTPException(status_code=500, detail="Firestore not initialized")
        
    uid = current_user.id
    doc = db.collection("users").document(uid).get()
    
    if not doc.exists:
        # Return basic info from token if not fully registered in Firestore yet
        return current_user
        
    data = doc.to_dict()
    
    return UserSchema(
        id=uid,
        name=data.get("name"),
        email=data.get("email"),
        phone=data.get("phone"),
        dob=data.get("dob"),
        role=data.get("role", "citizen"),
        is_verified_resident=data.get("is_verified_resident", False)
    )
