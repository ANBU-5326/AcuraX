from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.db.session import get_db
from app.models.user import Team, User
from app.schemas.user import TeamResponse
from app.dependencies import get_current_user
from typing import List

router = APIRouter()

class WorkspaceResponse(BaseModel):
    id: str
    name: str
    role: str
    tier: str
    members: int
    created_at: str

    class Config:
        from_attributes = True

class WorkspaceCreate(BaseModel):
    name: str

@router.get("", response_model=List[WorkspaceResponse])
def list_workspaces(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Return the user's own team as a workspace
    team = db.query(Team).filter(Team.id == current_user.team_id).first()
    if not team:
        return []
    
    member_count = db.query(User).filter(User.team_id == team.id).count()
    
    return [WorkspaceResponse(
        id=team.id,
        name=team.name,
        role=current_user.role.capitalize(),
        tier=team.plan.capitalize(),
        members=member_count,
        created_at=str(team.created_at.date()) if team.created_at else ""
    )]

@router.post("", response_model=WorkspaceResponse)
def create_workspace(
    workspace_in: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # For now just return the user's current workspace with updated name
    # (proper multi-workspace support is future)
    team = db.query(Team).filter(Team.id == current_user.team_id).first()
    if team:
        team.name = workspace_in.name
        db.add(team)
        db.commit()
        db.refresh(team)
    
    member_count = db.query(User).filter(User.team_id == team.id).count()
    return WorkspaceResponse(
        id=team.id,
        name=team.name,
        role=current_user.role.capitalize(),
        tier=team.plan.capitalize(),
        members=member_count,
        created_at=str(team.created_at.date()) if team.created_at else ""
    )
