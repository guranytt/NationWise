import uuid
from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import Uuid
from app.database import Base

class Issue(Base):
    __tablename__ = "issues"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    category_id = Column(Uuid, ForeignKey("issue_categories.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    state = Column(String(50), nullable=False)
    lga = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(String(20), nullable=False, default='submitted')
    routed_agency_id = Column(Uuid, ForeignKey("agencies.id"), nullable=True)
    submission_fingerprint_id = Column(Uuid, ForeignKey("submission_fingerprints.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    category = relationship("Category")
    routed_agency = relationship("Agency")

    __table_args__ = (
        CheckConstraint("status IN ('submitted', 'acknowledged', 'in_progress', 'resolved', 'stalled')"),
    )
