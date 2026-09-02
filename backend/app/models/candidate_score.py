import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import Uuid
from app.database import Base

class CandidateScore(Base):
    __tablename__ = "candidate_scores"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    candidate_id = Column(Uuid, ForeignKey("candidates.id"), nullable=False)
    overall_score = Column(Float, nullable=False, default=0.0)
    transparency_score = Column(Float, nullable=False, default=50.0)
    track_record_score = Column(Float, nullable=False, default=50.0)
    financial_score = Column(Float, nullable=False, default=50.0) # Used for Integrity/Financial
    governance_score = Column(Float, nullable=False, default=50.0) # Policy Strength
    public_trust_score = Column(Float, nullable=False, default=50.0)
    calculated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    methodology_version = Column(String(50), nullable=False, default="1.0")

    candidate = relationship("Candidate", back_populates="score_snapshots")
