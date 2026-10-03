from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.user import User, Session
from app.models.rbac import UserRole, RolePermission, Role
from app.utils.security import verify_password, generate_session_token, generate_csrf_token
from app.exceptions import UnauthorizedError
from app.config import settings
from datetime import datetime, timedelta, timezone
import uuid


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def authenticate_user(self, email: str, password: str) -> User:
        result = await self.db.execute(
            select(User)
            .where(User.email == email)
            .options(selectinload(User.employee))
        )
        user = result.scalars().first()

        if not user or not verify_password(user.hashed_password, password):
            raise UnauthorizedError("Invalid email or password")
        if not user.is_active:
            raise UnauthorizedError("Account is disabled")
        return user

    async def create_session(
        self, user_id: uuid.UUID, ip_address: str, user_agent: str
    ) -> Session:
        token = generate_session_token()
        csrf_token = generate_csrf_token()
        expires_at = datetime.now(timezone.utc) + timedelta(
            hours=settings.SESSION_EXPIRE_HOURS
        )

        session = Session(
            user_id=user_id,
            token=token,
            csrf_token=csrf_token,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(session)
        await self.db.flush()
        return session

    async def get_user_permissions(self, user: User) -> list[str]:
        if user.is_superuser:
            return ["*"]

        result = await self.db.execute(
            select(UserRole)
            .where(UserRole.user_id == user.id)
            .options(
                selectinload(UserRole.role)
                .selectinload(Role.role_permissions)
                .selectinload(RolePermission.permission)
            )
        )
        user_roles = result.scalars().all()

        permissions = set()
        for ur in user_roles:
            if ur.role.is_admin:
                return ["*"]
            for rp in ur.role.role_permissions:
                permissions.add(rp.permission.code)
        return list(permissions)

    async def destroy_session(self, token: str) -> None:
        result = await self.db.execute(
            select(Session).where(Session.token == token)
        )
        session = result.scalars().first()
        if session:
            await self.db.delete(session)