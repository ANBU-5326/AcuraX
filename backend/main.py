import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.api.v1 import api_router
from app.db.session import engine, get_db
from app.config import settings

# ── Ensure storage directory exists ──────────────────────────────────────────
os.makedirs(os.path.join(settings.STORAGE_DIR, "documents"), exist_ok=True)

app = FastAPI(
    title="AcuraX API",
    description="Multi-Agent AI Orchestration Suite - Backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS Configuration ────────────────────────────────────────────────────────
# Allow both localhost variants for Next.js dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static File Serving ───────────────────────────────────────────────────────
documents_storage_dir = os.path.join(settings.STORAGE_DIR, "documents")
if os.path.exists(documents_storage_dir):
    app.mount(
        "/storage/documents",
        StaticFiles(directory=documents_storage_dir),
        name="documents",
    )

# ── API Routes ────────────────────────────────────────────────────────────────
app.include_router(api_router, prefix="/api/v1")


# ── Health Check (queries DB) ─────────────────────────────────────────────────
@app.get("/health")
@app.get("/api/v1/health")
async def health_check():
    """Health check that verifies database connectivity."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"status": "error", "database": "disconnected", "detail": str(e)},
        )


# ── Startup Event ─────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """
    DO NOT call Base.metadata.create_all() here.
    Tables already exist in acurax_db — created via pgAdmin.
    We only verify connectivity on startup.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connection verified: acurax_db @ localhost:5432")
    except Exception as e:
        print(f"⚠️  Database connection failed: {e}")
        print("    Check DATABASE_URL in backend/.env")
