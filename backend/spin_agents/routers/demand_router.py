from typing import Optional
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
import time
from firebase_admin import storage
from spin_agents.auth import get_current_user, require_staff
from spin_agents.models import UserSchema
from spin_agents.schemas import CitizenMessage, PipelineRequest
from spin_agents.services.demand_service import process_citizen_webhook, process_pipeline_run, get_demands_list, cast_vote, get_demand_by_id, get_user_votes

router = APIRouter(tags=["Demands"])

@router.post("/webhook/citizen")
async def citizen_webhook(payload: CitizenMessage):
    """Public webhook for citizen-facing channels (WhatsApp, Telegram, PWA)."""
    return await process_citizen_webhook(payload.model_dump())

@router.post("/api/pipeline/run")
async def pipeline_run(
    payload: PipelineRequest,
    current_user: UserSchema = Depends(get_current_user),
):
    """Run the 3-agent pipeline. Requires a valid auth token."""
    return await process_pipeline_run(payload.model_dump())

@router.get("/api/demands")
async def list_demands(
    limit: int = 50,
    author_user_id: Optional[str] = None
):
    """List all demands (public feed)."""
    return get_demands_list(limit, author_user_id)

@router.get("/api/demands/{demand_id}")
async def get_single_demand(demand_id: str):
    """Get a single demand detail."""
    demand = get_demand_by_id(demand_id)
    if not demand:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Demand not found")
    return demand

@router.post("/api/demands/{demand_id}/vote")
async def vote_for_demand(
    demand_id: str,
    current_user: UserSchema = Depends(get_current_user),
):
    """Cast a vote for a demand."""
    success = cast_vote(demand_id, current_user.id)
    return {"status": "success" if success else "already_voted"}

@router.get("/api/users/me/votes")
async def my_votes(
    current_user: UserSchema = Depends(get_current_user),
):
    """Get list of demand IDs the user has voted for."""
    return {"voted_demand_ids": get_user_votes(current_user.id)}

@router.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: UserSchema = Depends(get_current_user)
):
    """Upload evidence to local storage for hackathon demo."""
    import os
    try:
        os.makedirs("uploads", exist_ok=True)
        local_path = f"uploads/{int(time.time())}_{file.filename.replace(' ', '_')}"
        
        file.file.seek(0)
        with open(local_path, "wb") as f:
            f.write(file.file.read())
            
        # Return a localhost URL that will be served by the StaticFiles mount in api.py
        # Ensure it works in dev server by pointing to the uvicorn host
        return {"url": f"http://localhost:8080/{local_path}", "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
