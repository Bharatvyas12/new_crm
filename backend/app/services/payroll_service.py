from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.payroll import PayrollRun, PayrollSalaryRecord, PayrollRuleSnapshot, PayrollRunStatus
from app.models.employee import Employee
from app.models.attendance import AttendanceRecord, DayClassification
from app.models.leave import LeaveRequest, LeaveRequestStatus
from app.models.ledger import EmployeeAdvance, AdvanceStatus, LedgerEntry, LedgerEntryType
from app.schemas.payroll import PayrollRunCreate
from app.exceptions import NotFoundError, BusinessRuleError
from datetime import datetime, timezone
import uuid
import json


class PayrollService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_run(
        self, data: PayrollRunCreate, user_id: uuid.UUID
    ) -> PayrollRun:
        run = PayrollRun(
            period_start=data.period_start,
            period_end=data.period_end,
            status=PayrollRunStatus.DRAFT.value,
            generated_by=user_id,
            notes=data.notes,
        )
        self.db.add(run)
        await self.db.flush()

        # Capture rule snapshot
        snapshot = PayrollRuleSnapshot(
            payroll_run_id=run.id,
            snapshot_data={
                "full_day_hours": 10,
                "half_day_hours": 5,
                "overtime_rate_multiplier": 1.5,
                "overtime_max_hours": 4,
                "captured_at": str(datetime.now(timezone.utc)),
            },
        )
        self.db.add(snapshot)
        await self.db.flush()
        return run

    async def generate_records(self, run_id: uuid.UUID) -> PayrollRun:
        result = await self.db.execute(
            select(PayrollRun).where(PayrollRun.id == run_id)
        )
        run = result.scalars().first()
        if not run:
            raise NotFoundError("PayrollRun", str(run_id))
        if run.status != PayrollRunStatus.DRAFT.value:
            raise BusinessRuleError("Only DRAFT runs can generate records")

        # Get all active employees
        emp_result = await self.db.execute(
            select(Employee).where(Employee.is_active == True)
        )
        employees = emp_result.scalars().all()

        total_gross = 0.0
        total_deductions = 0.0
        total_net = 0.0

        for emp in employees:
            # Get attendance records for period
            att_result = await self.db.execute(
                select(AttendanceRecord).where(
                    and_(
                        AttendanceRecord.employee_id == emp.id,
                        AttendanceRecord.date >= run.period_start,
                        AttendanceRecord.date <= run.period_end,
                    )
                )
            )
            records = att_result.scalars().all()

            days_present = 0.0
            half_days = 0.0
            absent_days = 0.0
            total_overtime = 0.0

            for rec in records:
                if rec.day_classification == DayClassification.FULL_DAY.value:
                    days_present += 1
                elif rec.day_classification == DayClassification.HALF_DAY.value:
                    half_days += 1
                    days_present += 0.5
                elif rec.day_classification == DayClassification.PARTIAL_DAY.value:
                    days_present += 0.25
                else:
                    absent_days += 1
                total_overtime += rec.overtime_hours

            # Count approved paid leaves
            leave_result = await self.db.execute(
                select(func.coalesce(func.sum(LeaveRequest.total_days), 0)).where(
                    and_(
                        LeaveRequest.employee_id == emp.id,
                        LeaveRequest.status == LeaveRequestStatus.APPROVED.value,
                        LeaveRequest.start_date >= run.period_start,
                        LeaveRequest.end_date <= run.period_end,
                    )
                )
            )
            leave_days_paid = float(leave_result.scalar() or 0)

            # Calculate working days in period (approximate: 26 working days/month)
            total_working_days = 26
            base_salary = float(emp.base_salary)
            daily_rate = base_salary / total_working_days if total_working_days > 0 else 0
            hourly_rate = float(emp.hourly_rate) if emp.hourly_rate else (daily_rate / 10)

            # Overtime pay (1.5x multiplier)
            overtime_pay = round(total_overtime * hourly_rate * 1.5, 2)
            gross_salary = base_salary + overtime_pay

            # Deductions
            unpaid_leave_days = max(0, absent_days - leave_days_paid)
            unpaid_leave_deduction = round(unpaid_leave_days * daily_rate, 2)

            # Advance deductions
            adv_result = await self.db.execute(
                select(func.coalesce(func.sum(EmployeeAdvance.outstanding), 0)).where(
                    and_(
                        EmployeeAdvance.employee_id == emp.id,
                        EmployeeAdvance.status == AdvanceStatus.DISBURSED.value,
                    )
                )
            )
            advance_deduction = min(float(adv_result.scalar() or 0), base_salary * 0.25)

            total_ded = unpaid_leave_deduction + advance_deduction
            net_salary = max(0, gross_salary - total_ded)

            record = PayrollSalaryRecord(
                payroll_run_id=run.id,
                employee_id=emp.id,
                total_working_days=total_working_days,
                days_present=days_present,
                half_days=half_days,
                absent_days=absent_days,
                overtime_hours=total_overtime,
                leave_days_paid=leave_days_paid,
                leave_days_unpaid=unpaid_leave_days,
                base_salary=base_salary,
                overtime_pay=overtime_pay,
                gross_salary=gross_salary,
                unpaid_leave_deduction=unpaid_leave_deduction,
                advance_deduction=advance_deduction,
                total_deductions=total_ded,
                net_salary=net_salary,
            )
            self.db.add(record)

            total_gross += gross_salary
            total_deductions += total_ded
            total_net += net_salary

        run.total_gross = round(total_gross, 2)
        run.total_deductions = round(total_deductions, 2)
        run.total_net = round(total_net, 2)
        run.employee_count = len(employees)
        run.status = PayrollRunStatus.REVIEWED.value

        await self.db.flush()
        return run

    async def get_run_detail(self, run_id: uuid.UUID) -> dict:
        result = await self.db.execute(
            select(PayrollRun).where(PayrollRun.id == run_id)
        )
        run = result.scalars().first()
        if not run:
            raise NotFoundError("PayrollRun", str(run_id))

        records_result = await self.db.execute(
            select(PayrollSalaryRecord).where(
                PayrollSalaryRecord.payroll_run_id == run_id
            )
        )
        records = records_result.scalars().all()

        return {
            "id": run.id,
            "period_start": run.period_start,
            "period_end": run.period_end,
            "status": run.status,
            "total_gross": float(run.total_gross),
            "total_deductions": float(run.total_deductions),
            "total_net": float(run.total_net),
            "employee_count": run.employee_count,
            "notes": run.notes,
            "created_at": run.created_at,
            "records": records,
        }

    async def approve_run(self, run_id: uuid.UUID, user_id: uuid.UUID) -> None:
        result = await self.db.execute(
            select(PayrollRun).where(PayrollRun.id == run_id)
        )
        run = result.scalars().first()
        if not run:
            raise NotFoundError("PayrollRun", str(run_id))
        if run.status != PayrollRunStatus.REVIEWED.value:
            raise BusinessRuleError("Only REVIEWED runs can be approved")

        run.status = PayrollRunStatus.APPROVED.value
        run.approved_by = user_id
        run.approved_at = datetime.now(timezone.utc)
        await self.db.flush()

    async def mark_paid(self, run_id: uuid.UUID, user_id: uuid.UUID) -> None:
        result = await self.db.execute(
            select(PayrollRun).where(PayrollRun.id == run_id)
        )
        run = result.scalars().first()
        if not run:
            raise NotFoundError("PayrollRun", str(run_id))
        if run.status != PayrollRunStatus.APPROVED.value:
            raise BusinessRuleError("Only APPROVED runs can be marked paid")

        run.status = PayrollRunStatus.PAID.value

        # Create ledger entries for each employee
        records_result = await self.db.execute(
            select(PayrollSalaryRecord).where(
                PayrollSalaryRecord.payroll_run_id == run_id
            )
        )
        for record in records_result.scalars().all():
            entry = LedgerEntry(
                employee_id=record.employee_id,
                entry_type=LedgerEntryType.SALARY_CREDIT.value,
                amount=float(record.net_salary),
                running_balance=0,  # Would be computed properly in production
                description=f"Salary for {run.period_start} to {run.period_end}",
                reference_id=run.id,
                reference_type="payroll_run",
                created_by=user_id,
            )
            self.db.add(entry)

        await self.db.flush()

    async def list_runs(
        self, status: str | None = None, skip: int = 0, limit: int = 20
    ) -> dict:
        query = select(PayrollRun)
        count_query = select(func.count(PayrollRun.id))

        if status:
            query = query.where(PayrollRun.status == status)
            count_query = count_query.where(PayrollRun.status == status)

        total = (await self.db.execute(count_query)).scalar() or 0
        result = await self.db.execute(
            query.order_by(PayrollRun.created_at.desc()).offset(skip).limit(limit)
        )
        runs = result.scalars().all()
        return {"runs": runs, "total": total}