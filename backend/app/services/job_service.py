from sqlalchemy.orm import Session
from app.models.job import SyncJob
from app.schemas.job import JobCreate
from app.tasks.sync_task import run_sync
from celery_app import celery_app
import redis
from app.core.config import settings
from typing import Optional, List
from datetime import datetime

r = redis.from_url(settings.REDIS_URL, decode_responses=True)


def get_all(db: Session) -> List[SyncJob]:
    return db.query(SyncJob).all()


def get_by_id(db: Session, job_id: int) -> Optional[SyncJob]:
    return db.query(SyncJob).filter(SyncJob.id == job_id).first()


def start(db: Session, payload: JobCreate) -> SyncJob:
    job = SyncJob(
        model_mapping_id=payload.model_mapping_id,
        status="pending",
        started_at=datetime.utcnow(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    r.set(f"job_state:{job.id}", "running")

    task = run_sync.apply_async(args=[job.id])
    job.celery_task_id = task.id
    job.status = "running"
    db.commit()
    return job


def pause(db: Session, job_id: int) -> dict:
    r.set(f"job_state:{job_id}", "paused")
    job = get_by_id(db, job_id)
    if job:
        job.status = "paused"
        db.commit()
    return {"message": f"Job {job_id} paused"}


def resume(db: Session, job_id: int) -> dict:
    r.set(f"job_state:{job_id}", "running")
    job = get_by_id(db, job_id)
    if job:
        job.status = "running"
        db.commit()
    return {"message": f"Job {job_id} resumed"}


def stop(db: Session, job_id: int) -> dict:
    r.set(f"job_state:{job_id}", "stopped")
    job = get_by_id(db, job_id)
    if job:
        if job.celery_task_id:
            celery_app.control.revoke(job.celery_task_id, terminate=True)
        job.status = "stopped"
        job.finished_at = datetime.utcnow()
        db.commit()
    return {"message": f"Job {job_id} stopped"}
