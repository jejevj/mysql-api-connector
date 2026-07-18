from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class JobCreate(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    model_mapping_id: int


class JobResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    id: int
    model_mapping_id: int
    celery_task_id: Optional[str] = None
    status: str
    total_items: int
    processed_items: int
    failed_items: int
    current_cursor: Optional[str] = None
    current_page: int
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
