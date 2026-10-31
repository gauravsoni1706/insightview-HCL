import json
from datetime import datetime, timezone
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from config import Config

Base = declarative_base()
engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    original_name = Column(String(255), nullable=False)
    filepath = Column(String(512), nullable=False)
    file_size_bytes = Column(Integer, default=0)
    row_count = Column(Integer, default=0)
    col_count = Column(Integer, default=0)
    missing_cells_count = Column(Integer, default=0)
    duplicate_rows_count = Column(Integer, default=0)
    data_quality_score = Column(Float, default=100.0) # Percentage 0-100
    
    # JSON strings
    column_details_json = Column(Text, default="[]")
    summary_stats_json = Column(Text, default="{}")
    quality_breakdown_json = Column(Text, default="{}")
    
    status = Column(String(50), default="active") # active, archived
    is_sample = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    conversations = relationship("Conversation", back_populates="dataset", cascade="all, delete-orphan")
    insights = relationship("Insight", back_populates="dataset", cascade="all, delete-orphan")
    activities = relationship("AnalysisActivity", back_populates="dataset", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "filename": self.filename,
            "original_name": self.original_name,
            "filepath": self.filepath,
            "file_size_bytes": self.file_size_bytes,
            "row_count": self.row_count,
            "col_count": self.col_count,
            "missing_cells_count": self.missing_cells_count,
            "duplicate_rows_count": self.duplicate_rows_count,
            "data_quality_score": round(self.data_quality_score, 1),
            "column_details": json.loads(self.column_details_json or "[]"),
            "summary_stats": json.loads(self.summary_stats_json or "{}"),
            "quality_breakdown": json.loads(self.quality_breakdown_json or "{}"),
            "status": self.status,
            "is_sample": self.is_sample,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    title = Column(String(255), default="New Analysis Session")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    dataset = relationship("Dataset", back_populates="conversations")
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="ChatMessage.id")

    def to_dict(self):
        return {
            "id": self.id,
            "dataset_id": self.dataset_id,
            "title": self.title,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "message_count": len(self.messages) if self.messages else 0
        }

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender = Column(String(50), nullable=False) # 'user' or 'ai'
    content = Column(Text, nullable=False)
    
    # Rich payload for AI responses
    execution_plan_json = Column(Text, nullable=True)
    numerical_results_json = Column(Text, nullable=True)
    chart_config_json = Column(Text, nullable=True)
    table_data_json = Column(Text, nullable=True)
    execution_time_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    conversation = relationship("Conversation", back_populates="messages")

    def to_dict(self):
        return {
            "id": self.id,
            "conversation_id": self.conversation_id,
            "sender": self.sender,
            "content": self.content,
            "execution_plan": json.loads(self.execution_plan_json) if self.execution_plan_json else None,
            "numerical_results": json.loads(self.numerical_results_json) if self.numerical_results_json else None,
            "chart_config": json.loads(self.chart_config_json) if self.chart_config_json else None,
            "table_data": json.loads(self.table_data_json) if self.table_data_json else None,
            "execution_time_ms": self.execution_time_ms,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class Insight(Base):
    __tablename__ = "insights"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    title = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=False)
    category = Column(String(50), default="trend") # trend, distribution, quality, correlation, anomaly
    severity = Column(String(50), default="info") # info, success, warning, danger
    metric_value = Column(String(100), nullable=True)
    is_saved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    dataset = relationship("Dataset", back_populates="insights")

    def to_dict(self):
        return {
            "id": self.id,
            "dataset_id": self.dataset_id,
            "title": self.title,
            "explanation": self.explanation,
            "category": self.category,
            "severity": self.severity,
            "metric_value": self.metric_value,
            "is_saved": self.is_saved,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class AnalysisActivity(Base):
    __tablename__ = "analysis_activities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)
    question = Column(String(500), nullable=False)
    operation = Column(String(100), nullable=False)
    execution_time_ms = Column(Float, default=0.0)
    day_of_week = Column(String(20), nullable=False) # Monday, Tuesday, ...
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    dataset = relationship("Dataset", back_populates="activities")

    def to_dict(self):
        return {
            "id": self.id,
            "dataset_id": self.dataset_id,
            "question": self.question,
            "operation": self.operation,
            "execution_time_ms": self.execution_time_ms,
            "day_of_week": self.day_of_week,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class UserPreference(Base):
    __tablename__ = "user_preferences"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

def init_db():
    Base.metadata.create_all(bind=engine)
