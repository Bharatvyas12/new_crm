from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.rbac import Role, Permission, RolePermission, UserRole
from app.schemas.rbac import RoleCreate, RoleUpdate
from app.exceptions import NotFoundError, ConflictError
import uuid


class RBACService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_roles(self) -> list[dict]:
        result = await self.db.execute(
            select(Role).options(
                selectinload(Role.role_permissions).selectinload(RolePermission.permission)
            )
        )
        roles = result.scalars().all()
        return [
            {
                "id": r.id,
                "name": r.name,
                "description": r.description,
                "is_admin": r.is_admin,
                "permissions": [
                    {"id": rp.permission.id, "code": rp.permission.code, "description": rp.permission.description}
                    for rp in r.role_permissions
                ],
            }
            for r in roles
        ]

    async def create_role(self, data: RoleCreate) -> Role:
        existing = await self.db.execute(
            select(Role).where(Role.name == data.name)
        )
        if existing.scalars().first():
            raise ConflictError(f"Role '{data.name}' already exists")

        role = Role(name=data.name, description=data.description)
        self.db.add(role)
        await self.db.flush()
        return role

    async def update_role(self, role_id: uuid.UUID, data: RoleUpdate) -> None:
        result = await self.db.execute(
            select(Role).where(Role.id == role_id)
        )
        role = result.scalars().first()
        if not role:
            raise NotFoundError("Role", str(role_id))

        if data.name is not None:
            role.name = data.name
        if data.description is not None:
            role.description = data.description

        # Update permissions if provided
        if data.permission_codes is not None:
            # Remove existing
            existing_rps = await self.db.execute(
                select(RolePermission).where(RolePermission.role_id == role_id)
            )
            for rp in existing_rps.scalars().all():
                await self.db.delete(rp)

            # Add new
            for code in data.permission_codes:
                perm_result = await self.db.execute(
                    select(Permission).where(Permission.code == code)
                )
                perm = perm_result.scalars().first()
                if perm:
                    rp = RolePermission(role_id=role_id, permission_id=perm.id)
                    self.db.add(rp)

        await self.db.flush()

    async def list_permissions(self) -> list[Permission]:
        result = await self.db.execute(
            select(Permission).order_by(Permission.code)
        )
        return result.scalars().all()

    async def assign_role_to_user(
        self, role_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        # Check if already assigned
        existing = await self.db.execute(
            select(UserRole).where(
                UserRole.user_id == user_id,
                UserRole.role_id == role_id,
            )
        )
        if existing.scalars().first():
            raise ConflictError("Role already assigned to user")

        user_role = UserRole(user_id=user_id, role_id=role_id)
        self.db.add(user_role)
        await self.db.flush()