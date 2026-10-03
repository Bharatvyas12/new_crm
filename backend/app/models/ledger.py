from sqlalchemy import String, ForeignKey, Text, DateTime, Numeric, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid
import uuid
import enum
from datetime import datetime, timezone
from app.database import Base, TimestampMixin


class LedgerEntryType(str, enum.Enum):
    SALARY_CREDIT = "SALARY_CREDIT"
    ADVANCE_DEBIT = "ADVANCE_DEBIT"
    ADVANCE_REPAYMENT = "ADVANCE_REPAYMENT"
    BONUS = "BONUS"
    DEDUCTION = "DEDUCTION"
    REIMBURSEMENT = "REIMBURSEMENT"
    WRITE_OFF = "WRITE_OFF"


class AdvanceStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    DISBURSED = "DISBURSED"
    REPAID = "REPAID"
    WRITTEN_OFF = "WRITTEN_OFF"


class RepaymentMode(str, enum.Enum):
    SALARY_DEDUCTION = "SALARY_DEDUCTION"
    CASH = "CASH"
    MIXED = "MIXED"


class LedgerEntry(TimestampMixin, Base):
    __tablename__ = "ledger_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), index=True
    )
    entry_type: Mapped[str] = mapped_column(String(30), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    running_balance: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    reference_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), nullable=True
    )
    reference_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )

    employee = relationship("Employee")


class EmployeeAdvance(TimestampMixin, Base):
    __tablename__ = "employee_advances"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), index=True
    )
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    outstanding: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(20), default=AdvanceStatus.PENDING.value, index=True
    )
    repayment_mode: Mapped[str] = mapped_column(
        String(20), default=RepaymentMode.SALARY_DEDUCTION.value
    )
    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    disbursed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    write_off_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    employee = relationship("Employee")
    repayments: Mapped[list["AdvanceRepayment"]] = relationship(
        "AdvanceRepayment", back_populates="advance", cascade="all, delete-orphan"
    )


class AdvanceRepayment(TimestampMixin, Base):
    __tablename__ = "advance_repayments"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    advance_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employee_advances.id", ondelete="CASCADE"), index=True
    )
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    mode: Mapped[str] = mapped_column(String(20), nullable=False)
    reference_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    payroll_run_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), nullable=True
    )

    advance: Mapped["EmployeeAdvance"] = relationship(
        "EmployeeAdvance", back_populates="repayments"
    )