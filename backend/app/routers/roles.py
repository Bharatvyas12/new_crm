from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.rbac import RoleCreate, RoleUpdate
from app.services.rbac_service import RBACService
from app.dependencies import require
from app.models.user import User
import uuid

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("/")
async def list_roles(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("rbac.roles.read")),
):
    service = RBACService(db)
    return await service.list_roles()


@router.post("/")
async def create_role(
    data: RoleCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("rbac.roles.write")),
):
    service = RBACService(db)
    role = await service.create_role(data)
    return {"message": "Role created", "id": str(role.id)}


@router.patch("/{role_id}")
async def update_role(
    role_id: uuid.UUID,
    data: RoleUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("rbac.roles.write")),
):
    service = RBACService(db)
    await service.update_role(role_id, data)
    return {"message": "Role updated"}


@router.get("/permissions")
async def list_permissions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("rbac.permissions.read")),
):
    service = RBACService(db)
    return await service.list_permissions()


@router.post("/{role_id}/users/{user_id}")
async def assign_role_to_user(
    role_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require("rbac.roles.write")),
):
    service = RBACService(db)
    await service.assign_role_to_user(role_id, user_id)
    return {"message": "Role assigned"}