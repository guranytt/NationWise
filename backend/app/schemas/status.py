from uuid import UUID
from pydantic import BaseModel, ConfigDict
from typing import Literal

class StatusUpdate(BaseModel):
    new_status: Literal["submitted", "acknowledged", "in_progress", "resolved", "stalled"]
    note: str | None = None
