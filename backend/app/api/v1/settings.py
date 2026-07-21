from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.db.session import get_db
from app.models.user import Team, User
from app.dependencies import get_current_user

router = APIRouter()

class SettingsResponse(BaseModel):
    openai_key: Optional[str] = ""
    anthropic_key: Optional[str] = ""
    theme: Optional[str] = "dark"
    default_model: Optional[str] = "Claude 3.5 Sonnet"
    auto_save: Optional[str] = "true"

@router.get("", response_model=SettingsResponse)
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    team = db.query(Team).filter(Team.id == current_user.team_id).first()
    stored = (team.settings or {}) if team else {}
    return SettingsResponse(
        openai_key=stored.get("openai_key", ""),
        anthropic_key=stored.get("anthropic_key", ""),
        theme=stored.get("theme", "dark"),
        default_model=stored.get("default_model", "Claude 3.5 Sonnet"),
        auto_save=stored.get("auto_save", "true")
    )

@router.post("")
def save_settings(
    settings_in: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    team = db.query(Team).filter(Team.id == current_user.team_id).first()
    if team:
        existing = team.settings or {}
        existing.update(settings_in)
        team.settings = existing
        db.add(team)
        db.commit()
    return {"detail": "Settings saved successfully."}
