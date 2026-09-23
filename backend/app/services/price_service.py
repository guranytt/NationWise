import statistics
from typing import List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
import datetime

from app.models.price_tracker import TrackedItem, PriceSubmission
from app.models.fingerprint import Fingerprint

# Function to detect outliers using IQR (Interquartile Range)
def filter_outliers(prices: List[float]) -> List[float]:
    if len(prices) < 4:
        return prices
    prices.sort()
    q1 = prices[len(prices) // 4]
    q3 = prices[(len(prices) * 3) // 4]
    iqr = q3 - q1
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr
    return [p for p in prices if lower_bound <= p <= upper_bound]

async def get_tracked_items(session: AsyncSession) -> List[TrackedItem]:
    stmt = select(TrackedItem).order_by(TrackedItem.category, TrackedItem.name)
    result = await session.execute(stmt)
    return result.scalars().all()

async def submit_price(session: AsyncSession, item_id: str, price: float, state: str, lga: str, ip_address: str, fingerprint_hash: str) -> Tuple[PriceSubmission | None, str]:
    # 1. Get or create fingerprint
    stmt = select(Fingerprint).where(Fingerprint.ip_address == ip_address, Fingerprint.user_agent_hash == fingerprint_hash)
    result = await session.execute(stmt)
    fingerprint = result.scalar_one_or_none()
    
    if not fingerprint:
        fingerprint = Fingerprint(ip_address=ip_address, user_agent_hash=fingerprint_hash)
        session.add(fingerprint)
        await session.commit()
        await session.refresh(fingerprint)

    # 2. Check weekly limit
    week_ago = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7)
    stmt = select(func.count()).select_from(PriceSubmission).where(
        PriceSubmission.fingerprint_id == fingerprint.id,
        PriceSubmission.item_id == item_id,
        PriceSubmission.created_at >= week_ago
    )
    result = await session.execute(stmt)
    submissions_this_week = result.scalar_one()
    
    if submissions_this_week > 0:
        return None, "You have already submitted a price for this item this week."

    # 3. Save submission
    submission = PriceSubmission(
        item_id=item_id,
        price=price,
        state=state,
        lga=lga,
        fingerprint_id=fingerprint.id
    )
    session.add(submission)
    await session.commit()
    await session.refresh(submission)
    
    return submission, "Success"

async def get_national_averages(session: AsyncSession) -> Dict[str, Any]:
    # In a real app we'd do a more complex aggregate query and cache it.
    # Here we'll fetch recent submissions (last 30 days) and calculate.
    month_ago = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=30)
    
    stmt = select(PriceSubmission, TrackedItem).join(TrackedItem).where(
        PriceSubmission.created_at >= month_ago,
        PriceSubmission.is_outlier == False
    )
    result = await session.execute(stmt)
    records = result.all()
    
    grouped_prices = {}
    items_meta = {}
    for sub, item in records:
        if item.id not in grouped_prices:
            grouped_prices[item.id] = []
            items_meta[item.id] = item
        grouped_prices[item.id].append(sub.price)
        
    averages = []
    for item_id, prices in grouped_prices.items():
        filtered = filter_outliers(prices)
        if filtered:
            avg = sum(filtered) / len(filtered)
            item = items_meta[item_id]
            averages.append({
                "item_id": str(item_id),
                "name": item.name,
                "unit": item.unit,
                "category": item.category,
                "icon": item.icon,
                "average_price": round(avg, 2),
                "data_points": len(filtered)
            })
            
    return {"data": averages}

async def get_state_averages(session: AsyncSession, item_id: str) -> List[Dict[str, Any]]:
    month_ago = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=30)
    
    stmt = select(PriceSubmission).where(
        PriceSubmission.item_id == item_id,
        PriceSubmission.created_at >= month_ago,
        PriceSubmission.is_outlier == False
    )
    result = await session.execute(stmt)
    submissions = result.scalars().all()
    
    grouped_by_state = {}
    for sub in submissions:
        if sub.state not in grouped_by_state:
            grouped_by_state[sub.state] = []
        grouped_by_state[sub.state].append(sub.price)
        
    state_averages = []
    for state, prices in grouped_by_state.items():
        filtered = filter_outliers(prices)
        if filtered:
            avg = sum(filtered) / len(filtered)
            state_averages.append({
                "state": state,
                "average_price": round(avg, 2),
                "data_points": len(filtered)
            })
            
    return state_averages
