import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    uploaded_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False) # "pdf", "docx", "xlsx", "pptx", "txt"
    file_size_bytes = Column(BigInteger, nullable=False)
    storage_path = Column(String(1024), nullable=False)
    status = Column(String(50), default="ready") # "uploaded", "processing", "ready", "failed"
    visibility = Column(String(50), default="team") # "team", "private", "company"
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    team = relationship("Team", back_populates="documents")
    uploader = relationship("User", back_populates="uploaded_documents")

class KnowledgeArticle(Base):
    __tablename__ = "knowledge_articles"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    summary = Column(String(500), nullable=False)
    content = Column(String, nullable=False) # Markdown content
    category = Column(String(50), nullable=False) # "hr", "it", "onboarding", "guides", "faq"
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    team = relationship("Team", back_populates="knowledge_articles")
    creator = relationship("User", back_populates="created_articles")
