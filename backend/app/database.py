from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, String, Integer, JSON
from datetime import datetime, timezone
from app.config import settings
import uuid


def get_clean_database_url() -> str:
    url = (settings.DATABASE_URL or "").strip()
    if not url:
        return "sqlite+aiosqlite:///./test.db"
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://") and not url.startswith("postgresql+psycopg://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


CLEAN_DB_URL = get_clean_database_url()

engine_kwargs = {
    "echo": False,
    "future": True,
}

if "sqlite" not in CLEAN_DB_URL:
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_size": 5,
        "max_overflow": 10,
    })

engine = create_async_engine(
    CLEAN_DB_URL,
    **engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


class Base(DeclarativeBase):
    """Base class with common timestamp columns."""
    pass


class CloudSyncStore(Base):
    """Persistent PostgreSQL table for real-time multi-device cloud synchronization."""
    __tablename__ = "crm_cloud_sync"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, default="default")
    version: Mapped[int] = mapped_column(Integer, default=1)
    updated_at: Mapped[str] = mapped_column(String(100), default=lambda: datetime.now(timezone.utc).isoformat())
    data: Mapped[dict] = mapped_column(JSON)


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