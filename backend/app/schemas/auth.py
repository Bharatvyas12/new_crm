from pydantic import BaseModel, EmailStr, Field
import uuid
from datetime import datetime


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=4, max_length=128)


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    is_active: bool
    is_superuser: bool
    permissions: list[str] = []
    employee_id: uuid.UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionInfo(BaseModel):
    user: UserResponse
    csrf_token: str