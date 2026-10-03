from sqlalchemy import String, ForeignKey, Text, Boolean, DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid
import uuid
import enum
from datetime import datetime, timezone
from app.database import Base, TimestampMixin


class TaskStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class TaskPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class Task(TimestampMixin, Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default=TaskStatus.DRAFT.value, index=True
    )
    priority: Mapped[str] = mapped_column(
        String(20), default=TaskPriority.MEDIUM.value
    )
    due_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    requires_evidence: Mapped[bool] = mapped_column(Boolean, default=False)
    allow_self_review: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )

    assignments: Mapped[list["TaskAssignment"]] = relationship(
        "TaskAssignment", back_populates="task", cascade="all, delete-orphan"
    )
    submissions: Mapped[list["TaskSubmission"]] = relationship(
        "TaskSubmission", back_populates="task", cascade="all, delete-orphan"
    )


class TaskAssignment(Base):
    __tablename__ = "task_assignments"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    task_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), index=True
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), index=True
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    task: Mapped["Task"] = relationship("Task", back_populates="assignments")
    employee = relationship("Employee")


class TaskSubmission(TimestampMixin, Base):
    __tablename__ = "task_submissions"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    task_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"), index=True
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), index=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="PENDING")
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), nullable=True
    )
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    task: Mapped["Task"] = relationship("Task", back_populates="submissions")
    employee = relationship("Employee")