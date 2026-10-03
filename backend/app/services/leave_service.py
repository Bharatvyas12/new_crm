from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from app.models.leave import LeaveType, LeaveRequest, LeaveBalance, LeaveRequestStatus, LeavePeriod
from app.schemas.leave import LeaveApplyRequest, LeaveReviewRequest
from app.exceptions import NotFoundError, BusinessRuleError
from datetime import datetime, timezone
import uuid


class LeaveService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_leave_types(self) -> list[LeaveType]:
        result = await self.db.execute(
            select(LeaveType).where(LeaveType.is_active == True)
        )
        return result.scalars().all()

    async def apply_leave(
        self, employee_id: uuid.UUID, data: LeaveApplyRequest
    ) -> LeaveRequest:
        # Validate leave type exists
        lt_result = await self.db.execute(
            select(LeaveType).where(LeaveType.id == data.leave_type_id)
        )
        leave_type = lt_result.scalars().first()
        if not leave_type:
            raise NotFoundError("LeaveType", str(data.leave_type_id))

        # Calculate total days
        from datetime import date as d
        start = d.fromisoformat(data.start_date)
        end = d.fromisoformat(data.end_date)
        if end < start:
            raise BusinessRuleError("End date cannot be before start date")
        day_diff = (end - start).days + 1
        total_days = float(day_diff)
        if data.period in [LeavePeriod.FIRST_HALF.value, LeavePeriod.SECOND_HALF.value]:
            total_days = 0.5 * day_diff

        # Check for date overlap with existing active/pending requests
        overlap_result = await self.db.execute(
            select(func.count(LeaveRequest.id)).where(
                and_(
                    LeaveRequest.employee_id == employee_id,
                    LeaveRequest.status.in_(["PENDING", "APPROVED"]),
                    LeaveRequest.start_date <= data.end_date,
                    LeaveRequest.end_date >= data.start_date,
                )
            )
        )
        if (overlap_result.scalar() or 0) > 0:
            raise BusinessRuleError("Leave dates overlap with existing request")

        # Balance check for paid leaves
        if leave_type.is_paid:
            year = start.year
            bal_result = await self.db.execute(
                select(LeaveBalance).where(
                    and_(
                        LeaveBalance.employee_id == employee_id,
                        LeaveBalance.leave_type_id == leave_type.id,
                        LeaveBalance.year == year,
                    )
                )
            )
            balance = bal_result.scalars().first()
            if balance and balance.remaining < total_days:
                raise BusinessRuleError(
                    f"Insufficient leave balance: {balance.remaining} remaining, {total_days} requested"
                )

        request = LeaveRequest(
            employee_id=employee_id,
            leave_type_id=data.leave_type_id,
            start_date=data.start_date,
            end_date=data.end_date,
            period=data.period,
            total_days=total_days,
            reason=data.reason,
            status=LeaveRequestStatus.PENDING.value,
        )
        self.db.add(request)
        await self.db.flush()
        return request

    async def review_leave(
        self, request_id: uuid.UUID, reviewer_id: uuid.UUID, data: LeaveReviewRequest
    ) -> None:
        result = await self.db.execute(
            select(LeaveRequest).where(LeaveRequest.id == request_id)
        )
        request = result.scalars().first()
        if not request:
            raise NotFoundError("LeaveRequest", str(request_id))
        if request.status != LeaveRequestStatus.PENDING.value:
            raise BusinessRuleError("Only pending requests can be reviewed")

        request.status = data.status
        request.reviewed_by = reviewer_id
        request.review_note = data.review_note
        request.reviewed_at = datetime.now(timezone.utc)

        # Update balance on approval
        if data.status == LeaveRequestStatus.APPROVED.value:
            from datetime import date as d
            year = d.fromisoformat(request.start_date).year
            bal_result = await self.db.execute(
                select(LeaveBalance).where(
                    and_(
                        LeaveBalance.employee_id == request.employee_id,
                        LeaveBalance.leave_type_id == request.leave_type_id,
                        LeaveBalance.year == year,
                    )
                )
            )
            balance = bal_result.scalars().first()
            if balance:
                balance.used += request.total_days
                balance.remaining = balance.total_quota - balance.used

        await self.db.flush()

    async def get_balances(
        self, employee_id: uuid.UUID, year: int | None = None
    ) -> list[LeaveBalance]:
        query = select(LeaveBalance).where(
            LeaveBalance.employee_id == employee_id
        )
        if year:
            query = query.where(LeaveBalance.year == year)
        else:
            query = query.where(
                LeaveBalance.year == datetime.now(timezone.utc).year
            )
        result = await self.db.execute(query)
        return result.scalars().all()

    async def list_requests(
        self,
        employee_id: uuid.UUID | None = None,
        status: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> dict:
        query = select(LeaveRequest)
        count_query = select(func.count(LeaveRequest.id))

        filters = []
        if employee_id:
            filters.append(LeaveRequest.employee_id == employee_id)
        if status:
            filters.append(LeaveRequest.status == status)
        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        total = (await self.db.execute(count_query)).scalar() or 0
        result = await self.db.execute(
            query.order_by(LeaveRequest.created_at.desc()).offset(skip).limit(limit)
        )
        requests = result.scalars().all()
        return {"requests": requests, "total": total}