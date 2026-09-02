from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.future import select
from fastapi import HTTPException
from app.models import Issue, IssueStatusHistory
from app.schemas.issue import IssueCreate
from app.schemas.status import StatusUpdate
from .fingerprint_service import check_and_record_fingerprint
from .routing_service import match_agency

async def create_issue(session: AsyncSession, issue_in: IssueCreate, ip_address: str) -> Issue:
    fingerprint = await check_and_record_fingerprint(session, issue_in.fingerprint_visitor_id, ip_address)
    routed_agency_id = await match_agency(session, issue_in.category_id, issue_in.state, issue_in.lga)
    
    issue = Issue(
        category_id=issue_in.category_id,
        title=issue_in.title,
        description=issue_in.description,
        state=issue_in.state,
        lga=issue_in.lga,
        latitude=issue_in.latitude,
        longitude=issue_in.longitude,
        routed_agency_id=routed_agency_id,
        submission_fingerprint_id=fingerprint.id,
        status="submitted"
    )
    
    session.add(issue)
    await session.flush()
    
    # Create initial status history
    history = IssueStatusHistory(
        issue_id=issue.id,
        old_status=None,
        new_status="submitted",
        note="Issue submitted"
    )
    session.add(history)
    await session.commit()
    
    # Reload with relations
    stmt = select(Issue).options(
        selectinload(Issue.category),
        selectinload(Issue.routed_agency)
    ).where(Issue.id == issue.id)
    
    result = await session.execute(stmt)
    return result.scalar_one()

async def list_issues(
    session: AsyncSession, 
    category_id: UUID | None = None,
    state: str | None = None,
    lga: str | None = None,
    status: str | None = None,
    page: int = 1,
    per_page: int = 20
):
    stmt = select(Issue).options(
        selectinload(Issue.category),
        selectinload(Issue.routed_agency)
    )
    
    if category_id:
        stmt = stmt.where(Issue.category_id == category_id)
    if state:
        stmt = stmt.where(Issue.state == state)
    if lga:
        stmt = stmt.where(Issue.lga == lga)
    if status:
        stmt = stmt.where(Issue.status == status)
        
    stmt = stmt.order_by(Issue.created_at.desc())
    stmt = stmt.offset((page - 1) * per_page).limit(per_page)
    
    result = await session.execute(stmt)
    return result.scalars().all()

async def get_issue(session: AsyncSession, issue_id: UUID):
    stmt = select(Issue).options(
        selectinload(Issue.category),
        selectinload(Issue.routed_agency)
    ).where(Issue.id == issue_id)
    
    result = await session.execute(stmt)
    issue = result.scalar_one_or_none()
    
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    # Also fetch history
    hist_stmt = select(IssueStatusHistory).where(IssueStatusHistory.issue_id == issue_id).order_by(IssueStatusHistory.changed_at.desc())
    hist_result = await session.execute(hist_stmt)
    history = hist_result.scalars().all()
    
    # We will attach it dynamically or the router will handle it.
    # For now, we just return issue and let router fetch history
    return issue, history

async def update_issue_status(session: AsyncSession, issue_id: UUID, status_update: StatusUpdate):
    stmt = select(Issue).where(Issue.id == issue_id)
    result = await session.execute(stmt)
    issue = result.scalar_one_or_none()
    
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
        
    old_status = issue.status
    issue.status = status_update.new_status
    
    history = IssueStatusHistory(
        issue_id=issue.id,
        old_status=old_status,
        new_status=issue.status,
        note=status_update.note
    )
    
    session.add(history)
    await session.commit()
    
    return issue
