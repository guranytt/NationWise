from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import or_, and_, case
from app.models import Agency

async def match_agency(session: AsyncSession, category_id: UUID, state: str, lga: str) -> UUID | None:
    stmt = (
        select(Agency)
        .where(Agency.category_id == category_id)
        .where(
            or_(
                and_(Agency.state == state, Agency.lga == lga),
                and_(Agency.state == state, Agency.lga.is_(None)),
            )
        )
        .order_by(
            case(
                (Agency.lga.isnot(None), 0),
                else_=1
            )
        )
        .limit(1)
    )
    
    result = await session.execute(stmt)
    agency = result.scalar_one_or_none()
    
    if agency:
        return agency.id
    return None
