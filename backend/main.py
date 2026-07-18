from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import connector, model, job
from app.core.config import settings
from app.core.database import engine, Base

Base.metadata.create_all(bind=engine)

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

app.include_router(connector.router, prefix="/api/connectors", tags=["Connectors"])
app.include_router(model.router, prefix="/api/models", tags=["Models"])
app.include_router(job.router, prefix="/api/jobs", tags=["Jobs"])


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "app": settings.APP_NAME}
