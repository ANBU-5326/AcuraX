from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class TeamResponse(BaseModel):
    id: str
    name: str
    plan: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    avatar_url: Optional[str] = None
    team_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class UserPasswordUpdate(BaseModel):
    current_password: str
    new_password: str

class TeamMemberInvite(BaseModel):
    email: EmailStr

class TeamMemberRoleUpdate(BaseModel):
    role: str # "employee" | "manager"

class TeamMemberResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    status: str # "active" | "pending"

    class Config:
        from_attributes = True
