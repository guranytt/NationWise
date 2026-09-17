from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.config import settings
from app.database import engine, Base
from app.seed import seed_database
import app.models  # ensure models are loaded

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await seed_database()
        logger.info("Database auto-initialization and seeding completed.")
    except Exception as e:
        logger.error(f"Error during database initialization: {e}")
    yield
    # Teardown
    await engine.dispose()

app = FastAPI(
    title="Nationwise Issue Reporting API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api import (
    categories_router, locations_router, issues_router, admin_router,
    candidates_router, scraper_ingest_router
)
from app.api.ai_analysis import router as ai_analysis_router

app.include_router(categories_router)
app.include_router(locations_router)
app.include_router(issues_router)
app.include_router(admin_router)
app.include_router(candidates_router)
app.include_router(scraper_ingest_router)
app.include_router(ai_analysis_router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
