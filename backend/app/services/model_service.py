import aiomysql
from sqlalchemy.orm import Session
from app.models.model_mapping import ModelMapping
from app.schemas.model_mapping import ModelMappingCreate, ModelMappingUpdate
from typing import Optional, List
import json
import logging

logger = logging.getLogger(__name__)


def get_all(db: Session) -> List[ModelMapping]:
    return db.query(ModelMapping).all()


def get_by_id(db: Session, model_id: int) -> Optional[ModelMapping]:
    return db.query(ModelMapping).filter(ModelMapping.id == model_id).first()


def create(db: Session, payload: ModelMappingCreate) -> ModelMapping:
    data = payload.model_dump()
    data['upsert_keys'] = data.get('upsert_keys') or []
    data['field_mappings'] = data.get('field_mappings') or []
    obj = ModelMapping(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update(db: Session, model_id: int, payload: ModelMappingUpdate) -> Optional[ModelMapping]:
    obj = get_by_id(db, model_id)
    if not obj:
        return None
    data = payload.model_dump()
    data['upsert_keys'] = data.get('upsert_keys') or []
    data['field_mappings'] = data.get('field_mappings') or []
    for key, value in data.items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete(db: Session, model_id: int):
    obj = get_by_id(db, model_id)
    if obj:
        db.delete(obj)
        db.commit()


def create_target_table(db: Session, model_id: int):
    obj = get_by_id(db, model_id)
    if not obj:
        return None
    return obj.target_table


async def get_target_tables(host: str, port: int, db_name: str, user: str, password: str) -> List[str]:
    """Ambil daftar tabel dari database target via aiomysql"""
    conn = await aiomysql.connect(
        host=host, port=port, db=db_name,
        user=user, password=password,
        connect_timeout=10, charset='utf8mb4'
    )
    try:
        async with conn.cursor() as cur:
            await cur.execute("SHOW TABLES")
            rows = await cur.fetchall()
            return [row[0] for row in rows]
    finally:
        conn.close()


async def get_target_columns(host: str, port: int, db_name: str, user: str, password: str, table: str) -> List[dict]:
    """Ambil kolom + tipe data dari tabel target"""
    conn = await aiomysql.connect(
        host=host, port=port, db=db_name,
        user=user, password=password,
        connect_timeout=10, charset='utf8mb4'
    )
    try:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(f"DESCRIBE `{table}`")
            rows = await cur.fetchall()
            return [
                {
                    "column": row["Field"],
                    "type": row["Type"],
                    "nullable": row["Null"] == "YES",
                    "key": row["Key"],
                    "default": row["Default"],
                }
                for row in rows
            ]
    finally:
        conn.close()
