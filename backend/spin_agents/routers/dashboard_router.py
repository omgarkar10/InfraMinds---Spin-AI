from fastapi import APIRouter
from spin_agents.schemas import PolicyAction
from spin_agents.services.dashboard_service import get_dashboard_summary, get_dashboard_red_zones, execute_policy_action

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary")
async def dashboard_summary(district: str | None = None):
    return await get_dashboard_summary(district)

@router.get("/red-zones")
async def dashboard_red_zones(min_severity: int = 8):
    return await get_dashboard_red_zones(min_severity)

@router.post("/policy-action")
async def policy_action(action: PolicyAction):
    return await execute_policy_action(action)
