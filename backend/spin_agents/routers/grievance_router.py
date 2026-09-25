from fastapi import APIRouter, Depends
from spin_agents.auth import get_current_user, require_staff
from spin_agents.models import User
from spin_agents.schemas import CitizenMessage, PipelineRequest
from spin_agents.services.grievance_service import process_citizen_webhook, process_pipeline_run, get_grievances_list

router = APIRouter(tags=["Grievances"])

@router.post("/webhook/citizen")
async def citizen_webhook(payload: CitizenMessage):
    """Public webhook for citizen-facing channels (WhatsApp, Telegram, PWA)."""
    return await process_citizen_webhook(payload.model_dump())

@router.post("/api/pipeline/run")
async def pipeline_run(
    payload: PipelineRequest,
    current_user: User = Depends(get_current_user),
):
    """Run the 3-agent pipeline. Requires a valid auth token."""
    return await process_pipeline_run(payload.model_dump())

@router.get("/api/grievances")
async def list_grievances(
    limit: int = 50,
    current_user: User = Depends(require_staff),
):
    """List all grievances. Requires staff/admin role."""
    return await get_grievances_list(limit)
