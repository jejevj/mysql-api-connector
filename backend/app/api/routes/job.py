from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.job import JobCreate, JobResponse
from app.services import job_service
from app.core.redis import get_redis
from typing import List
import asyncio

router = APIRouter()


@router.get("/", response_model=List[JobResponse])
def list_jobs(db: Session = Depends(get_db)):
    return job_service.get_all(db)


@router.post("/", response_model=JobResponse, status_code=201)
def start_job(payload: JobCreate, db: Session = Depends(get_db)):
    return job_service.start(db, payload)


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    obj = job_service.get_by_id(db, job_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Job not found")
    return obj


@router.patch("/{job_id}/pause")
def pause_job(job_id: int, db: Session = Depends(get_db)):
    return job_service.pause(db, job_id)


@router.patch("/{job_id}/resume")
def resume_job(job_id: int, db: Session = Depends(get_db)):
    return job_service.resume(db, job_id)


@router.delete("/{job_id}/stop")
def stop_job(job_id: int, db: Session = Depends(get_db)):
    return job_service.stop(db, job_id)


@router.websocket("/{job_id}/logs")
async def job_logs_ws(job_id: int, websocket: WebSocket):
    await websocket.accept()
    redis = await get_redis()
    pubsub = redis.pubsub()
    await pubsub.subscribe(f"job_logs:{job_id}")
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                await websocket.send_text(message["data"])
    except WebSocketDisconnect:
        await pubsub.unsubscribe(f"job_logs:{job_id}")
