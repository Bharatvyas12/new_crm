from sqlalchemy import String, ForeignKey, Text, DateTime, Numeric, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid, JSON
import uuid
import enum
from datetime import datetime, timezone
from app.database import Base, TimestampMixin


class PayrollRunStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    REVIEWED = "REVIEWED"
    APPROVED = "APPROVED"
    PAID = "PAID"


class PayrollRun(TimestampMixin, Base):
    __tablename__ = "payroll_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    period_start: Mapped[str] = mapped_column(String(10), nullable=False)
    period_end: Mapped[str] = mapped_column(String(10), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default=PayrollRunStatus.DRAFT.value, index=True
    )
    total_gross: Mapped[float] = mapped_column(Numeric(14, 2), default=0.00)
    total_deductions: Mapped[float] = mapped_column(Numeric(14, 2), default=0.00)
    total_net: Mapped[float] = mapped_column(Numeric(14, 2), default=0.00)
    employee_count: Mapped[int] = mapped_column(Integer, default=0)
    generated_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    records: Mapped[list["PayrollSalaryRecord"]] = relationship(
        "PayrollSalaryRecord", back_populates="payroll_run", cascade="all, delete-orphan"
    )
    rule_snapshot: Mapped["PayrollRuleSnapshot | None"] = relationship(
        "PayrollRuleSnapshot", back_populates="payroll_run", uselist=False
    )


class PayrollSalaryRecord(TimestampMixin, Base):
    __tablename__ = "payroll_salary_records"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    payroll_run_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("payroll_runs.id", ondelete="CASCADE"), index=True
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), index=True
    )

    # Attendance summary
    total_working_days: Mapped[int] = mapped_column(Integer, default=0)
    days_present: Mapped[float] = mapped_column(Numeric(5, 1), default=0)
    half_days: Mapped[float] = mapped_column(Numeric(5, 1), default=0)
    absent_days: Mapped[float] = mapped_column(Numeric(5, 1), default=0)
    overtime_hours: Mapped[float] = mapped_column(Numeric(6, 2), default=0.00)
    leave_days_paid: Mapped[float] = mapped_column(Numeric(5, 1), default=0)
    leave_days_unpaid: Mapped[float] = mapped_column(Numeric(5, 1), default=0)

    # Salary calculations
    base_salary: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00)
    overtime_pay: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    gross_salary: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00)

    # Deductions
    unpaid_leave_deduction: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    advance_deduction: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    other_deductions: Mapped[float] = mapped_column(Numeric(10, 2), default=0.00)
    total_deductions: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00)

    net_salary: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00)

    payroll_run: Mapped["PayrollRun"] = relationship(
        "PayrollRun", back_populates="records"
    )
    employee = relationship("Employee")


class PayrollRuleSnapshot(Base):
    __tablename__ = "payroll_rule_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    payroll_run_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("payroll_runs.id", ondelete="CASCADE"), unique=True
    )
    snapshot_data: Mapped[dict] = mapped_column(JSON, nullable=False)
    captured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    payroll_run: Mapped["PayrollRun"] = relationship(
        "PayrollRun", back_populates="rule_snapshot"
    )