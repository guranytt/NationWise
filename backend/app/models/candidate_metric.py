import uuid
from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import Uuid
from app.database import Base

class CandidateMetric(Base):
    __tablename__ = "candidate_metrics"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    candidate_id = Column(Uuid, ForeignKey("candidates.id"), nullable=False)
    metric_type = Column(String(100), nullable=False) # e.g. asset_declaration, social_sentiment
    value = Column(Float, nullable=False)
    source_url = Column(String(512), nullable=True)
    source_label = Column(String(255), nullable=True)
    scraped_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    valid_until = Column(DateTime(timezone=True), nullable=True)

    candidate = relationship("Candidate", back_populates="metrics")
