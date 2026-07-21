import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from app.db.session import get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.dependencies import get_current_user, require_manager
from app.config import settings

router = APIRouter()

@router.get("", response_model=List[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Query logic:
    # 1. Matches user's team_id
    # 2. Managers see everything in the team.
    # 3. Employees see only visibility in ("team", "company"). Private is hidden.
    query = db.query(Document).filter(Document.team_id == current_user.team_id)
    if current_user.role == "employee":
        query = query.filter(Document.visibility.in_(["team", "company"]))
    
    return query.all()

@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    visibility: str = Form("team"), # "team" | "private" | "company"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Restrict visibility values
    if visibility not in ["team", "private", "company"]:
        raise HTTPException(status_code=400, detail="Invalid visibility configuration.")

    # Create directories for storage: storage/documents/{team_id}/
    team_storage_dir = os.path.join(settings.STORAGE_DIR, "documents", current_user.team_id)
    os.makedirs(team_storage_dir, exist_ok=True)

    # Generate distinct file name to prevent collision
    file_uuid = str(uuid.uuid4())
    safe_filename = f"{file_uuid}_{file.filename}"
    storage_path = os.path.join(team_storage_dir, safe_filename)

    # Save to disk
    try:
        with open(storage_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write file to storage disk: {e}"
        )

    # Determine extension and size
    file_type = file.filename.split(".")[-1].lower() if "." in file.filename else "txt"
    file_size_bytes = os.path.getsize(storage_path)

    new_doc = Document(
        team_id=current_user.team_id,
        uploaded_by=current_user.id,
        file_name=file.filename,
        file_type=file_type,
        file_size_bytes=file_size_bytes,
        storage_path=storage_path,
        status="ready", # Completed immediately as mock for now
        visibility=visibility
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return new_doc

@router.get("/{id}", response_model=DocumentResponse)
def get_document_metadata(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == id, Document.team_id == current_user.team_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Employees cannot view private documents
    if current_user.role == "employee" and doc.visibility == "private":
        raise HTTPException(status_code=403, detail="Access denied to private document.")

    return doc

@router.get("/{id}/download")
def download_document_file(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    doc = db.query(Document).filter(Document.id == id, Document.team_id == current_user.team_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    if current_user.role == "employee" and doc.visibility == "private":
        raise HTTPException(status_code=403, detail="Access denied to private document.")

    if not os.path.exists(doc.storage_path):
        raise HTTPException(status_code=404, detail="File missing on server storage.")

    return FileResponse(
        path=doc.storage_path,
        filename=doc.file_name,
        media_type="application/octet-stream"
    )

@router.delete("/{id}")
def delete_document(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager) # Manager only
):
    doc = db.query(Document).filter(Document.id == id, Document.team_id == current_user.team_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Remove file from disk
    if os.path.exists(doc.storage_path):
        try:
            os.remove(doc.storage_path)
        except Exception as e:
            # log warning but proceed to clear db record
            pass

    db.delete(doc)
    db.commit()
    return {"detail": "Document deleted successfully."}
