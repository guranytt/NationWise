import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent / "backend"
backend_app_dir = backend_dir / "app"

if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Replace package search path completely with backend/app
__path__ = [str(backend_app_dir)]
