from uuid import UUID
from pydantic import BaseModel, ConfigDict

class AgencyPublicResponse(BaseModel):
    id: UUID
    name: str
    contact_email: str | None = None
    contact_phone: str | None = None
    complaints_portal_url: str | None = None

    model_config = ConfigDict(from_attributes=True)
