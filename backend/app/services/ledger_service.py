from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.ledger import LedgerEntry, EmployeeAdvance, AdvanceRepayment, AdvanceStatus, LedgerEntryType
from app.schemas.ledger import AdvanceRequest, RepaymentCreate
from app.exceptions import NotFoundError, BusinessRuleError
from datetime import datetime, timezone
import uuid


class LedgerService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_running_balance(self, employee_id: uuid.UUID) -> float:
        result = await self.db.execute(
            select(LedgerEntry.running_balance)
            .where(LedgerEntry.employee_id == employee_id)
            .order_by(LedgerEntry.created_at.desc())
            .limit(1)
        )
        balance = result.scalar()
        return float(balance) if balance is not None else 0.0

    async def _create_ledger_entry(
        self,
        employee_id: uuid.UUID,
        entry_type: str,
        amount: float,
        description: str,
        created_by: uuid.UUID,
        reference_id: uuid.UUID | None = None,
        reference_type: str | None = None,
    ) -> LedgerEntry:
        running_balance = await self._get_running_balance(employee_id)

        if entry_type in [LedgerEntryType.ADVANCE_DEBIT.value, LedgerEntryType.DEDUCTION.value]:
            running_balance -= amount
        else:
            running_balance += amount

        entry = LedgerEntry(
            employee_id=employee_id,
            entry_type=entry_type,
            amount=amount,
            running_balance=round(running_balance, 2),
            description=description,
            reference_id=reference_id,
            reference_type=reference_type,
            created_by=created_by,
        )
        self.db.add(entry)
        await self.db.flush()
        return entry

    async def request_advance(
        self, employee_id: uuid.UUID, data: AdvanceRequest
    ) -> EmployeeAdvance:
        advance = EmployeeAdvance(
            employee_id=employee_id,
            amount=data.amount,
            outstanding=data.amount,
            reason=data.reason,
            repayment_mode=data.repayment_mode,
            status=AdvanceStatus.PENDING.value,
        )
        self.db.add(advance)
        await self.db.flush()
        return advance

    async def review_advance(
        self, advance_id: uuid.UUID, reviewer_id: uuid.UUID, status: str
    ) -> None:
        result = await self.db.execute(
            select(EmployeeAdvance).where(EmployeeAdvance.id == advance_id)
        )
        advance = result.scalars().first()
        if not advance:
            raise NotFoundError("Advance", str(advance_id))
        if advance.status != AdvanceStatus.PENDING.value:
            raise BusinessRuleError("Only pending advances can be reviewed")

        if status == "APPROVED":
            advance.status = AdvanceStatus.APPROVED.value
            advance.approved_by = reviewer_id
            advance.approved_at = datetime.now(timezone.utc)
        elif status == "REJECTED":
            advance.status = AdvanceStatus.REJECTED.value
        else:
            raise BusinessRuleError(f"Invalid status: {status}")

        await self.db.flush()

    async def disburse_advance(
        self, advance_id: uuid.UUID, user_id: uuid.UUID
    ) -> None:
        result = await self.db.execute(
            select(EmployeeAdvance).where(EmployeeAdvance.id == advance_id)
        )
        advance = result.scalars().first()
        if not advance:
            raise NotFoundError("Advance", str(advance_id))
        if advance.status != AdvanceStatus.APPROVED.value:
            raise BusinessRuleError("Only approved advances can be disbursed")

        advance.status = AdvanceStatus.DISBURSED.value
        advance.disbursed_at = datetime.now(timezone.utc)

        # Create ledger entry (debit — employee owes money)
        await self._create_ledger_entry(
            employee_id=advance.employee_id,
            entry_type=LedgerEntryType.ADVANCE_DEBIT.value,
            amount=float(advance.amount),
            description=f"Advance disbursed: {advance.reason or 'N/A'}",
            created_by=user_id,
            reference_id=advance.id,
            reference_type="advance",
        )
        await self.db.flush()

    async def record_repayment(
        self, data: RepaymentCreate, user_id: uuid.UUID
    ) -> AdvanceRepayment:
        result = await self.db.execute(
            select(EmployeeAdvance).where(EmployeeAdvance.id == data.advance_id)
        )
        advance = result.scalars().first()
        if not advance:
            raise NotFoundError("Advance", str(data.advance_id))
        if advance.status != AdvanceStatus.DISBURSED.value:
            raise BusinessRuleError("Advance is not in disbursed state")
        if data.amount > float(advance.outstanding):
            raise BusinessRuleError(
                f"Repayment amount exceeds outstanding: {advance.outstanding}"
            )

        repayment = AdvanceRepayment(
            advance_id=data.advance_id,
            amount=data.amount,
            mode=data.mode,
            reference_note=data.reference_note,
        )
        self.db.add(repayment)

        advance.outstanding = float(advance.outstanding) - data.amount
        if advance.outstanding <= 0:
            advance.status = AdvanceStatus.REPAID.value

        # Create ledger entry (credit — repayment)
        await self._create_ledger_entry(
            employee_id=advance.employee_id,
            entry_type=LedgerEntryType.ADVANCE_REPAYMENT.value,
            amount=data.amount,
            description=f"Advance repayment ({data.mode})",
            created_by=user_id,
            reference_id=advance.id,
            reference_type="advance_repayment",
        )
        await self.db.flush()
        return repayment

    async def list_advances(
        self,
        employee_id: uuid.UUID | None = None,
        status: str | None = None,
    ) -> list[EmployeeAdvance]:
        query = select(EmployeeAdvance)
        if employee_id:
            query = query.where(EmployeeAdvance.employee_id == employee_id)
        if status:
            query = query.where(EmployeeAdvance.status == status)
        result = await self.db.execute(
            query.order_by(EmployeeAdvance.created_at.desc())
        )
        return result.scalars().all()

    async def get_employee_ledger(
        self,
        employee_id: uuid.UUID | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> dict:
        query = select(LedgerEntry)
        count_query = select(func.count(LedgerEntry.id))

        if employee_id:
            query = query.where(LedgerEntry.employee_id == employee_id)
            count_query = count_query.where(LedgerEntry.employee_id == employee_id)

        total = (await self.db.execute(count_query)).scalar() or 0
        result = await self.db.execute(
            query.order_by(LedgerEntry.created_at.desc()).offset(skip).limit(limit)
        )
        entries = result.scalars().all()
        return {"entries": entries, "total": total}