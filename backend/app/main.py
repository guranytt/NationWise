from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup
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

app.include_router(categories_router)
app.include_router(locations_router)
app.include_router(issues_router)
app.include_router(admin_router)
app.include_router(candidates_router)
app.include_router(scraper_ingest_router)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
