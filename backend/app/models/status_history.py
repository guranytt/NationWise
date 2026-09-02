import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.types import Uuid
from app.database import Base

class IssueStatusHistory(Base):
    __tablename__ = "issue_status_history"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    issue_id = Column(Uuid, ForeignKey("issues.id"), nullable=False)
    old_status = Column(String(20), nullable=True)
    new_status = Column(String(20), nullable=False)
    changed_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    note = Column(Text, nullable=True)
