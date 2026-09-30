"""
GramBiz AI — Unified Single-Port Full-Stack Server
Runs both the React UI and FastAPI backend on http://localhost:8000/
"""
import os
import sys
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT_DIR / "frontend"
BACKEND_DIR = ROOT_DIR / "backend"
DIST_DIR = FRONTEND_DIR / "dist"

def ensure_frontend_built():
    index_html = DIST_DIR / "index.html"
    if not index_html.exists():
        print("[GramBiz AI] Initial production build of frontend...")
        subprocess.run(["npm", "run", "build"], cwd=str(FRONTEND_DIR), shell=True, check=True)
    else:
        print("[GramBiz AI] Frontend bundle verified at frontend/dist.")

def main():
    ensure_frontend_built()

    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")

    # Ensure backend directory is in sys.path
    if str(BACKEND_DIR) not in sys.path:
        sys.path.insert(0, str(BACKEND_DIR))
    os.environ["PYTHONPATH"] = str(BACKEND_DIR)

    print("\n" + "=" * 60)
    print("  GramBiz AI — Unified Single-Port Server")
    print(f"  URL:       http://localhost:{port}/")
    print(f"  API Docs:  http://localhost:{port}/docs")
    print(f"  Single Port: {port} (React Frontend + FastAPI Backend)")
    print("=" * 60 + "\n")

    import uvicorn
    uvicorn.run("app.main:app", host=host, port=port, reload=True)

if __name__ == "__main__":
    main()
