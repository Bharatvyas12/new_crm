from pydantic import BaseModel
import uuid


class RoleCreate(BaseModel):
    name: str
    description: str | None = None


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    permission_codes: list[str] | None = None


class PermissionResponse(BaseModel):
    id: uuid.UUID
    code: str
    description: str | None = None

    model_config = {"from_attributes": True}


class RoleResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    is_admin: bool
    permissions: list[PermissionResponse] = []

    model_config = {"from_attributes": True}