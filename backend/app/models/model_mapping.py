from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base


class ModelMapping(Base):
    __tablename__ = "model_mappings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    connector_id = Column(Integer, ForeignKey("connectors.id"), nullable=False)
    target_db_host = Column(String(255), nullable=False)
    target_db_port = Column(Integer, default=3306)
    target_db_name = Column(String(255), nullable=False)
    target_db_user = Column(String(255), nullable=False)
    target_db_password = Column(String(255), nullable=False)
    target_table = Column(String(255), nullable=False)
    field_mappings = Column(JSON, default=[])
    upsert_keys = Column(JSON, default=[])
    table_created = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
