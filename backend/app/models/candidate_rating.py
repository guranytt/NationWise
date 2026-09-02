import uuid
from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import Uuid
from app.database import Base

class CandidateRating(Base):
    __tablename__ = "candidate_ratings"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    candidate_id = Column(Uuid, ForeignKey("candidates.id"), nullable=False)
    fingerprint_id = Column(Uuid, ForeignKey("submission_fingerprints.id"), nullable=False)
    rating = Column(Integer, nullable=False) # 1 for upvote, -1 for downvote
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    candidate = relationship("Candidate")
    fingerprint = relationship("Fingerprint")
