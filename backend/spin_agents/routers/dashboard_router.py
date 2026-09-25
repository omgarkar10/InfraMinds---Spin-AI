from fastapi import APIRouter, Depends
from spin_agents.auth import require_staff
from spin_agents.models import User
from spin_agents.schemas import PolicyAction
from spin_agents.services.dashboard_service import get_dashboard_summary, get_dashboard_red_zones, execute_policy_action

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/summary")
async def dashboard_summary(
    district: str | None = None,
    current_user: User = Depends(require_staff),
):
    """Returns weekly complaint summary. Requires staff/admin role."""
    return await get_dashboard_summary(district)

@router.get("/red-zones")
async def dashboard_red_zones(
    min_severity: int = 8,
    current_user: User = Depends(require_staff),
):
    """Returns active red-zone clusters. Requires staff/admin role."""
    return await get_dashboard_red_zones(min_severity)

@router.post("/policy-action")
async def policy_action(
    action: PolicyAction,
    current_user: User = Depends(require_staff),
):
    """Execute a policy action. Requires staff/admin role."""
    return await execute_policy_action(action)
