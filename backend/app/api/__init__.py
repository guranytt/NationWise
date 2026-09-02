from .categories import router as categories_router
from .locations import router as locations_router
from .issues import router as issues_router
from .admin import router as admin_router
from .candidates import router as candidates_router
from .scraper_ingest import router as scraper_ingest_router

__all__ = [
    "categories_router", "locations_router", "issues_router", "admin_router",
    "candidates_router", "scraper_ingest_router"
]
