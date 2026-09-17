from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import logging

from app.schemas.issue import IssueResponse
from app.schemas.status import StatusUpdate
from app.services.issue_service import update_issue_status
from app.api.deps import get_db, verify_admin
from app.database import engine, Base
from app.seed import seed_database

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["Admin"])

@router.post("/init-db")
@router.get("/init-db")
async def init_db():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await seed_database()
        return {"status": "success", "message": "Database tables created and seeded"}
    except Exception as e:
        logger.error(f"Error during manual DB init: {e}")
        return {"status": "error", "message": str(e)}

@router.patch("/issues/{issue_id}/status", response_model=IssueResponse)
async def update_status(
    issue_id: UUID,
    status_update: StatusUpdate,
    db: AsyncSession = Depends(get_db),
    admin: str = Depends(verify_admin)
):
    issue = await update_issue_status(db, issue_id, status_update)
    return issue
