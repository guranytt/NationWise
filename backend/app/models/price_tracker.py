import uuid
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.types import Uuid
from app.database import Base

class TrackedItem(Base):
    __tablename__ = "tracked_items"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True)
    unit = Column(String(50), nullable=False)
    category = Column(String(50), nullable=False)
    icon = Column(String(50), nullable=True)

class PriceSubmission(Base):
    __tablename__ = "price_submissions"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    item_id = Column(Uuid, ForeignKey("tracked_items.id"), nullable=False)
    price = Column(Float, nullable=False)
    state = Column(String(50), nullable=False)
    lga = Column(String(100), nullable=True)
    fingerprint_id = Column(Uuid, ForeignKey("submission_fingerprints.id"), nullable=False)
    is_outlier = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
