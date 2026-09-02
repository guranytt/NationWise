import uuid
from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.types import Uuid
from app.database import Base

class Agency(Base):
    __tablename__ = "agencies"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    category_id = Column(Uuid, ForeignKey("issue_categories.id"), nullable=False)
    state = Column(String(50), nullable=True)
    lga = Column(String(100), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(30), nullable=True)
    complaints_portal_url = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
