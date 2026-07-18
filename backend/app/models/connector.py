from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class Connector(Base):
    __tablename__ = "connectors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    url = Column(Text, nullable=False)
    method = Column(String(10), default="GET")
    headers = Column(JSON, default={})
    query_params = Column(JSON, default={})
    body = Column(JSON, nullable=True)

    # Pagination config
    pagination_type = Column(String(50), default="cursor")  # cursor | page | offset
    pagination_param = Column(String(100), default="page")
    cursor_path = Column(String(255), nullable=True)  # JSON path ke cursor di response
    data_path = Column(String(255), default="data.items")  # JSON path ke array data
    total_path = Column(String(255), default="data.totalItems")  # JSON path ke total

    sample_response = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
