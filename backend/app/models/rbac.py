from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid
import uuid
from app.database import Base


class Role(Base):
    __tablename__ = "roles"
    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(50), unique=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)

    role_permissions = relationship("RolePermission", back_populates="role")


class Permission(Base):
    __tablename__ = "permissions"
    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(100), unique=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)


class RolePermission(Base):
    __tablename__ = "role_permissions"
    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"))
    permission_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("permissions.id", ondelete="CASCADE"))

    role = relationship("Role", back_populates="role_permissions")
    permission = relationship("Permission")


class UserRole(Base):
    __tablename__ = "user_roles"
    id: Mapped[uuid.UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    role_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("roles.id", ondelete="CASCADE"))

    user = relationship("User", back_populates="roles")
    role = relationship("Role")