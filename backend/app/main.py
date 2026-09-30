import os
from pathlib import Path
from dotenv import load_dotenv

# Load root .env
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.database.database import engine, Base
from app.api.routers import assessment, financial, business, ai, schemes, location, user_sync

# Auto-create tables on startup
Base.metadata.create_all(bind=engine)

def _run_migrations():
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            if engine.dialect.name == "sqlite":
                result = conn.execute(text("PRAGMA table_info(users)")).fetchall()
                existing_cols = [r[1] for r in result]
                if existing_cols:
                    if "village" not in existing_cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN village VARCHAR"))
                    if "district" not in existing_cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN district VARCHAR"))
                    conn.commit()
            elif engine.dialect.name in ("postgresql", "postgres"):
                result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'")).fetchall()
                existing_cols = [r[0] for r in result]
                if existing_cols:
                    if "village" not in existing_cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN village VARCHAR"))
                    if "district" not in existing_cols:
                        conn.execute(text("ALTER TABLE users ADD COLUMN district VARCHAR"))
                    conn.commit()
    except Exception:
        pass

_run_migrations()

app = FastAPI(
    title="GramBiz AI API",
    description="Hyper-Local Business Advisory & Smart Scheme Assistant API",
    version="1.0.0"
)

# CORS setup
origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assessment.router)
app.include_router(financial.router)
app.include_router(business.router)
app.include_router(ai.router)
app.include_router(schemes.router)
app.include_router(location.router)
app.include_router(user_sync.router)

@app.get("/api")
def read_root():
    return {
        "status": "online",
        "app": "GramBiz AI Backend API",
        "version": "1.0.0",
        "documentation": "/docs"
    }

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

# ============================================================
# SINGLE PORT INTEGRATION: Serve Built React SPA Frontend
# ============================================================
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"

NO_CACHE_HEADERS = {
    "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0",
    "Pragma": "no-cache",
    "Expires": "0",
}

if FRONTEND_DIST.exists():
    # Mount assets directory (CSS, JS, fonts)
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    # Serve root SPA index
    @app.get("/", include_in_schema=False)
    async def serve_root():
        index_file = FRONTEND_DIST / "index.html"
        if index_file.is_file():
            return FileResponse(index_file, headers=NO_CACHE_HEADERS)
        return {"status": "online", "message": "GramBiz AI API online. Frontend build index not found."}

    # Serve direct static files and catch-all client routes
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa_and_files(full_path: str):
        # Do not intercept API routes, health checks, or OpenAPI docs
        if (
            full_path.startswith("api/")
            or full_path == "api"
            or full_path.startswith("health")
            or full_path in ("docs", "redoc", "openapi.json")
        ):
            raise StarletteHTTPException(status_code=404, detail="API endpoint not found")

        # 1. Direct file check in frontend/dist (e.g. sw.js, manifest.webmanifest, vite.svg)
        direct_file = FRONTEND_DIST / full_path
        if direct_file.is_file():
            headers = NO_CACHE_HEADERS if full_path in ("sw.js", "manifest.webmanifest", "index.html") else {}
            return FileResponse(direct_file, headers=headers)

        # 2. SPA fallback for client-side routing
        index_file = FRONTEND_DIST / "index.html"
        if index_file.is_file():
            return FileResponse(index_file, headers=NO_CACHE_HEADERS)

        raise StarletteHTTPException(status_code=404, detail="Page not found")


