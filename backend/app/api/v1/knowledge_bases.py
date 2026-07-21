import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Literal
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter()

class KnowledgeBaseSchema(BaseModel):
    id: str
    name: str
    type: Literal["file", "web", "database"]
    source: str
    status: Literal["synced", "syncing", "failed"]
    lastSync: str
    docCount: int

class KnowledgeBaseCreate(BaseModel):
    name: str
    type: Literal["file", "web", "database"]
    source: str

# Seed in-memory storage partitioned by team_id
KB_STORE = {}

def get_team_kbs(team_id: str) -> List[KnowledgeBaseSchema]:
    if team_id not in KB_STORE:
        KB_STORE[team_id] = [
            KnowledgeBaseSchema(
                id="kb-1",
                name="AcuraX Strategy Hub",
                type="file",
                source="3 Documents",
                status="synced",
                lastSync="2026-06-23 18:45",
                docCount=3
            ),
            KnowledgeBaseSchema(
                id="kb-2",
                name="Developer Wiki Scraper",
                type="web",
                source="https://docs.acurax.ai/dev",
                status="synced",
                lastSync="2026-06-24 09:12",
                docCount=84
            ),
            KnowledgeBaseSchema(
                id="kb-3",
                name="SQL Support Log Syncer",
                type="database",
                source="postgresql://support_prod",
                status="synced",
                lastSync="2026-06-24 10:10",
                docCount=350
            )
        ]
    return KB_STORE[team_id]

@router.get("", response_model=List[KnowledgeBaseSchema])
def get_kbs(current_user: User = Depends(get_current_user)):
    return get_team_kbs(current_user.team_id)

@router.post("", response_model=KnowledgeBaseSchema, status_code=status.HTTP_201_CREATED)
def create_kb(
    kb_in: KnowledgeBaseCreate,
    current_user: User = Depends(get_current_user)
):
    team_kbs = get_team_kbs(current_user.team_id)
    new_kb = KnowledgeBaseSchema(
        id=f"kb-{str(uuid.uuid4())[:8]}",
        name=kb_in.name,
        type=kb_in.type,
        source=kb_in.source,
        status="synced",
        lastSync=datetime.now().strftime("%Y-%m-%d %H:%M"),
        docCount=1 if kb_in.type == "web" else 0
    )
    team_kbs.append(new_kb)
    return new_kb

@router.post("/{id}/sync", response_model=KnowledgeBaseSchema)
def sync_kb(id: str, current_user: User = Depends(get_current_user)):
    team_kbs = get_team_kbs(current_user.team_id)
    for kb in team_kbs:
        if kb.id == id:
            kb.status = "synced"
            kb.lastSync = datetime.now().strftime("%Y-%m-%d %H:%M")
            kb.docCount += 5 # Mock increment
            return kb
    raise HTTPException(status_code=404, detail="Knowledge base not found.")
