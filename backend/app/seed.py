import asyncio
import json
import os
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import AsyncSessionLocal, engine
from app.models import Category, Agency
from app.config import settings

async def seed_database():
    async with AsyncSessionLocal() as session:
        # Check if already seeded
        from sqlalchemy import text
        result = await session.execute(text("SELECT COUNT(id) FROM issue_categories"))
        count = result.scalar()
        if count > 0:
            print("Database already seeded.")
            return

        print("Seeding categories...")
        categories_data = [
            {"name": "Electricity", "description": "Power outages, billing disputes, transformer issues"},
            {"name": "Roads", "description": "Potholes, road damage, incomplete road construction"},
            {"name": "Water Supply", "description": "Pipe bursts, contaminated water, no water supply"},
            {"name": "Government Office Delay/Red Tape", "description": "Slow processing, excessive bureaucracy, unresponsive offices"},
            {"name": "Sanitation", "description": "Waste collection failures, open drains, sewage issues"},
            {"name": "Healthcare Facility", "description": "Understaffed clinics, drug shortages, facility disrepair"},
            {"name": "Education Facility", "description": "School infrastructure, teacher shortages, equipment issues"},
            {"name": "Security", "description": "Community safety concerns, police response issues"},
            {"name": "Other", "description": "Issues not covered by other categories"}
        ]
        
        category_objs = {}
        for cat_data in categories_data:
            cat = Category(**cat_data)
            session.add(cat)
            category_objs[cat.name] = cat
        
        await session.flush()
        
        print("Seeding agencies...")
        agencies_data = [
            {"name": "Ibadan Electricity Distribution Company (IBEDC)", "category_name": "Electricity", "state": "Oyo", "lga": None},
            {"name": "Oyo State Ministry of Works and Transport", "category_name": "Roads", "state": "Oyo", "lga": None},
            {"name": "Oyo State Water Corporation", "category_name": "Water Supply", "state": "Oyo", "lga": None},
            {"name": "Oyo State Ministry of Health", "category_name": "Healthcare Facility", "state": "Oyo", "lga": None},
            {"name": "Oyo State Ministry of Education, Science and Technology", "category_name": "Education Facility", "state": "Oyo", "lga": None},
            {"name": "Oyo State Waste Management Authority (OYOWMA)", "category_name": "Sanitation", "state": "Oyo", "lga": None}
        ]
        
        for ag_data in agencies_data:
            cat_name = ag_data.pop("category_name")
            ag_data["category_id"] = category_objs[cat_name].id
            session.add(Agency(**ag_data))
            
        print("Seeding tracked items...")
        from app.models.price_tracker import TrackedItem
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
        
        # Check if already seeded
        from sqlalchemy.future import select
        stmt = select(func.count()).select_from(TrackedItem)
        result = await session.execute(stmt)
        item_count = result.scalar_one()
        
        if item_count == 0:
            for i_data in items_data:
                session.add(TrackedItem(**i_data))
            await session.commit()
            print("Tracked items seeded.")
        else:
            print("Tracked items already seeded.")
            
        print("Seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed_database())
