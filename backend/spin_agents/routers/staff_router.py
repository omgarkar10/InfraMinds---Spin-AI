from fastapi import APIRouter, Depends, UploadFile, File
from spin_agents.auth import require_staff
from spin_agents.models import UserSchema
from spin_agents.services.exif_validator import validate_image_gps

router = APIRouter(prefix="/api/staff", tags=["Staff Portal"])

@router.get("/demands/queue")
async def get_demand_queue(user: UserSchema = Depends(require_staff)):
    """Returns demands assigned to or available for this staff member based on role & jurisdiction."""
    # Placeholder: fetch from firestore matching department/jurisdiction
    return []

@router.post("/investigation/{demand_id}/assign")
async def assign_investigation(demand_id: str, payload: dict, user: UserSchema = Depends(require_staff)):
    """Assigns a demand to a Field Officer."""
    if user.role != "Department Officer":
        return {"error": "Unauthorized"}
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
        
    return {"status": "report_submitted", "verified": True}

@router.get("/analytics/heatmaps")
async def get_heatmaps(user: UserSchema = Depends(require_staff)):
    """Policymaker strategic dashboard."""
    if user.role != "Policymaker":
        return {"error": "Unauthorized"}
    return {"data": "heatmap_data"}
