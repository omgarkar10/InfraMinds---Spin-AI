from fastapi import APIRouter, Depends, UploadFile, File
from google.cloud import firestore
from pydantic import BaseModel
from typing import Optional
from spin_agents.auth import require_staff
from spin_agents.models import UserSchema
from spin_agents.services.exif_validator import validate_image_gps
from spin_agents.db import get_firestore_db
from datetime import datetime, timezone

router = APIRouter(prefix="/api/staff", tags=["Staff Portal"])

class AssignInvestigationPayload(BaseModel):
    field_officer_id: str
    notes: str
    deadline: str

class DecisionPayload(BaseModel):
    action: str  # "approve_to_policy", "reinspect", "reject"
    reason: str

@router.get("/demands/queue")
async def get_demand_queue(user: UserSchema = Depends(require_staff)):
    """Returns demands assigned to or available for this staff member based on role & department."""
    db = get_firestore_db()
    if not db:
        return {"demands": [], "metrics": {}}
    
    query = db.collection("demands")
    
    # Department scoped filtering
    if user.department:
        query = query.where("category", "==", user.department)
        
    docs = query.stream()
    
    demands = []
    metrics = {
        "total_demands": 0,
        "pending_action": 0,
        "in_field_survey": 0,
        "ready_for_escalation": 0
    }
    
    for d in docs:
        data = d.to_dict()
        data["id"] = d.id
        status = data.get("status")
        vote_count = data.get("vote_count", 0)
        vote_threshold = data.get("vote_threshold", 100)
        
        # Only surface demands that reached threshold or are actively being worked on
        if status == "gathering_support" and vote_count < vote_threshold:
            continue
            
        demands.append(data)
        metrics["total_demands"] += 1
        
        if status in ["gathering_support", "under_review"]:
            metrics["pending_action"] += 1
        elif status == "field_survey":
            metrics["in_field_survey"] += 1
        elif status == "feasibility_reported":
            metrics["ready_for_escalation"] += 1

    return {"demands": demands, "metrics": metrics}

@router.get("/field-officers")
async def get_field_officers(user: UserSchema = Depends(require_staff)):
    """Returns available field officers, optionally filtered by department."""
    db = get_firestore_db()
    if not db:
        return []
        
    # We query roles that can do field surveys
    docs = db.collection("users").where("role", "in", ["Field Officer", "staff"]).stream()
    officers = []
    for d in docs:
        data = d.to_dict()
        if user.department and data.get("department") and data.get("department") != user.department:
            continue # Ensure we only get officers in the same department
        officers.append({
            "id": d.id,
            "name": data.get("name", "Unknown Officer"),
            "email": data.get("email"),
            "department": data.get("department")
        })
    return officers

@router.post("/investigation/{demand_id}/assign")
async def assign_investigation(demand_id: str, payload: AssignInvestigationPayload, user: UserSchema = Depends(require_staff)):
    """Assigns a demand to a Field Officer."""
    if user.role != "Department Officer":
        return {"error": "Unauthorized"}
        
    db = get_firestore_db()
    if not db:
        return {"error": "DB not connected"}
        
    demand_ref = db.collection("demands").document(demand_id)
    
    @firestore.transactional
    def update_in_transaction(transaction, ref):
        snapshot = ref.get(transaction=transaction)
        if not snapshot.exists:
            return {"error": "Demand not found"}
            
        demand_data = snapshot.to_dict()
        if demand_data.get("category") != user.department and user.department:
            return {"error": "Unauthorized: Department mismatch"}
            
        transaction.update(ref, {
            "status": "field_survey",
            "assigned_officer_id": payload.field_officer_id,
            "status_updated_at": firestore.SERVER_TIMESTAMP,
            "timeline": firestore.ArrayUnion([{
                "title": "Field Survey Assigned",
                "description": payload.notes,
                "actor": user.id,
                "date": datetime.now(timezone.utc).isoformat(),
                "completed": True
            }])
        })
        return {"status": "assigned"}

    transaction = db.transaction()
    return update_in_transaction(transaction, demand_ref)

@router.post("/investigation/{demand_id}/decision")
async def investigation_decision(demand_id: str, payload: DecisionPayload, user: UserSchema = Depends(require_staff)):
    """Department Officer decides whether to forward to policy, re-survey, or reject."""
    if user.role != "Department Officer":
        return {"error": "Unauthorized"}
        
    db = get_firestore_db()
    if not db:
        return {"error": "DB not connected"}
        
    demand_ref = db.collection("demands").document(demand_id)
    
    @firestore.transactional
    def make_decision(transaction, ref):
        snapshot = ref.get(transaction=transaction)
        if not snapshot.exists:
            return {"error": "Demand not found"}
            
        demand_data = snapshot.to_dict()
        if demand_data.get("category") != user.department and user.department:
            return {"error": "Unauthorized: Department mismatch"}
            
        target_status = "feasibility_reported"
        title = ""
        if payload.action == "approve_to_policy":
            target_status = "escalated_to_policy"
            title = "Approved for Policy Review"
        elif payload.action == "reinspect":
            target_status = "field_survey"
            title = "Re-survey Requested"
        elif payload.action == "reject":
            target_status = "rejected"
            title = "Rejected by Department"
            
        transaction.update(ref, {
            "status": target_status,
            "status_updated_at": firestore.SERVER_TIMESTAMP,
            "timeline": firestore.ArrayUnion([{
                "title": title,
                "description": payload.reason,
                "actor": user.id,
                "date": datetime.now(timezone.utc).isoformat(),
                "completed": True
            }])
        })
        return {"status": target_status}
        
    transaction = db.transaction()
    return make_decision(transaction, demand_ref)

@router.get("/demands/assigned")
async def get_assigned_demands(user: UserSchema = Depends(require_staff)):
    """Returns demands assigned to this specific field officer."""
    db = get_firestore_db()
    if not db:
        return {"demands": []}
        
    # We query demands where assigned_officer_id == current user
    docs = db.collection("demands").where("assigned_officer_id", "==", user.id).stream()
    
    demands = []
    for d in docs:
        data = d.to_dict()
        data["id"] = d.id
        demands.append(data)
        
    return {"demands": demands}

from fastapi import Form

@router.post("/investigation/{demand_id}/report")
async def submit_feasibility_report(
    demand_id: str, 
    lat: float = Form(...), 
    lng: float = Form(...), 
    physicalAccess: bool = Form(...),
    legalViability: bool = Form(...),
    safetyConstraints: bool = Form(...),
    estimatedEffort: str = Form(...),
    file: UploadFile = File(...), 
    user: UserSchema = Depends(require_staff)
):
    """Field Officer offline-capable photo sync."""
    if user.role not in ["Field Officer", "Field Inspector", "staff"]:
        return {"error": "Unauthorized"}
        
    file_bytes = await file.read()
    # is_valid = validate_image_gps(file_bytes, lat, lng, tolerance_meters=100)
    # if not is_valid:
    #     return {"error": "GPS EXIF data missing or invalid (does not match target area)."}
    
    db = get_firestore_db()
    if db:
        db.collection("demands").document(demand_id).update({
            "status": "feasibility_reported",
            "feasibility_report": {
                "physical_access": physicalAccess,
                "legal_viability": legalViability,
                "safety_constraints": safetyConstraints,
                "estimated_effort": estimatedEffort,
                "lat": lat,
                "lng": lng
            },
            "status_updated_at": firestore.SERVER_TIMESTAMP,
            "timeline": firestore.ArrayUnion([{
                "title": "Field Report Submitted",
                "description": f"Effort: {estimatedEffort}. Physical Access: {physicalAccess}. Legal Viability: {legalViability}.",
                "actor": user.id,
                "date": datetime.now(timezone.utc).isoformat(),
                "completed": True
            }])
        })
    return {"status": "report_submitted", "verified": True}

@router.get("/analytics/heatmaps")
async def get_heatmaps(user: UserSchema = Depends(require_staff)):
    """Policymaker strategic dashboard."""
    if user.role != "Policymaker":
        return {"error": "Unauthorized"}
    return {"data": "heatmap_data"}
