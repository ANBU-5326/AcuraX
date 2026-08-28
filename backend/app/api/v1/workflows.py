from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.workflow import Workflow
from app.models.user import User
from app.schemas.workflow import WorkflowResponse, WorkflowCreate, WorkflowUpdate
from app.dependencies import get_current_user, require_manager

router = APIRouter()

@router.get("", response_model=List[WorkflowResponse])
def list_workflows(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workflows = db.query(Workflow).filter(Workflow.team_id == current_user.team_id).all()
    return workflows

@router.post("", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
def create_workflow(
    workflow_in: WorkflowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager) # Manager only
):
    new_flow = Workflow(
        team_id=current_user.team_id,
        name=workflow_in.name,
        description=workflow_in.description,
        status=workflow_in.status,
        nodes=workflow_in.nodes or [],
        edges=workflow_in.edges or []
    )
    db.add(new_flow)
    db.commit()
    db.refresh(new_flow)
    return new_flow

@router.patch("/{id}", response_model=WorkflowResponse)
def update_workflow(
    id: str,
    workflow_in: WorkflowUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager) # Manager only
):
    workflow = db.query(Workflow).filter(Workflow.id == id, Workflow.team_id == current_user.team_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found.")
        
    if workflow_in.name is not None:
        workflow.name = workflow_in.name
    if workflow_in.description is not None:
        workflow.description = workflow_in.description
    if workflow_in.status is not None:
        workflow.status = workflow_in.status
    if workflow_in.nodes is not None:
        workflow.nodes = workflow_in.nodes
    if workflow_in.edges is not None:
        workflow.edges = workflow_in.edges
        
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow

@router.put("/{id}", response_model=WorkflowResponse)
def replace_workflow(
    id: str,
    workflow_in: WorkflowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager) # Manager only
):
    # Support SaveWorkflow's update-or-insert behavior
    workflow = db.query(Workflow).filter(Workflow.id == id, Workflow.team_id == current_user.team_id).first()
    if not workflow:
        # Create one with the requested ID
        workflow = Workflow(
            id=id,
            team_id=current_user.team_id,
            name=workflow_in.name,
            description=workflow_in.description,
            status=workflow_in.status,
            nodes=workflow_in.nodes or [],
            edges=workflow_in.edges or []
        )
    else:
        workflow.name = workflow_in.name
        workflow.description = workflow_in.description
        workflow.status = workflow_in.status
        workflow.nodes = workflow_in.nodes or []
        workflow.edges = workflow_in.edges or []
        
    db.add(workflow)
    db.commit()
    db.refresh(workflow)
    return workflow

@router.delete("/{id}")
def delete_workflow(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager) # Manager only
):
    workflow = db.query(Workflow).filter(Workflow.id == id, Workflow.team_id == current_user.team_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found.")
        
    db.delete(workflow)
    db.commit()
    return {"detail": "Workflow deleted successfully."}
