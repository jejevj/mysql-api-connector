from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class ModelMapping(Base):
    __tablename__ = "model_mappings"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    connector_id = Column(Integer, ForeignKey("connectors.id"), nullable=False)

    # Target database connection
    target_db_host = Column(String(255), nullable=False)
    target_db_port = Column(Integer, default=3306)
    target_db_name = Column(String(255), nullable=False)
    target_db_user = Column(String(255), nullable=False)
    target_db_password = Column(String(255), nullable=False)
    target_table = Column(String(255), nullable=False)

    # Field mapping: [{"source": "nama_field", "target": "column_name", "type": "VARCHAR(255)"}]
    field_mappings = Column(JSON, default=[])

    # Upsert key columns
    upsert_keys = Column(JSON, default=[])  # e.g. ["nomor_kartu_keluarga"]

    table_created = Column(Boolean, default=False)

    connector = relationship("Connector", backref="model_mappings")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
