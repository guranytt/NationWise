from uuid import UUID
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from .category import CategoryResponse
from .agency import AgencyPublicResponse

class IssueCreate(BaseModel):
    category_id: UUID
    title: str
    description: str
    state: str
    lga: str
    latitude: float | None = None
    longitude: float | None = None
    fingerprint_visitor_id: str

class IssueResponse(BaseModel):
    id: UUID
    category: CategoryResponse
    title: str
    description: str
    state: str
    lga: str
    latitude: float | None
    longitude: float | None
    status: str
    routed_agency: AgencyPublicResponse | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
