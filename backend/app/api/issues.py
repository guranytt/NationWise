from uuid import UUID
from fastapi import APIRouter, Depends, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.schemas.issue import IssueCreate, IssueResponse
from app.services.issue_service import create_issue, list_issues, get_issue
from app.services.email_service import send_issue_notification
from app.api.deps import get_db

router = APIRouter(prefix="/api/issues", tags=["Issues"])

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

@router.post("", response_model=IssueResponse, status_code=201)
async def submit_issue(
    issue_in: IssueCreate,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    ip_address = get_client_ip(request)
    issue = await create_issue(db, issue_in, ip_address)
    
    if issue.routed_agency:
        background_tasks.add_task(send_issue_notification, issue, issue.routed_agency)
        
    return issue

@router.get("", response_model=List[IssueResponse])
async def get_issues(
    category_id: UUID | None = None,
    state: str | None = None,
    lga: str | None = None,
    status: str | None = None,
    page: int = 1,
    per_page: int = 20,
    db: AsyncSession = Depends(get_db)
):
    issues = await list_issues(db, category_id, state, lga, status, page, per_page)
    return issues

@router.get("/{issue_id}")
async def get_issue_detail(issue_id: UUID, db: AsyncSession = Depends(get_db)):
    issue, history = await get_issue(db, issue_id)
    # Convert to dict and add history
    issue_dict = IssueResponse.model_validate(issue).model_dump()
    issue_dict["history"] = [
        {
            "old_status": h.old_status,
            "new_status": h.new_status,
            "changed_at": h.changed_at,
            "note": h.note
        }
        for h in history
    ]
    return issue_dict
