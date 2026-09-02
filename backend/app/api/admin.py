from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.issue import IssueResponse
from app.schemas.status import StatusUpdate
from app.services.issue_service import update_issue_status
from app.api.deps import get_db, verify_admin

router = APIRouter(prefix="/api/admin/issues", tags=["Admin"])

@router.patch("/{issue_id}/status", response_model=IssueResponse)
async def update_status(
    issue_id: UUID,
    status_update: StatusUpdate,
    db: AsyncSession = Depends(get_db),
    admin: str = Depends(verify_admin)
):
    issue = await update_issue_status(db, issue_id, status_update)
    return issue
