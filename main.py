import sys
import os
from pathlib import Path

# Add backend directory to sys.path so app imports work seamlessly
backend_path = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(backend_path))

from app.main import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, app_dir=str(backend_path))
