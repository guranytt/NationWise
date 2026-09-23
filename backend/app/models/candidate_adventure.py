import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import Uuid
from app.database import Base

class CandidateAdventure(Base):
    __tablename__ = "candidate_adventures"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    candidate_id = Column(Uuid, ForeignKey("candidates.id"), nullable=False, unique=True)
    sections = Column(JSON, nullable=False)  # Array of {title, content, order}
    summary = Column(Text, nullable=False)
    pdf_url = Column(String(512), nullable=True)
    model_used = Column(String(50), nullable=False)
    generated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    candidate = relationship("Candidate", back_populates="adventure")
