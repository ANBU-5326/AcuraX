from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class WorkflowResponse(BaseModel):
    id: str
    team_id: str
    name: str
    description: Optional[str] = None
    status: str
    nodes: Optional[List[Dict[str, Any]]] = None
    edges: Optional[List[Dict[str, Any]]] = None
    updated_at: datetime

    class Config:
        from_attributes = True

class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "draft"
    nodes: Optional[List[Dict[str, Any]]] = None
    edges: Optional[List[Dict[str, Any]]] = None

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    nodes: Optional[List[Dict[str, Any]]] = None
    edges: Optional[List[Dict[str, Any]]] = None
