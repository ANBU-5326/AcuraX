from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from pydantic import BaseModel

from app.db.session import get_db
from app.models.document import Document, KnowledgeArticle
from app.models.user import User
from app.dependencies import get_current_user

router = APIRouter()

class SearchResultResponse(BaseModel):
    id: str
    title: str
    snippet: str
    score: float
    source: str
    chunksCount: int

@router.get("", response_model=List[SearchResultResponse])
def perform_search(
    query: str = Query(..., description="Query string to search"),
    score_threshold: float = Query(0.5, alias="scoreThreshold", description="Minimum matching score (0.0 to 1.0)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    results = []
    
    # 1. Search knowledge articles in the user's team
    articles = db.query(KnowledgeArticle).filter(
        KnowledgeArticle.team_id == current_user.team_id,
        or_(
            KnowledgeArticle.title.ilike(f"%{query}%"),
            KnowledgeArticle.summary.ilike(f"%{query}%"),
            KnowledgeArticle.content.ilike(f"%{query}%")
        )
    ).all()
    
    for idx, art in enumerate(articles):
        # Compute a fake matching score
        score = 0.95 - (idx * 0.05)
        if score < score_threshold:
            continue
        results.append(
            SearchResultResponse(
                id=f"sr-art-{art.id}",
                title=art.title,
                snippet=art.summary,
                score=score,
                source=f"Article: {art.category.upper()}",
                chunksCount=len(art.content) // 250 + 1
            )
        )
        
    # 2. Search documents in the user's team
    # Only visible documents
    doc_query = db.query(Document).filter(Document.team_id == current_user.team_id)
    if current_user.role == "employee":
        doc_query = doc_query.filter(Document.visibility.in_(["team", "company"]))
        
    docs = doc_query.filter(
        Document.file_name.ilike(f"%{query}%")
    ).all()
    
    for idx, doc in enumerate(docs):
        score = 0.85 - (idx * 0.05)
        if score < score_threshold:
            continue
        results.append(
            SearchResultResponse(
                id=f"sr-doc-{doc.id}",
                title=doc.file_name,
                snippet=f"Document file matching search query. Type: {doc.file_type.upper()}. Size: {(doc.file_size_bytes/1024):.1f} KB.",
                score=score,
                source=doc.file_name,
                chunksCount=1
            )
        )
        
    return results
