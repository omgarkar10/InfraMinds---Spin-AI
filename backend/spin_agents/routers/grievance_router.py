from fastapi import APIRouter
from spin_agents.schemas import CitizenMessage, PipelineRequest
from spin_agents.services.grievance_service import process_citizen_webhook, process_pipeline_run, get_grievances_list

router = APIRouter(tags=["Grievances"])

@router.post("/webhook/citizen")
async def citizen_webhook(payload: CitizenMessage):
    return await process_citizen_webhook(payload.model_dump())

@router.post("/api/pipeline/run")
async def pipeline_run(payload: PipelineRequest):
    return await process_pipeline_run(payload.model_dump())

@router.get("/api/grievances")
async def list_grievances(limit: int = 50):
    return await get_grievances_list(limit)
