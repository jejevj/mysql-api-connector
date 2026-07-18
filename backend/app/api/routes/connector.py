from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.connector import ConnectorCreate, ConnectorUpdate, ConnectorResponse
from app.services import connector_service
from typing import List
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/", response_model=List[ConnectorResponse])
def list_connectors(db: Session = Depends(get_db)):
    try:
        return connector_service.get_all(db)
    except Exception as e:
        logger.error(f"list_connectors error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=ConnectorResponse, status_code=201)
def create_connector(payload: ConnectorCreate, db: Session = Depends(get_db)):
    try:
        return connector_service.create(db, payload)
    except Exception as e:
        logger.error(f"create_connector error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{connector_id}", response_model=ConnectorResponse)
def get_connector(connector_id: int, db: Session = Depends(get_db)):
    obj = connector_service.get_by_id(db, connector_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Connector not found")
    return obj


@router.put("/{connector_id}", response_model=ConnectorResponse)
def update_connector(connector_id: int, payload: ConnectorUpdate, db: Session = Depends(get_db)):
    try:
        obj = connector_service.update(db, connector_id, payload)
        if not obj:
            raise HTTPException(status_code=404, detail="Connector not found")
        return obj
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"update_connector error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{connector_id}", status_code=204)
def delete_connector(connector_id: int, db: Session = Depends(get_db)):
    connector_service.delete(db, connector_id)


@router.post("/{connector_id}/test")
async def test_connector(connector_id: int, db: Session = Depends(get_db)):
    obj = connector_service.get_by_id(db, connector_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Connector not found")
    try:
        result = await connector_service.test_request(db, obj)
        return result
    except Exception as e:
        logger.error(f"test_connector error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
