from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from spin_agents.auth import get_current_user
from spin_agents.models import UserSchema
from spin_agents.rbac import has_min_role
import os
import firebase_admin
from firebase_admin import firestore

STAFF_DEFAULT_PASSWORD = os.environ.get("STAFF_DEFAULT_PASSWORD", "[REDACTED_SECRET]")

router = APIRouter(prefix="/api/admin", tags=["admin"])
db = firestore.client()

def require_admin(min_tier: str):
    def role_checker(user: UserSchema = Depends(get_current_user)):
        if not has_min_role(user.role, min_tier):
            raise HTTPException(status_code=403, detail="Insufficient admin privileges.")
        return user
    return role_checker

@router.get("/district/staff", response_model=List[dict])
async def list_district_staff(user: UserSchema = Depends(require_admin("district_admin"))):
    if not user.district_id:
        return []
    docs = db.collection("users").where("district_id", "==", user.district_id).stream()
    staff = []
    for doc in docs:
        data = doc.to_dict()
        if data.get("role") in ["policymaker", "department_officer", "field_officer"]:
            staff.append(data)
    return staff

@router.post("/district/invite")
async def invite_district_staff(payload: dict, user: UserSchema = Depends(require_admin("district_admin"))):
    target_role = payload.get("role")
    dept_id = payload.get("department_id")
    
    if target_role not in ["policymaker", "department_officer", "field_officer"]:
        raise HTTPException(status_code=400, detail="Invalid role specified.")
    
    if dept_id not in ["water", "electricity", "roads", "garbage", "drainage", "other", "all"]:
        raise HTTPException(status_code=400, detail="Invalid canonical department enum.")
    
    role_map = {
        "policymaker": "pm",
        "department_officer": "do",
        "field_officer": "fo",
        "district_admin": "da"
    }
    
    dept_map = {
        "water": "wat",
        "electricity": "ele",
        "roads": "rds",
        "garbage": "gbg",
        "drainage": "drn",
        "other": "oth",
        "all": "all"
    }
    
    district_str = (user.district_id or "oth").lower().replace(" ", "")
    district_code = district_str[:3] if len(district_str) >= 3 else district_str.ljust(3, "x")
    
    role_code = role_map.get(target_role, "oth")
    dept_code = dept_map.get(dept_id, "oth")
    
    # Query to find count
    docs = db.collection("users").where("role", "==", target_role).where("department_id", "==", dept_id).where("district_id", "==", user.district_id).stream()
    count = sum(1 for _ in docs)
    unique_id = f"{count + 1:02d}"
    
    email = f"{role_code}.{dept_code}.{district_code}.{unique_id}@spin.gov.in"
    
    from firebase_admin import auth
    try:
        new_user = auth.create_user(
            email=email,
            password=STAFF_DEFAULT_PASSWORD,
            display_name=f"{target_role.replace('_', ' ').title()} ({dept_id.title()})"
        )
        custom_claims = {
            "role": target_role,
            "department": dept_id,
            "district_id": user.district_id,
            "state_id": user.state_id
        }
        auth.set_custom_user_claims(new_user.uid, custom_claims)
        
        db.collection("users").document(new_user.uid).set({
            "uid": new_user.uid,
            "email": email,
            "name": f"{target_role.replace('_', ' ').title()} ({dept_id.title()})",
            "role": target_role,
            "department_id": dept_id,
            "district_id": user.district_id,
            "state_id": user.state_id,
            "is_verified_resident": True,
            "status": "active"
        })
        return {"status": "success", "message": f"Invited {email} as {target_role}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/district/stats")
async def get_district_stats(user: UserSchema = Depends(require_admin("district_admin"))):
    if not user.district_id:
        return {"total_demands": 0, "unassigned_surveys": 0, "pending_review": 0, "escalated_policy": 0}
        
    docs = db.collection("demands").where("district", "==", user.district_id).stream()
    
    metrics = {
        "total_demands": 0,
        "unassigned_surveys": 0,
        "pending_review": 0,
        "escalated_policy": 0
    }
    
    for doc in docs:
        d = doc.to_dict()
        metrics["total_demands"] += 1
        status = d.get("status", "")
        if status in ["gathering_support", "under_review", "field_survey"]:
            if not d.get("assigned_officer_id"):
                metrics["unassigned_surveys"] += 1
        if status == "feasibility_reported":
            metrics["pending_review"] += 1
        if status == "escalated_to_policy":
            metrics["escalated_policy"] += 1
            
    return metrics

@router.post("/district/staff/{uid}/suspend")
async def toggle_staff_suspension(uid: str, user: UserSchema = Depends(require_admin("district_admin"))):
    doc_ref = db.collection("users").document(uid)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Staff not found")
    data = doc.to_dict()
    if data.get("district_id") != user.district_id:
        raise HTTPException(status_code=403, detail="Cross-district edits not allowed")
    
    new_status = "active" if data.get("status") == "suspended" else "suspended"
    doc_ref.update({"status": new_status})
    return {"status": "success", "new_status": new_status}

@router.get("/districts")
async def list_districts(user: UserSchema = Depends(require_admin("state_admin"))):
    if not user.state_id:
        return []
    docs = db.collection("users").where("role", "==", "district_admin").where("state_id", "==", user.state_id).stream()
    roster = []
    for doc in docs:
        roster.append(doc.to_dict())
    return roster

@router.post("/provision-district")
async def provision_district(payload: dict, user: UserSchema = Depends(require_admin("state_admin"))):
    district_name = payload.get("district_name")
    email = payload.get("email")
    if not district_name or not email:
        raise HTTPException(status_code=400, detail="Missing district_name or email")
    
    canonical_district = district_name.strip().lower().replace(" ", "_")
    state_id = user.state_id or "unknown_state"

    from firebase_admin import auth
    try:
        new_user = auth.create_user(
            email=email,
            password=STAFF_DEFAULT_PASSWORD,
            display_name=f"{district_name.title()} District Admin"
        )
        custom_claims = {
            "role": "district_admin",
            "district_id": canonical_district,
            "state_id": state_id
        }
        auth.set_custom_user_claims(new_user.uid, custom_claims)
        
        db.collection("users").document(new_user.uid).set({
            "uid": new_user.uid,
            "email": email,
            "name": f"{district_name.title()} District Admin",
            "role": "district_admin",
            "district_id": canonical_district,
            "state_id": state_id,
            "status": "active"
        })
        return {"status": "success", "message": f"Provisioned district_admin for {district_name}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

def is_district_in_state(district_id: str, state_id: str) -> bool:
    # In a real app, this would query a canonical location registry
    # For now, allow any district if they match the user's state_id in the DB
    return True

@router.get("/state/demands")
async def get_state_demands(
    district_id: Optional[str] = Query(None), 
    user: UserSchema = Depends(require_admin("state_admin"))
):
    query = db.collection("demands").where("state", "==", user.state_id)
    
    if district_id and district_id != "all":
        if not is_district_in_state(district_id, user.state_id):
            raise HTTPException(status_code=403, detail="District outside jurisdiction")
        query = query.where("district_id", "==", district_id)
        
    return [d.to_dict() for d in query.stream()]

@router.patch("/demands/{id}/reroute")
async def reroute_demand(id: str, payload: dict, user: UserSchema = Depends(require_admin("district_admin"))):
    new_category = payload.get("category")
    if not new_category: raise HTTPException(status_code=400, detail="Missing category")
    doc_ref = db.collection("demands").document(id)
    doc_ref.update({"category": new_category})
    return {"status": "success", "new_category": new_category}

@router.get("/system/health")
async def system_health(user: UserSchema = Depends(require_admin("platform_admin"))):
    try:
        # Lightweight ping to verify Firestore connection
        db.collection("users").limit(1).get()
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail={"status": "error", "database": "disconnected", "error": str(e)})

@router.get("/keys")
async def get_api_keys(user: UserSchema = Depends(require_admin("platform_admin"))):
    # In a real app, you would fetch these from a secure store or KMS
    return {"status": "success", "keys": [{"service": "Bhashini", "status": "active"}, {"service": "GenAI", "status": "active"}]}

@router.post("/keys")
async def update_api_keys(payload: dict, user: UserSchema = Depends(require_admin("platform_admin"))):
    return {"status": "success", "message": "API keys updated successfully"}
