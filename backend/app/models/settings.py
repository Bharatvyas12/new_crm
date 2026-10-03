from sqlalchemy import String, ForeignKey, Text, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid, JSON
import uuid
from datetime import datetime, timezone
from app.database import Base, TimestampMixin


class BusinessSetting(TimestampMixin, Base):
    __tablename__ = "business_settings"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    key: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    data_type: Mapped[str] = mapped_column(String(20), nullable=False)  # string, number, boolean, json
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    default_value: Mapped[str | None] = mapped_column(Text, nullable=True)