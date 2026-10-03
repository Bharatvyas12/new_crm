from sqlalchemy import String, ForeignKey, DateTime, Float, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid
import uuid
import enum
from datetime import datetime, timezone, date
from app.database import Base, TimestampMixin


class DayClassification(str, enum.Enum):
    FULL_DAY = "FULL_DAY"
    HALF_DAY = "HALF_DAY"
    PARTIAL_DAY = "PARTIAL_DAY"
    ABSENT = "ABSENT"


class EventType(str, enum.Enum):
    CHECK_IN = "CHECK_IN"
    CHECK_OUT = "CHECK_OUT"
    BREAK_START = "BREAK_START"
    BREAK_END = "BREAK_END"


class CorrectionStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class AttendanceRecord(TimestampMixin, Base):
    __tablename__ = "attendance_records"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), index=True
    )
    date: Mapped[str] = mapped_column(String(10), index=True)  # YYYY-MM-DD
    check_in_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    check_out_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    break_start_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    break_end_time: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Calculated fields
    work_hours: Mapped[float] = mapped_column(Float, default=0.0)
    overtime_hours: Mapped[float] = mapped_column(Float, default=0.0)
    break_duration_minutes: Mapped[float] = mapped_column(Float, default=0.0)
    day_classification: Mapped[str] = mapped_column(
        String(20), default=DayClassification.ABSENT.value
    )

    # GPS data captured at check-in
    check_in_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    check_in_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    check_in_accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)

    # QR verification
    qr_token_used: Mapped[str | None] = mapped_column(String(128), nullable=True)
    verification_mode: Mapped[str | None] = mapped_column(String(20), nullable=True)

    is_late: Mapped[bool] = mapped_column(Boolean, default=False)
    is_early_checkout: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationship
    employee = relationship("Employee")
    events: Mapped[list["AttendanceEvent"]] = relationship(
        "AttendanceEvent", back_populates="record", cascade="all, delete-orphan"
    )


class AttendanceEvent(Base):
    __tablename__ = "attendance_events"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    record_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("attendance_records.id", ondelete="CASCADE"), index=True
    )
    event_type: Mapped[str] = mapped_column(String(20), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    qr_token: Mapped[str | None] = mapped_column(String(128), nullable=True)
    idempotency_key: Mapped[str | None] = mapped_column(
        String(64), unique=True, nullable=True
    )

    record: Mapped["AttendanceRecord"] = relationship(
        "AttendanceRecord", back_populates="events"
    )


class QRToken(Base):
    __tablename__ = "qr_tokens"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    nonce: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    used_by_employee_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class AttendanceCorrection(TimestampMixin, Base):
    __tablename__ = "attendance_corrections"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    record_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("attendance_records.id", ondelete="CASCADE"), index=True
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE")
    )
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    requested_check_in: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    requested_check_out: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20), default=CorrectionStatus.PENDING.value
    )
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), nullable=True
    )
    review_note: Mapped[str | None] = mapped_column(Text, nullable=True)