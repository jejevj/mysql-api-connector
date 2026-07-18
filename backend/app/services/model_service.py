import pymysql
from sqlalchemy.orm import Session
from app.models.model_mapping import ModelMapping
from app.schemas.model_mapping import ModelMappingCreate, ModelMappingUpdate
from typing import Optional, List


def get_all(db: Session) -> List[ModelMapping]:
    return db.query(ModelMapping).all()


def get_by_id(db: Session, model_id: int) -> Optional[ModelMapping]:
    return db.query(ModelMapping).filter(ModelMapping.id == model_id).first()


def create(db: Session, payload: ModelMappingCreate) -> ModelMapping:
    obj = ModelMapping(**payload.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update(db: Session, model_id: int, payload: ModelMappingUpdate) -> Optional[ModelMapping]:
    obj = get_by_id(db, model_id)
    if not obj:
        return None
    for key, value in payload.model_dump().items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


def delete(db: Session, model_id: int):
    obj = get_by_id(db, model_id)
    if obj:
        db.delete(obj)
        db.commit()


def create_target_table(db: Session, model_id: int) -> Optional[str]:
    obj = get_by_id(db, model_id)
    if not obj:
        return None

    conn = pymysql.connect(
        host=obj.target_db_host,
        port=obj.target_db_port,
        user=obj.target_db_user,
        password=obj.target_db_password,
        database=obj.target_db_name,
    )
    try:
        columns = []
        for field in obj.field_mappings:
            nullable = "NULL" if field.get("nullable", True) else "NOT NULL"
            columns.append(f"`{field['target']}` {field['type']} {nullable}")

        columns_sql = ",\n  ".join(columns)
        create_sql = f"""
        CREATE TABLE IF NOT EXISTS `{obj.target_table}` (
            `_id` BIGINT AUTO_INCREMENT PRIMARY KEY,
            {columns_sql}
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
        with conn.cursor() as cursor:
            cursor.execute(create_sql)
        conn.commit()

        obj.table_created = True
        db.commit()
        return obj.target_table
    finally:
        conn.close()
