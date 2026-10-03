from sqlalchemy import String, Boolean, DateTime, Text, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship
import uuid
from datetime import datetime, timezone
from app.database import Base, TimestampMixin


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    roles: Mapped[list["UserRole"]] = relationship(
        "UserRole", back_populates="user", lazy="selectin"
    )
    sessions: Mapped[list["Session"]] = relationship(
        "Session", back_populates="user", cascade="all, delete-orphan"
    )
    employee: Mapped["Employee | None"] = relationship(
        "Employee", back_populates="user", uselist=False
    )


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    csrf_token: Mapped[str] = mapped_column(String(128))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ip_address: Mapped[str | None] = mapped_column(String(50), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship("User", back_populates="sessions")


# Avoid circular import — used for type hints only
from app.models.employee import Employee  # noqa: E402, F401
from app.models.rbac import UserRole  # noqa: E402, F401