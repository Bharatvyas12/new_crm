from sqlalchemy import String, ForeignKey, Text, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid
import uuid
import enum
from datetime import datetime, timezone
from app.database import Base, TimestampMixin


class ComplaintStatus(str, enum.Enum):
    OPEN = "OPEN"
    UNDER_INVESTIGATION = "UNDER_INVESTIGATION"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"
    CLOSED = "CLOSED"


class ComplaintVisibility(str, enum.Enum):
    EMPLOYEE_PRIVATE = "EMPLOYEE_PRIVATE"
    ADMIN_ONLY = "ADMIN_ONLY"
    PUBLIC = "PUBLIC"


class ComplaintCategory(TimestampMixin, Base):
    __tablename__ = "complaint_categories"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Complaint(TimestampMixin, Base):
    __tablename__ = "complaints"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    category_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("complaint_categories.id"), nullable=False
    )
    raised_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), index=True
    )
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(30), default=ComplaintStatus.OPEN.value, index=True
    )
    visibility: Mapped[str] = mapped_column(
        String(20), default=ComplaintVisibility.EMPLOYEE_PRIVATE.value
    )
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), nullable=True
    )
    resolved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    resolution_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    category: Mapped["ComplaintCategory"] = relationship("ComplaintCategory")
    employee = relationship("Employee")
    comments: Mapped[list["ComplaintComment"]] = relationship(
        "ComplaintComment", back_populates="complaint", cascade="all, delete-orphan"
    )


class ComplaintComment(TimestampMixin, Base):
    __tablename__ = "complaint_comments"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    complaint_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("complaints.id", ondelete="CASCADE"), index=True
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_internal: Mapped[bool] = mapped_column(Boolean, default=False)

    complaint: Mapped["Complaint"] = relationship(
        "Complaint", back_populates="comments"
    )