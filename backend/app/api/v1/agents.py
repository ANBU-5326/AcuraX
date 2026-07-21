import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.agent import Agent, AgentRun
from app.models.user import User
from app.schemas.agent import AgentResponse, AgentCreate, AgentUpdate, AgentRunResponse
from app.dependencies import get_current_user, require_manager

router = APIRouter()

@router.get("", response_model=List[AgentResponse])
def list_agents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Agent).filter(Agent.team_id == current_user.team_id)
    if current_user.role == "employee":
        query = query.filter(Agent.is_shared_with_team == True)
    
    return query.all()

@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
def create_agent(
    agent_in: AgentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager) # Manager only
):
    colors = [
        "from-indigo-600 to-violet-600",
        "from-emerald-500 to-teal-600",
        "from-amber-500 to-orange-500",
        "from-pink-500 to-rose-600",
        "from-blue-600 to-cyan-500"
    ]
    import random
    random_color = agent_in.avatar_color or random.choice(colors)

    new_agent = Agent(
        team_id=current_user.team_id,
        name=agent_in.name,
        description=agent_in.description,
        trigger_type=agent_in.trigger_type,
        schedule_cron=agent_in.schedule_cron,
        status="idle",
        is_shared_with_team=agent_in.is_shared_with_team,
        created_by=current_user.id,
        model=agent_in.model,
        temperature=agent_in.temperature,
        system_prompt=agent_in.system_prompt,
        tools=agent_in.tools or [],
        tokens_used=0,
        avatar_color=random_color
    )
    db.add(new_agent)
    db.commit()
    db.refresh(new_agent)
    return new_agent

@router.patch("/{id}", response_model=AgentResponse)
def update_agent(
    id: str,
    agent_in: AgentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager) # Manager only
):
    agent = db.query(Agent).filter(Agent.id == id, Agent.team_id == current_user.team_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")

    if agent_in.name is not None:
        agent.name = agent_in.name
    if agent_in.description is not None:
        agent.description = agent_in.description
    if agent_in.trigger_type is not None:
        agent.trigger_type = agent_in.trigger_type
    if agent_in.schedule_cron is not None:
        agent.schedule_cron = agent_in.schedule_cron
    if agent_in.status is not None:
        agent.status = agent_in.status
    if agent_in.is_shared_with_team is not None:
        agent.is_shared_with_team = agent_in.is_shared_with_team
    if agent_in.model is not None:
        agent.model = agent_in.model
    if agent_in.temperature is not None:
        agent.temperature = agent_in.temperature
    if agent_in.system_prompt is not None:
        agent.system_prompt = agent_in.system_prompt
    if agent_in.tools is not None:
        agent.tools = agent_in.tools
    if agent_in.tokens_used is not None:
        agent.tokens_used = agent_in.tokens_used
    if agent_in.avatar_color is not None:
        agent.avatar_color = agent_in.avatar_color

    db.add(agent)
    db.commit()
    db.refresh(agent)
    return agent

@router.delete("/{id}")
def delete_agent(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager) # Manager only
):
    agent = db.query(Agent).filter(Agent.id == id, Agent.team_id == current_user.team_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")

    db.delete(agent)
    db.commit()
    return {"detail": "Agent deleted successfully."}

@router.post("/{id}/run", response_model=AgentRunResponse)
def run_agent(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify agent exists in team
    agent = db.query(Agent).filter(Agent.id == id, Agent.team_id == current_user.team_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")

    # Employees can only run shared agents
    if current_user.role == "employee" and not agent.is_shared_with_team:
        raise HTTPException(status_code=403, detail="Access denied to this agent.")

    # Create run placeholder
    new_run = AgentRun(
        agent_id=agent.id,
        triggered_by=current_user.id,
        status="completed", # Immediately finished successfully for this stage
        started_at=datetime.now(timezone.utc),
        completed_at=datetime.now(timezone.utc),
        result_summary="Placeholder result — AI execution not yet implemented"
    )
    
    # Increment dummy token usage to show updates in dashboard
    import random
    added_tokens = random.randint(1500, 4500)
    agent.tokens_used += added_tokens
    
    db.add(new_run)
    db.add(agent)
    db.commit()
    db.refresh(new_run)
    return new_run

@router.get("/{id}/runs", response_model=List[AgentRunResponse])
def get_agent_runs(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify agent exists in team
    agent = db.query(Agent).filter(Agent.id == id, Agent.team_id == current_user.team_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found.")

    if current_user.role == "employee" and not agent.is_shared_with_team:
        raise HTTPException(status_code=403, detail="Access denied to this agent.")

    runs = db.query(AgentRun).filter(AgentRun.agent_id == id).order_by(AgentRun.started_at.desc()).all()
    return runs
