from pydantic import BaseModel, HttpUrl
from typing import Optional, Any, Dict
from datetime import datetime


class ConnectorBase(BaseModel):
    name: str
    description: Optional[str] = None
    url: str
    method: str = "GET"
    headers: Optional[Dict[str, str]] = {}
    query_params: Optional[Dict[str, str]] = {}
    body: Optional[Any] = None
    pagination_type: str = "cursor"
    pagination_param: str = "page"
    cursor_path: Optional[str] = None
    data_path: str = "data.items"
    total_path: str = "data.totalItems"


class ConnectorCreate(ConnectorBase):
    pass


class ConnectorUpdate(ConnectorBase):
    pass


class ConnectorResponse(ConnectorBase):
    id: int
    sample_response: Optional[Any] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
