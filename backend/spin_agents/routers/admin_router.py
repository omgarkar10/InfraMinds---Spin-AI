from fastapi import APIRouter, Depends, HTTPException
from typing import List
from spin_agents.auth import get_current_user
from spin_agents.models import UserSchema
from spin_agents.rbac import has_min_role
import firebase_admin
from firebase_admin import firestore

router = APIRouter(prefix="/api/admin", tags=["admin"])
db = firestore.client()

def require_admin(min_tier: str):
    def role_checker(user: UserSchema = Depends(get_current_user)):
        if not has_min_role(user.role, min_tier):
            raise HTTPException(status_code=403, detail="Insufficient admin privileges.")
        return user
    return role_checker

@router.get("/staff", response_model=List[dict])
async def list_district_staff(user: UserSchema = Depends(require_admin("district_admin"))):
    query = db.collection("users").where("district_id", "==", user.district_id)
    # Exclude platform admins and state admins from being listed by district admin
    # Simple workaround: fetch all and filter locally for district-level roles
    docs = query.get()
    staff = []
    for doc in docs:
        data = doc.to_dict()
        if data.get("role") in ["district_admin", "policymaker", "department_officer", "field_officer"]:
            staff.append(data)
    return staff

@router.post("/staff/invite")
async def invite_staff(payload: dict, user: UserSchema = Depends(require_admin("district_admin"))):
    target_role = payload.get("role")
    email = payload.get("email")
    dept_id = payload.get("department_id", "all")
    if not has_min_role(user.role, target_role) or target_role == user.role:
        raise HTTPException(status_code=403, detail="Cannot invite roles equal or higher to yours.")
    
    from firebase_admin import auth
    try:
        new_user = auth.create_user(
            email=email,
            password="securespin26", # Default password for invited staff
            display_name=f"Invited {target_role.replace('_', ' ').title()}"
        )
        custom_claims = {
            "role": target_role,
            "department": dept_id,
            "district_id": user.district_id
        }
        auth.set_custom_user_claims(new_user.uid, custom_claims)
        
        db.collection("users").document(new_user.uid).set({
            "uid": new_user.uid,
            "email": email,
            "name": f"Invited {target_role.replace('_', ' ').title()}",
            "role": target_role,
            "department_id": dept_id,
            "district_id": user.district_id,
            "is_verified_resident": True,
            "status": "active"
        })
        return {"status": "success", "message": f"Invited {email} as {target_role}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/metrics")
async def get_metrics(user: UserSchema = Depends(require_admin("district_admin"))):
    if not user.district_id or user.district_id == "all":
        # Handle state/platform admin viewing everything
        docs = db.collection("demands").stream()
    else:
        # Currently the mock data might not have `district` matching perfectly.
        docs = db.collection("demands").where("district", "==", user.district_id).stream()
        
    metrics = {
        "total_grievances": 0,
        "unassigned_field_surveys": 0,
        "pending_department_review": 0,
        "escalated_to_policy": 0
    }
    
    for doc in docs:
        d = doc.to_dict()
        metrics["total_grievances"] += 1
        status = d.get("status", "")
        if status in ["gathering_support", "under_review", "field_survey"]:
            if not d.get("assigned_officer_id"):
                metrics["unassigned_field_surveys"] += 1
        if status == "feasibility_reported":
            metrics["pending_department_review"] += 1
        if status == "escalated_to_policy":
            metrics["escalated_to_policy"] += 1
            
    return {
        "district": user.district_id or "All",
        "metrics": metrics
    }

@router.patch("/staff/{uid}")
async def update_staff(uid: str, payload: dict, user: UserSchema = Depends(require_admin("district_admin"))):
    doc_ref = db.collection("users").document(uid)
    doc = doc_ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Staff not found")
    data = doc.to_dict()
    if data.get("district_id") != user.district_id and not has_min_role(user.role, "state_admin"):
        raise HTTPException(status_code=403, detail="Cross-district edits not allowed")
    
    update_data = {}
    if "department_id" in payload: update_data["department_id"] = payload["department_id"]
    if "role" in payload:
        if not has_min_role(user.role, payload["role"]):
            raise HTTPException(status_code=403, detail="Cannot elevate to this role.")
        update_data["role"] = payload["role"]
    if "assigned_wards" in payload: update_data["assigned_wards"] = payload["assigned_wards"]
    
    if update_data:
        doc_ref.update(update_data)
    return {"status": "success"}

@router.delete("/staff/{uid}")
async def deactivate_staff(uid: str, user: UserSchema = Depends(require_admin("district_admin"))):
    doc_ref = db.collection("users").document(uid)
    doc_ref.update({"status": "suspended"})
    return {"status": "suspended"}

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
            password="securespin26",
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
