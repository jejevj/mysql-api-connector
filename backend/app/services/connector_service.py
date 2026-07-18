import httpx
from sqlalchemy.orm import Session
from app.models.connector import Connector
from app.schemas.connector import ConnectorCreate, ConnectorUpdate
from typing import Optional, List


def get_all(db: Session) -> List[Connector]:
    return db.query(Connector).all()


def get_by_id(db: Session, connector_id: int) -> Optional[Connector]:
    return db.query(Connector).filter(Connector.id == connector_id).first()


def create(db: Session, payload: ConnectorCreate) -> Connector:
    obj = Connector(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update(db: Session, connector_id: int, payload: ConnectorUpdate) -> Optional[Connector]:
    obj = get_by_id(db, connector_id)
    if not obj:
        return None
    for key, value in payload.model_dump().items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete(db: Session, connector_id: int):
    obj = get_by_id(db, connector_id)
    if obj:
        db.delete(obj)
        db.commit()


async def test_request(db: Session, connector: Connector) -> dict:
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.request(
            method=connector.method,
            url=connector.url,
            headers=connector.headers or {},
            params=connector.query_params or {},
            json=connector.body if connector.method in ["POST", "PUT", "PATCH"] else None,
        )
        data = response.json()
        # Simpan sample response
        connector.sample_response = data
        db.commit()
        return {
            "status_code": response.status_code,
            "response": data,
        }
