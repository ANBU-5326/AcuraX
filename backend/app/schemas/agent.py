from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AgentResponse(BaseModel):
    id: str
    team_id: str
    name: str
    description: Optional[str] = None
    trigger_type: str
    schedule_cron: Optional[str] = None
    status: str
    is_shared_with_team: bool
    created_by: Optional[str] = None
    
    # Frontend compatibility fields
    model: str
    temperature: float
    system_prompt: Optional[str] = None
    tools: List[str]
    tokens_used: int
    avatar_color: str
    
    created_at: datetime

    class Config:
        from_attributes = True

class AgentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    trigger_type: Optional[str] = "manual"
    schedule_cron: Optional[str] = None
    is_shared_with_team: Optional[bool] = True
    
    # Frontend compatibility fields
    model: Optional[str] = "Claude 3.5 Sonnet"
    temperature: Optional[float] = 0.2
    system_prompt: Optional[str] = None
    tools: Optional[List[str]] = None
    avatar_color: Optional[str] = None

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_type: Optional[str] = None
    schedule_cron: Optional[str] = None
    status: Optional[str] = None
    is_shared_with_team: Optional[bool] = None
    
    # Frontend compatibility fields
    model: Optional[str] = None
    temperature: Optional[float] = None
    system_prompt: Optional[str] = None
    tools: Optional[List[str]] = None
    tokens_used: Optional[int] = None
    avatar_color: Optional[str] = None

class AgentRunResponse(BaseModel):
    id: str
    agent_id: str
    triggered_by: Optional[str] = None
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    result_summary: Optional[str] = None

    class Config:
        from_attributes = True
