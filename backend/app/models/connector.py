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
    headers = Column(JSON, nullable=True, default={})
    query_params = Column(JSON, nullable=True, default={})
    body = Column(JSON, nullable=True)
    pagination_type = Column(String(20), default="cursor")
    pagination_param = Column(String(100), default="page")
    cursor_path = Column(String(255), nullable=True)
    data_path = Column(String(255), default="data.items")
    total_path = Column(String(255), default="data.totalItems")
    sample_response = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
