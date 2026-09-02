import uuid
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.sql import func
from sqlalchemy.types import Uuid
from sqlalchemy import Index
from app.database import Base

class Fingerprint(Base):
    __tablename__ = "submission_fingerprints"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    fingerprint_hash = Column(String(64), nullable=False)
    ip_address = Column(String(50), nullable=False)
    first_seen_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_seen_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    submission_count_24h = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        Index("ix_fingerprint_hash_ip", "fingerprint_hash", "ip_address", unique=True),
    )
