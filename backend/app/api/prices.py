from uuid import UUID
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
from pydantic import BaseModel

from app.api.deps import get_db
from app.services.price_service import get_tracked_items, submit_price, get_national_averages, get_state_averages
from app.models.price_tracker import TrackedItem

router = APIRouter(prefix="/api/prices", tags=["Prices"])

class TrackedItemResponse(BaseModel):
    id: UUID
    name: str
    unit: str
    category: str
    icon: str | None

    class Config:
        from_attributes = True

class PriceSubmissionCreate(BaseModel):
    item_id: UUID
    price: float
    state: str
    lga: str | None = None
    fingerprint_hash: str

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

@router.get("/items", response_model=List[TrackedItemResponse])
async def list_items(db: AsyncSession = Depends(get_db)):
    items = await get_tracked_items(db)
    return items

@router.post("/submit")
async def create_price_submission(
    data: PriceSubmissionCreate,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    ip_address = get_client_ip(request)
    submission, msg = await submit_price(db, str(data.item_id), data.price, data.state, data.lga, ip_address, data.fingerprint_hash)
    
    if not submission:
        raise HTTPException(status_code=429, detail=msg)
        
    return {"status": "success", "message": "Price submitted successfully"}

@router.get("/national")
async def national_averages(db: AsyncSession = Depends(get_db)):
    averages = await get_national_averages(db)
    return averages

@router.get("/state/{item_id}")
async def state_averages(item_id: UUID, db: AsyncSession = Depends(get_db)):
    averages = await get_state_averages(db, str(item_id))
    return {"item_id": item_id, "state_data": averages}
