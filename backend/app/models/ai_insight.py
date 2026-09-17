import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import Uuid
from app.database import Base

class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    candidate_id = Column(Uuid, ForeignKey("candidates.id"), nullable=False)
    insight_type = Column(String(50), nullable=False) # e.g. 'general_summary', 'promise_fulfillment'
    content = Column(JSON, nullable=False) # Store structured AI output
    model_used = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True) # For caching

    candidate = relationship("Candidate")
