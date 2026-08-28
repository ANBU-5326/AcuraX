import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class Team(Base):
    __tablename__ = "teams"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    plan = Column(String(50), default="free") # "free" | "pro" | "enterprise"
    settings = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    users = relationship("User", back_populates="team", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="team", cascade="all, delete-orphan")
    knowledge_articles = relationship("KnowledgeArticle", back_populates="team", cascade="all, delete-orphan")
    agents = relationship("Agent", back_populates="team", cascade="all, delete-orphan")
    usage_logs = relationship("UsageLog", back_populates="team", cascade="all, delete-orphan")
    workflows = relationship("Workflow", back_populates="team", cascade="all, delete-orphan")

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    role = Column(String(50), default="employee") # "employee" | "manager"
    status = Column(String(50), default="active") # "active" | "pending"
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    team = relationship("Team", back_populates="users")
    uploaded_documents = relationship("Document", back_populates="uploader")
    created_articles = relationship("KnowledgeArticle", back_populates="creator")
    created_agents = relationship("Agent", back_populates="creator")
    triggered_runs = relationship("AgentRun", back_populates="triggerer")
    chats = relationship("Chat", back_populates="user", cascade="all, delete-orphan")
    usage_logs = relationship("UsageLog", back_populates="user", cascade="all, delete-orphan")
