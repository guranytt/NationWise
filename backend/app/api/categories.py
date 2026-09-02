from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import Category
from app.schemas.category import CategoryResponse
from app.api.deps import get_db

router = APIRouter(prefix="/api/categories", tags=["Categories"])

@router.get("", response_model=list[CategoryResponse])
async def get_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category).order_by(Category.name))
    return result.scalars().all()
