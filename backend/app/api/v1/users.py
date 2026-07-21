from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import (
    UserResponse,
    UserUpdate,
    UserPasswordUpdate,
    TeamMemberInvite,
    TeamMemberRoleUpdate,
    TeamMemberResponse
)
from app.core.security import get_password_hash, verify_password
from app.dependencies import get_current_user, require_manager

router = APIRouter()

# ── User Endpoints ────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=UserResponse)
def update_my_profile(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name
    if user_in.avatar_url is not None:
        current_user.avatar_url = user_in.avatar_url
    
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.patch("/me/password")
def change_my_password(
    password_in: UserPasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(password_in.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password."
        )
    current_user.password_hash = get_password_hash(password_in.new_password)
    db.add(current_user)
    db.commit()
    return {"detail": "Password updated successfully."}

# ── Team Management Endpoints (Manager Only) ───────────────────────────────────

@router.get("/team/members", response_model=List[TeamMemberResponse])
def get_team_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    # Query all users in the same team
    members = db.query(User).filter(User.team_id == current_user.team_id).all()
    # Map them to TeamMemberResponse
    result = []
    for m in members:
        result.append(
            TeamMemberResponse(
                id=m.id,
                name=m.full_name,
                email=m.email,
                role=m.role,
                status=m.status
            )
        )
    return result

@router.post("/team/invite", response_model=TeamMemberResponse)
def invite_team_member(
    invite_in: TeamMemberInvite,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    # Check if user already exists
    existing = db.query(User).filter(User.email == invite_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email is already registered."
        )
    
    # Create employee user in pending status with dummy password hash
    new_user = User(
        email=invite_in.email,
        full_name=invite_in.email.split("@")[0].capitalize(),
        password_hash=get_password_hash("AcuraXInvitationDummy2026!"), # Placeholder
        role="employee",
        status="pending",
        team_id=current_user.team_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return TeamMemberResponse(
        id=new_user.id,
        name=new_user.full_name,
        email=new_user.email,
        role=new_user.role,
        status=new_user.status
    )

@router.patch("/team/members/{user_id}/role", response_model=TeamMemberResponse)
def change_member_role(
    user_id: str,
    role_in: TeamMemberRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    # Locate member within manager's team
    member = db.query(User).filter(User.id == user_id, User.team_id == current_user.team_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found."
        )
    
    # Update role
    member.role = role_in.role
    db.add(member)
    db.commit()
    db.refresh(member)

    return TeamMemberResponse(
        id=member.id,
        name=member.full_name,
        email=member.email,
        role=member.role,
        status=member.status
    )

@router.delete("/team/members/{user_id}")
def remove_team_member(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    # Prevent self-deletion
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove yourself from the team."
        )
        
    member = db.query(User).filter(User.id == user_id, User.team_id == current_user.team_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team member not found."
        )
    
    db.delete(member)
    db.commit()
    return {"detail": "Member removed from team successfully."}
