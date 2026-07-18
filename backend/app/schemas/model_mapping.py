from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Any
from datetime import datetime


class FieldMappingItem(BaseModel):
    source: str
    target: str
    type: str = "TEXT"
    nullable: bool = True


class ModelMappingBase(BaseModel):
    name: str
    connector_id: int
    target_db_host: str
    target_db_port: int = 3306
    target_db_name: str
    target_db_user: str
    target_db_password: str
    target_table: str
    field_mappings: List[FieldMappingItem] = []
    upsert_keys: List[str] = []


class ModelMappingCreate(ModelMappingBase):
    pass


class ModelMappingUpdate(ModelMappingBase):
    pass


class ModelMappingResponse(ModelMappingBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    table_created: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
