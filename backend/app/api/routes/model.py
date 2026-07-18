from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.model_mapping import ModelMappingCreate, ModelMappingUpdate, ModelMappingResponse
from app.services import model_service
from typing import List

router = APIRouter()


@router.get("/", response_model=List[ModelMappingResponse])
def list_models(db: Session = Depends(get_db)):
    return model_service.get_all(db)


@router.post("/", response_model=ModelMappingResponse, status_code=201)
def create_model(payload: ModelMappingCreate, db: Session = Depends(get_db)):
    return model_service.create(db, payload)


@router.get("/{model_id}", response_model=ModelMappingResponse)
def get_model(model_id: int, db: Session = Depends(get_db)):
    obj = model_service.get_by_id(db, model_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Model not found")
    return obj


@router.put("/{model_id}", response_model=ModelMappingResponse)
def update_model(model_id: int, payload: ModelMappingUpdate, db: Session = Depends(get_db)):
    obj = model_service.update(db, model_id, payload)
    if not obj:
        raise HTTPException(status_code=404, detail="Model not found")
    return obj


@router.delete("/{model_id}", status_code=204)
def delete_model(model_id: int, db: Session = Depends(get_db)):
    model_service.delete(db, model_id)


@router.post("/{model_id}/create-table")
def create_table(model_id: int, db: Session = Depends(get_db)):
    result = model_service.create_target_table(db, model_id)
    if not result:
        raise HTTPException(status_code=404, detail="Model not found")
    return {"message": "Table created successfully", "table": result}
