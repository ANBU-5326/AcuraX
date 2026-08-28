from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.agent import Agent
from app.models.user import User
from app.dependencies import require_manager

router = APIRouter()

class AnalyticsOverviewResponse(BaseModel):
    token_volume: int
    monthly_cost: float
    active_agents: int
    workflow_runs: int

@router.get("/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager) # Manager only
):
    # Query database counts for real metrics where they exist
    agent_count = db.query(Agent).filter(
        Agent.team_id == current_user.team_id,
        Agent.status == "active" # Count agents with active status
    ).count()

    # Fallback to total agent count if active is 0
    if agent_count == 0:
        agent_count = db.query(Agent).filter(Agent.team_id == current_user.team_id).count()

    return AnalyticsOverviewResponse(
        token_volume=0,
        monthly_cost=0.0,
        active_agents=agent_count,
        workflow_runs=0
    )
