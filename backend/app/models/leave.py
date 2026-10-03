from sqlalchemy import String, ForeignKey, Text, DateTime, Float, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid
import uuid
import enum
from datetime import datetime, timezone
from app.database import Base, TimestampMixin


class LeaveType(TimestampMixin, Base):
    __tablename__ = "leave_types"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    annual_quota: Mapped[int] = mapped_column(Integer, default=0)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)


class LeaveRequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"


class LeavePeriod(str, enum.Enum):
    FULL_DAY = "FULL_DAY"
    FIRST_HALF = "FIRST_HALF"
    SECOND_HALF = "SECOND_HALF"


class LeaveRequest(TimestampMixin, Base):
    __tablename__ = "leave_requests"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), index=True
    )
    leave_type_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("leave_types.id"), nullable=False
    )
    start_date: Mapped[str] = mapped_column(String(10), nullable=False)  # YYYY-MM-DD
    end_date: Mapped[str] = mapped_column(String(10), nullable=False)
    period: Mapped[str] = mapped_column(
        String(20), default=LeavePeriod.FULL_DAY.value
    )
    total_days: Mapped[float] = mapped_column(Float, default=1.0)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default=LeaveRequestStatus.PENDING.value, index=True
    )
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), nullable=True
    )
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    employee = relationship("Employee")
    leave_type: Mapped["LeaveType"] = relationship("LeaveType")


class LeaveBalance(TimestampMixin, Base):
    __tablename__ = "leave_balances"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), index=True
    )
    leave_type_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("leave_types.id"), nullable=False
    )
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    total_quota: Mapped[float] = mapped_column(Float, default=0.0)
    used: Mapped[float] = mapped_column(Float, default=0.0)
    remaining: Mapped[float] = mapped_column(Float, default=0.0)

    employee = relationship("Employee")
    leave_type: Mapped["LeaveType"] = relationship("LeaveType")