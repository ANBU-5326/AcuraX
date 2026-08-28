from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ChatMessageResponse(BaseModel):
    id: str
    chat_id: str
    role: str # "user" | "assistant"
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class ChatMessageCreate(BaseModel):
    content: str

class ChatResponse(BaseModel):
    id: str
    user_id: str
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ChatCreate(BaseModel):
    title: Optional[str] = None
