import hashlib
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from fastapi import HTTPException
from app.models import Fingerprint
from app.config import settings

async def check_and_record_fingerprint(
    session: AsyncSession, visitor_id: str, ip_address: str
) -> Fingerprint:
    visitor_hash = hashlib.sha256(visitor_id.encode()).hexdigest()
    
    stmt = select(Fingerprint).where(
        Fingerprint.fingerprint_hash == visitor_hash,
        Fingerprint.ip_address == ip_address
    )
    result = await session.execute(stmt)
    fingerprint = result.scalar_one_or_none()
    
    now = datetime.now(timezone.utc)
    
    if fingerprint:
        if now - fingerprint.last_seen_at > timedelta(hours=24):
            fingerprint.submission_count_24h = 1
        else:
            fingerprint.submission_count_24h += 1
            
        fingerprint.last_seen_at = now
        
        if fingerprint.submission_count_24h > settings.MAX_SUBMISSIONS_24H:
            raise HTTPException(
                status_code=429,
                detail="You have reached the maximum number of issue submissions allowed in a 24-hour period. Please try again later."
            )
    else:
        fingerprint = Fingerprint(
            fingerprint_hash=visitor_hash,
            ip_address=ip_address,
            submission_count_24h=1
        )
        session.add(fingerprint)
        
    await session.flush()
    return fingerprint
