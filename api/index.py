import sys
from pathlib import Path

# Add backend directory to sys.path so app imports work seamlessly
backend_path = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from app.main import app  # Exports FastAPI app for Vercel ASGI runtime
