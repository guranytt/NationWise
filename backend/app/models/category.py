import uuid
from sqlalchemy import Column, String, Text
from sqlalchemy.types import Uuid
from app.database import Base

class Category(Base):
    __tablename__ = "issue_categories"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
