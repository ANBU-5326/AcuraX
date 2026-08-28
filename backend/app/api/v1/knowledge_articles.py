from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional

from app.db.session import get_db
from app.models.document import KnowledgeArticle
from app.models.user import User
from app.schemas.document import KnowledgeArticleResponse, KnowledgeArticleCreate, KnowledgeArticleUpdate
from app.dependencies import get_current_user, require_manager

router = APIRouter()

@router.get("", response_model=List[KnowledgeArticleResponse])
def list_knowledge_articles(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(KnowledgeArticle).filter(KnowledgeArticle.team_id == current_user.team_id)
    
    if category and category.lower() != "all":
        # Handle category matching (e.g. HR Policies vs hr)
        # Normalize comparison
        category_map = {
            "hr policies": "hr",
            "it support": "it",
            "onboarding": "onboarding",
            "guides": "guides",
            "faqs": "faq",
            "faq": "faq"
        }
        normalized_cat = category_map.get(category.lower(), category.lower())
        query = query.filter(KnowledgeArticle.category == normalized_cat)
        
    if search:
        query = query.filter(
            or_(
                KnowledgeArticle.title.ilike(f"%{search}%"),
                KnowledgeArticle.summary.ilike(f"%{search}%"),
                KnowledgeArticle.content.ilike(f"%{search}%")
            )
        )
        
    return query.all()

@router.get("/{id}", response_model=KnowledgeArticleResponse)
def get_knowledge_article(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    article = db.query(KnowledgeArticle).filter(
        KnowledgeArticle.id == id,
        KnowledgeArticle.team_id == current_user.team_id
    ).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Knowledge article not found.")
        
    return article

@router.post("", response_model=KnowledgeArticleResponse, status_code=status.HTTP_201_CREATED)
def create_knowledge_article(
    article_in: KnowledgeArticleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager) # Manager only
):
    new_article = KnowledgeArticle(
        team_id=current_user.team_id,
        title=article_in.title,
        summary=article_in.summary,
        content=article_in.content,
        category=article_in.category.lower(),
        created_by=current_user.id
    )
    db.add(new_article)
    db.commit()
    db.refresh(new_article)
    return new_article

@router.patch("/{id}", response_model=KnowledgeArticleResponse)
def update_knowledge_article(
    id: str,
    article_in: KnowledgeArticleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager) # Manager only
):
    article = db.query(KnowledgeArticle).filter(
        KnowledgeArticle.id == id,
        KnowledgeArticle.team_id == current_user.team_id
    ).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Knowledge article not found.")
        
    if article_in.title is not None:
        article.title = article_in.title
    if article_in.summary is not None:
        article.summary = article_in.summary
    if article_in.content is not None:
        article.content = article_in.content
    if article_in.category is not None:
        article.category = article_in.category.lower()
        
    db.add(article)
    db.commit()
    db.refresh(article)
    return article

@router.delete("/{id}")
def delete_knowledge_article(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager) # Manager only
):
    article = db.query(KnowledgeArticle).filter(
        KnowledgeArticle.id == id,
        KnowledgeArticle.team_id == current_user.team_id
    ).first()
    
    if not article:
        raise HTTPException(status_code=404, detail="Knowledge article not found.")
        
    db.delete(article)
    db.commit()
    return {"detail": "Knowledge article deleted successfully."}
