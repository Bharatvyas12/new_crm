from pydantic import BaseModel
import uuid
from datetime import datetime


class SettingResponse(BaseModel):
    id: uuid.UUID
    key: str
    value: str
    category: str
    data_type: str
    label: str
    description: str | None = None
    default_value: str | None = None

    model_config = {"from_attributes": True}


class SettingUpdate(BaseModel):
    key: str
    value: str


class SettingBulkUpdate(BaseModel):
    settings: list[SettingUpdate]


class SettingSchemaItem(BaseModel):
    key: str
    label: str
    category: str
    data_type: str
    description: str | None = None
    current_value: str
    default_value: str | None = None