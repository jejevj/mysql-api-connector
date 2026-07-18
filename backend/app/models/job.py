from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, BigInteger
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class SyncJob(Base):
    __tablename__ = "sync_jobs"

    id = Column(Integer, primary_key=True, index=True)
    model_mapping_id = Column(Integer, ForeignKey("model_mappings.id"), nullable=False)
    celery_task_id = Column(String(255), nullable=True)

    status = Column(String(50), default="pending")  # pending | running | paused | stopped | done | error
    total_items = Column(BigInteger, default=0)
    processed_items = Column(BigInteger, default=0)
    failed_items = Column(BigInteger, default=0)
    current_cursor = Column(String(255), nullable=True)
    current_page = Column(Integer, default=1)

    error_message = Column(String(1000), nullable=True)
    meta = Column(JSON, default={})

    model_mapping = relationship("ModelMapping", backref="sync_jobs")

    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
