from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    model_mapping_id = Column(Integer, ForeignKey("model_mappings.id"), nullable=False)
    celery_task_id = Column(String(255), nullable=True)
    status = Column(String(20), default="pending")  # pending/running/paused/done/error/stopped
    total_items = Column(Integer, default=0)
    processed_items = Column(Integer, default=0)
    failed_items = Column(Integer, default=0)
    current_cursor = Column(String(255), nullable=True)
    current_page = Column(Integer, default=1)
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
