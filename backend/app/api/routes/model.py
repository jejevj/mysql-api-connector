from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.model_mapping import ModelMappingCreate, ModelMappingUpdate, ModelMappingResponse
from app.services import model_service
from pydantic import BaseModel
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


class DBConfig(BaseModel):
    host: str
    port: int = 3306
    db_name: str
    user: str
    password: Optional[str] = ""
    table: Optional[str] = None


@router.get("/", response_model=List[ModelMappingResponse])
def list_models(db: Session = Depends(get_db)):
    try:
        return model_service.get_all(db)
    except Exception as e:
        logger.error(f"list_models error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=ModelMappingResponse, status_code=201)
def create_model(payload: ModelMappingCreate, db: Session = Depends(get_db)):
    try:
        return model_service.create(db, payload)
    except Exception as e:
        logger.error(f"create_model error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{model_id}", response_model=ModelMappingResponse)
def get_model(model_id: int, db: Session = Depends(get_db)):
    obj = model_service.get_by_id(db, model_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Model not found")
    return obj


@router.put("/{model_id}", response_model=ModelMappingResponse)
def update_model(model_id: int, payload: ModelMappingUpdate, db: Session = Depends(get_db)):
    try:
        obj = model_service.update(db, model_id, payload)
        if not obj:
            raise HTTPException(status_code=404, detail="Model not found")
        return obj
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"update_model error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{model_id}", status_code=204)
def delete_model(model_id: int, db: Session = Depends(get_db)):
    model_service.delete(db, model_id)


@router.post("/{model_id}/create-table")
def create_table(model_id: int, db: Session = Depends(get_db)):
    result = model_service.create_target_table(db, model_id)
    if not result:
        raise HTTPException(status_code=404, detail="Model not found")
    return {"message": "Table created successfully", "table": result}


@router.post("/db-tables")
async def get_db_tables(config: DBConfig):
    """List semua tabel dari database target"""
    try:
        tables = await model_service.get_target_tables(
            host=config.host, port=config.port, db_name=config.db_name,
            user=config.user, password=config.password or ""
        )
        return {"tables": tables}
    except Exception as e:
        logger.error(f"get_db_tables error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/db-columns")
async def get_db_columns(config: DBConfig):
    """List semua kolom dari tabel target beserta tipe datanya"""
    if not config.table:
        raise HTTPException(status_code=400, detail="table is required")
    try:
        columns = await model_service.get_target_columns(
            host=config.host, port=config.port, db_name=config.db_name,
            user=config.user, password=config.password or "", table=config.table
        )
        return {"columns": columns}
    except Exception as e:
        logger.error(f"get_db_columns error: {e}", exc_info=True)
        raise HTTPException(status_code=400, detail=str(e))
