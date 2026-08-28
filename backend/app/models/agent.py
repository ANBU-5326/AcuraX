import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean, Float, JSON, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base

class Agent(Base):
    __tablename__ = "agents"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    trigger_type = Column(String(50), default="manual") # "manual", "scheduled", "event"
    schedule_cron = Column(String(100), nullable=True)
    status = Column(String(50), default="idle") # "idle", "running", "failed", "disabled"
    is_shared_with_team = Column(Boolean, default=True)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # Frontend compatibility fields
    model = Column(String(100), default="Claude 3.5 Sonnet")
    temperature = Column(Float, default=0.2)
    system_prompt = Column(String, nullable=True)
    tools = Column(JSON, default=list)
    tokens_used = Column(Integer, default=0)
    avatar_color = Column(String(100), default="from-indigo-600 to-violet-600")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    team = relationship("Team", back_populates="agents")
    creator = relationship("User", back_populates="created_agents")
    runs = relationship("AgentRun", back_populates="agent", cascade="all, delete-orphan")

class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    agent_id = Column(String(36), ForeignKey("agents.id", ondelete="CASCADE"), nullable=False)
    triggered_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="running") # "completed", "failed", "running"
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    result_summary = Column(String, nullable=True)

    agent = relationship("Agent", back_populates="runs")
    triggerer = relationship("User", back_populates="triggered_runs")
