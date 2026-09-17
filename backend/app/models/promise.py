import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import Uuid
from app.database import Base

class Promise(Base):
    __tablename__ = "promises"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    candidate_id = Column(Uuid, ForeignKey("candidates.id"), nullable=False)
    promise_text = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False, default="pending") # pending, fulfilled, broken, in_progress
    evidence = Column(Text, nullable=True)
    confidence_score = Column(Float, nullable=False)
    extracted_from_url = Column(String(512), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    candidate = relationship("Candidate")
