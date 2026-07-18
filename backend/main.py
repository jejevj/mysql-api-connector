from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.routes import connector, model, job
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
import traceback
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Buat tabel metadata saat startup
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified successfully")
except Exception as e:
    logger.error(f"FATAL: Could not create database tables: {e}")
    logger.error("Pastikan database 'mac_meta' sudah dibuat dan MySQL bisa diakses dari container.")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="MySQL API Connector — ETL tool berbasis web",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_detail = str(exc)
    tb = traceback.format_exc()
    logger.error(f"Unhandled error on {request.method} {request.url}: {error_detail}")
    logger.error(tb)
    return JSONResponse(
        status_code=500,
        content={
            "detail": error_detail,
            "type": type(exc).__name__,
            "path": str(request.url),
        },
    )


app.include_router(connector.router, prefix="/api/connectors", tags=["Connectors"])
app.include_router(model.router, prefix="/api/models", tags=["Models"])
app.include_router(job.router, prefix="/api/jobs", tags=["Jobs"])


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}


@app.get("/health/db", tags=["Health"])
def health_db():
    """Cek koneksi ke database metadata"""
    try:
        db = SessionLocal()
        db.execute(__import__('sqlalchemy').text("SELECT 1"))
        db.close()
        return {"status": "ok", "database": "connected", "url": settings.DATABASE_SYNC_URL.split("@")[-1]}
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={"status": "error", "database": "disconnected", "detail": str(e)},
        )
