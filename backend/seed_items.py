import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.database import AsyncSessionLocal
from app.models.price_tracker import TrackedItem

async def seed_tracked_items():
    async with AsyncSessionLocal() as session:
        items_data = [
            {"name": "Rice", "unit": "per 50kg bag", "category": "Food", "icon": "wheat"},
            {"name": "Beans", "unit": "per 50kg bag", "category": "Food", "icon": "bean"},
            {"name": "Garri", "unit": "per 50kg bag", "category": "Food", "icon": "bowl"},
            {"name": "Palm Oil", "unit": "per 25L jerrycan", "category": "Food", "icon": "droplet"},
            {"name": "Bread", "unit": "per loaf", "category": "Food", "icon": "croissant"},
            {"name": "Tomatoes", "unit": "per basket", "category": "Food", "icon": "apple"},
            {"name": "Fuel (PMS)", "unit": "per litre", "category": "Fuel", "icon": "fuel"},
            {"name": "Diesel (AGO)", "unit": "per litre", "category": "Fuel", "icon": "truck"},
            {"name": "Cooking Gas (LPG)", "unit": "per 12.5kg", "category": "Fuel", "icon": "flame"},
            {"name": "Cement", "unit": "per 50kg bag", "category": "Construction", "icon": "hammer"}
        ]
        
        stmt = select(func.count()).select_from(TrackedItem)
        result = await session.execute(stmt)
        item_count = result.scalar_one()
        
        if item_count == 0:
            for i_data in items_data:
                session.add(TrackedItem(**i_data))
            await session.commit()
            print("Tracked items seeded successfully.")
        else:
            print("Tracked items already seeded.")

if __name__ == "__main__":
    asyncio.run(seed_tracked_items())
