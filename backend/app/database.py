from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime
from datetime import datetime, timezone
from app.config import settings
import uuid

engine_kwargs = {
    "echo": settings.ENVIRONMENT == "development",
    "future": True,
}

if "sqlite" not in settings.DATABASE_URL:
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 10,
        "max_overflow": 20,
    })

engine = create_async_engine(
    settings.DATABASE_URL,
    **engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    """Base class with common timestamp columns."""
    pass


class TimestampMixin:
    """Mixin for created_at and updated_at timestamps."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise