from fastapi import APIRouter, Depends
from spin_agents.auth import get_current_user, require_staff
from spin_agents.models import UserSchema
from spin_agents.schemas import CitizenMessage, PipelineRequest
from spin_agents.services.demand_service import process_citizen_webhook, process_pipeline_run, get_demands_list, cast_vote

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
):
    """List all demands (public feed)."""
    return get_demands_list(limit)

@router.post("/api/demands/{demand_id}/vote")
async def vote_for_demand(
    demand_id: str,
    current_user: UserSchema = Depends(get_current_user),
):
    """Cast a vote for a demand."""
    success = cast_vote(demand_id, current_user.id)
    return {"status": "success" if success else "already_voted"}
