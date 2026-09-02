import uuid
from sqlalchemy import Column, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import Uuid
from app.database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    full_name = Column(String(255), nullable=False)
    party = Column(String(50), nullable=False)
    state = Column(String(100), nullable=False)
    lga = Column(String(100), nullable=True) # Optional for some positions
    position_sought = Column(String(100), nullable=False)
    election_cycle = Column(String(20), nullable=False, default="2027")
    photo_url = Column(String(512), nullable=True)
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    metrics = relationship("CandidateMetric", back_populates="candidate", cascade="all, delete-orphan")
    score_snapshots = relationship("CandidateScore", back_populates="candidate", cascade="all, delete-orphan")
