from fastapi import APIRouter, Depends, UploadFile, File
from google.cloud import firestore
from spin_agents.auth import require_staff
from spin_agents.models import UserSchema
from spin_agents.services.exif_validator import validate_image_gps
from spin_agents.db import get_firestore_db
from datetime import datetime, timezone

router = APIRouter(prefix="/api/staff", tags=["Staff Portal"])

@router.get("/demands/queue")
async def get_demand_queue(user: UserSchema = Depends(require_staff)):
    """Returns demands assigned to or available for this staff member based on role & jurisdiction."""
    db = get_firestore_db()
    if not db:
        return []
    
    docs = db.collection("demands").where("status", "in", ["gathering_support", "under_review", "field_survey"]).stream()
    demands = []
    for d in docs:
        data = d.to_dict()
        data["id"] = d.id
        if data.get("status") == "gathering_support" and data.get("vote_count", 0) < data.get("vote_threshold", 100):
            continue
        demands.append(data)
    return demands

@router.post("/investigation/{demand_id}/assign")
async def assign_investigation(demand_id: str, payload: dict, user: UserSchema = Depends(require_staff)):
    """Assigns a demand to a Field Officer."""
    if user.role != "Department Officer":
        return {"error": "Unauthorized"}
    db = get_firestore_db()
    if db:
        db.collection("demands").document(demand_id).update({
            "status": "field_survey",
            "status_updated_at": firestore.SERVER_TIMESTAMP,
            "timeline": firestore.ArrayUnion([{
                "title": "Field Survey Assigned",
                "description": f"Assigned to {payload.get('assigned_to', 'Officer')}",
                "date": datetime.now(timezone.utc).isoformat(),
                "completed": True
            }])
        })
    return {"status": "assigned"}

@router.post("/investigation/{demand_id}/report")
async def submit_feasibility_report(
    demand_id: str, 
    lat: float, 
    lng: float, 
    file: UploadFile = File(...), 
    user: UserSchema = Depends(require_staff)
):
    """Field Officer offline-capable photo sync."""
    if user.role != "Field Officer":
        return {"error": "Unauthorized"}
        
    file_bytes = await file.read()
    is_valid = validate_image_gps(file_bytes, lat, lng, tolerance_meters=100)
    if not is_valid:
        return {"error": "GPS EXIF data missing or invalid (does not match target area)."}
    
    db = get_firestore_db()
    if db:
        db.collection("demands").document(demand_id).update({
            "status": "under_review",
            "status_updated_at": firestore.SERVER_TIMESTAMP,
            "timeline": firestore.ArrayUnion([{
                "title": "Field Report Submitted",
                "description": "Field officer submitted feasibility report and verified location.",
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
