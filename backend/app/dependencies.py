from fastapi import Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.user import User, Session
from app.models.rbac import UserRole, RolePermission, Role
from app.exceptions import UnauthorizedError, ForbiddenError
from datetime import datetime, timezone


async def get_current_session(
    request: Request, db: AsyncSession = Depends(get_db)
) -> Session:
    session_token = request.cookies.get("wcrm_session")
    if not session_token:
        raise UnauthorizedError("Not authenticated")

    result = await db.execute(
        select(Session)
        .where(Session.token == session_token)
        .options(selectinload(Session.user))
    )
    session = result.scalars().first()

    if not session or session.expires_at < datetime.now(timezone.utc):
        raise UnauthorizedError("Session expired or invalid")

    if not session.user.is_active:
        raise UnauthorizedError("Account is disabled")

    return session


async def get_current_user(
    session: Session = Depends(get_current_session),
) -> User:
    return session.user


def require(permission_code: str):
    """Dependency factory that checks the current user has a specific permission."""

    async def permission_checker(
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ) -> User:
        # Superuser always has access
        if user.is_superuser:
            return user

        # Load roles with permissions
        result = await db.execute(
            select(UserRole)
            .where(UserRole.user_id == user.id)
            .options(
                selectinload(UserRole.role)
                .selectinload(Role.role_permissions)
                .selectinload(RolePermission.permission)
            )
        )
        user_roles = result.scalars().all()

        for ur in user_roles:
            if ur.role.is_admin:
                return user
            for rp in ur.role.role_permissions:
                if rp.permission.code == permission_code:
                    return user

        raise ForbiddenError(
            f"Missing permission: {permission_code}"
        )

    return permission_checker