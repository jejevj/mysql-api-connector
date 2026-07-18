from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional, Any, Dict
from datetime import datetime
import json


class ConnectorBase(BaseModel):
    name: str
    description: Optional[str] = None
    url: str
    method: str = "GET"
    headers: Optional[Dict[str, Any]] = {}
    query_params: Optional[Dict[str, Any]] = {}
    body: Optional[Any] = None
    pagination_type: str = "cursor"
    pagination_param: str = "page"
    cursor_path: Optional[str] = None
    data_path: str = "data.items"
    total_path: str = "data.totalItems"

    @field_validator('headers', 'query_params', mode='before')
    @classmethod
    def parse_json_dict(cls, v):
        if v is None:
            return {}
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                return parsed if isinstance(parsed, dict) else {}
            except (json.JSONDecodeError, ValueError):
                return {}
        return v

    @field_validator('body', mode='before')
    @classmethod
    def parse_json_body(cls, v):
        if v is None or v == '' or v == 'null':
            return None
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, ValueError):
                return None
        return v


class ConnectorCreate(ConnectorBase):
    pass


class ConnectorUpdate(ConnectorBase):
    pass


class ConnectorResponse(ConnectorBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sample_response: Optional[Any] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
