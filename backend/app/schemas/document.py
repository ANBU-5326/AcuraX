from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DocumentResponse(BaseModel):
    id: str
    team_id: str
    uploaded_by: Optional[str] = None
    file_name: str
    file_type: str
    file_size_bytes: int
    storage_path: str
    status: str
    visibility: str
    created_at: datetime

    class Config:
        from_attributes = True

class DocumentCreate(BaseModel):
    file_name: str
    file_type: str
    file_size_bytes: int
    visibility: Optional[str] = "team" # "team" | "private" | "company"

class KnowledgeArticleResponse(BaseModel):
    id: str
    team_id: str
    title: str
    summary: str
    content: str
    category: str # "hr", "it", "onboarding", "guides", "faq"
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class KnowledgeArticleCreate(BaseModel):
    title: str
    summary: str
    content: str
    category: str

class KnowledgeArticleUpdate(BaseModel):
    title: Optional[str] = None
    summary: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
