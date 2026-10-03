from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.attendance import (
    AttendanceRecord, AttendanceEvent, AttendanceCorrection,
    DayClassification, EventType, CorrectionStatus,
)
from app.schemas.attendance import (
    CheckInRequest, CheckOutRequest, CorrectionRequest, CorrectionReviewRequest,
)
from app.exceptions import NotFoundError, BusinessRuleError, ConflictError
from datetime import datetime, timezone, timedelta
import uuid
import math


class AttendanceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_today_status(self, employee_id: uuid.UUID) -> dict:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        result = await self.db.execute(
            select(AttendanceRecord).where(
                and_(
                    AttendanceRecord.employee_id == employee_id,
                    AttendanceRecord.date == today,
                )
            )
        )
        record = result.scalars().first()

        if not record:
            return {
                "has_checked_in": False,
                "has_checked_out": False,
                "is_on_break": False,
                "record": None,
                "current_work_duration_minutes": 0.0,
            }

        is_on_break = (
            record.break_start_time is not None
            and record.break_end_time is None
        )
        has_checked_out = record.check_out_time is not None

        # Calculate current work duration
        work_minutes = 0.0
        if record.check_in_time and not has_checked_out:
            elapsed = datetime.now(timezone.utc) - record.check_in_time
            work_minutes = elapsed.total_seconds() / 60.0
            if record.break_duration_minutes:
                work_minutes -= record.break_duration_minutes

        return {
            "has_checked_in": True,
            "has_checked_out": has_checked_out,
            "is_on_break": is_on_break,
            "record": record,
            "current_work_duration_minutes": round(work_minutes, 1),
        }

    async def check_in(
        self, employee_id: uuid.UUID, data: CheckInRequest
    ) -> AttendanceRecord:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        now = datetime.now(timezone.utc)

        # Check if already checked in today
        existing = await self.db.execute(
            select(AttendanceRecord).where(
                and_(
                    AttendanceRecord.employee_id == employee_id,
                    AttendanceRecord.date == today,
                )
            )
        )
        if existing.scalars().first():
            raise BusinessRuleError("Already checked in today")

        # Idempotency check
        if data.idempotency_key:
            dup = await self.db.execute(
                select(AttendanceEvent).where(
                    AttendanceEvent.idempotency_key == data.idempotency_key
                )
            )
            if dup.scalars().first():
                raise ConflictError("Duplicate check-in request")

        # Determine if late (grace period: 10 minutes after 09:00)
        # This would read from settings in production
        shift_start_hour = 9
        is_late = now.hour > shift_start_hour or (
            now.hour == shift_start_hour and now.minute > 10
        )

        record = AttendanceRecord(
            employee_id=employee_id,
            date=today,
            check_in_time=now,
            check_in_latitude=data.latitude,
            check_in_longitude=data.longitude,
            check_in_accuracy=data.accuracy,
            qr_token_used=data.qr_token,
            is_late=is_late,
            day_classification=DayClassification.ABSENT.value,
        )
        self.db.add(record)
        await self.db.flush()

        # Record event
        event = AttendanceEvent(
            record_id=record.id,
            event_type=EventType.CHECK_IN.value,
            timestamp=now,
            latitude=data.latitude,
            longitude=data.longitude,
            accuracy=data.accuracy,
            qr_token=data.qr_token,
            idempotency_key=data.idempotency_key,
        )
        self.db.add(event)
        await self.db.flush()
        return record

    async def check_out(
        self, employee_id: uuid.UUID, data: CheckOutRequest
    ) -> AttendanceRecord:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        now = datetime.now(timezone.utc)

        result = await self.db.execute(
            select(AttendanceRecord).where(
                and_(
                    AttendanceRecord.employee_id == employee_id,
                    AttendanceRecord.date == today,
                )
            )
        )
        record = result.scalars().first()
        if not record:
            raise BusinessRuleError("Not checked in today")
        if record.check_out_time:
            raise BusinessRuleError("Already checked out")

        # End any active break
        if record.break_start_time and not record.break_end_time:
            record.break_end_time = now
            break_dur = (now - record.break_start_time).total_seconds() / 60.0
            record.break_duration_minutes = (
                record.break_duration_minutes or 0
            ) + break_dur

        record.check_out_time = now

        # Calculate work hours & classification
        self._compute_work_hours(record)

        # Record event
        event = AttendanceEvent(
            record_id=record.id,
            event_type=EventType.CHECK_OUT.value,
            timestamp=now,
            latitude=data.latitude,
            longitude=data.longitude,
            idempotency_key=data.idempotency_key,
        )
        self.db.add(event)
        await self.db.flush()
        return record

    async def start_break(self, employee_id: uuid.UUID) -> None:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        now = datetime.now(timezone.utc)

        result = await self.db.execute(
            select(AttendanceRecord).where(
                and_(
                    AttendanceRecord.employee_id == employee_id,
                    AttendanceRecord.date == today,
                )
            )
        )
        record = result.scalars().first()
        if not record or record.check_out_time:
            raise BusinessRuleError("Not in active shift")
        if record.break_start_time and not record.break_end_time:
            raise BusinessRuleError("Already on break")

        record.break_start_time = now

        event = AttendanceEvent(
            record_id=record.id,
            event_type=EventType.BREAK_START.value,
            timestamp=now,
        )
        self.db.add(event)
        await self.db.flush()

    async def end_break(self, employee_id: uuid.UUID) -> None:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        now = datetime.now(timezone.utc)

        result = await self.db.execute(
            select(AttendanceRecord).where(
                and_(
                    AttendanceRecord.employee_id == employee_id,
                    AttendanceRecord.date == today,
                )
            )
        )
        record = result.scalars().first()
        if not record or not record.break_start_time or record.break_end_time:
            raise BusinessRuleError("Not currently on break")

        record.break_end_time = now
        break_dur = (now - record.break_start_time).total_seconds() / 60.0
        record.break_duration_minutes = (
            record.break_duration_minutes or 0
        ) + break_dur

        event = AttendanceEvent(
            record_id=record.id,
            event_type=EventType.BREAK_END.value,
            timestamp=now,
        )
        self.db.add(event)
        await self.db.flush()

    def _compute_work_hours(self, record: AttendanceRecord) -> None:
        """Calculate work hours, overtime, and day classification."""
        if not record.check_in_time or not record.check_out_time:
            return

        total_seconds = (
            record.check_out_time - record.check_in_time
        ).total_seconds()
        break_seconds = (record.break_duration_minutes or 0) * 60
        worked_seconds = max(0, total_seconds - break_seconds)
        worked_hours = worked_seconds / 3600.0

        # Round to 2 decimal places
        record.work_hours = round(worked_hours, 2)

        # Day classification thresholds (would read from settings)
        full_day_threshold = 10.0
        half_day_threshold = 5.0
        partial_threshold = 0.5

        if worked_hours >= full_day_threshold:
            record.day_classification = DayClassification.FULL_DAY.value
        elif worked_hours >= half_day_threshold:
            record.day_classification = DayClassification.HALF_DAY.value
        elif worked_hours >= partial_threshold:
            record.day_classification = DayClassification.PARTIAL_DAY.value
        else:
            record.day_classification = DayClassification.ABSENT.value

        # Overtime: after full_day_threshold hours, in 30-min blocks, max 4h
        overtime = 0.0
        if worked_hours > full_day_threshold:
            raw_overtime = worked_hours - full_day_threshold
            overtime = math.floor(raw_overtime * 2) / 2  # 30-min blocks
            overtime = min(overtime, 4.0)  # Cap at 4 hours
        record.overtime_hours = round(overtime, 2)

        # Early checkout check (grace: 10 min before 19:00)
        shift_end_hour = 19
        if record.check_out_time.hour < shift_end_hour - 1 or (
            record.check_out_time.hour == shift_end_hour - 1
            and record.check_out_time.minute < 50
        ):
            record.is_early_checkout = worked_hours < full_day_threshold

    async def recompute_record(self, record_id: uuid.UUID) -> AttendanceRecord:
        result = await self.db.execute(
            select(AttendanceRecord).where(AttendanceRecord.id == record_id)
        )
        record = result.scalars().first()
        if not record:
            raise NotFoundError("AttendanceRecord", str(record_id))
        self._compute_work_hours(record)
        await self.db.flush()
        return record

    async def list_records(
        self,
        employee_id: uuid.UUID | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> dict:
        query = select(AttendanceRecord)
        count_query = select(func.count(AttendanceRecord.id))

        filters = []
        if employee_id:
            filters.append(AttendanceRecord.employee_id == employee_id)
        if date_from:
            filters.append(AttendanceRecord.date >= date_from)
        if date_to:
            filters.append(AttendanceRecord.date <= date_to)

        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        total = (await self.db.execute(count_query)).scalar() or 0
        result = await self.db.execute(
            query.order_by(AttendanceRecord.date.desc()).offset(skip).limit(limit)
        )
        records = result.scalars().all()
        return {"records": records, "total": total}

    async def submit_correction(
        self, employee_id: uuid.UUID, data: CorrectionRequest
    ) -> AttendanceCorrection:
        correction = AttendanceCorrection(
            record_id=data.record_id,
            employee_id=employee_id,
            reason=data.reason,
            requested_check_in=data.requested_check_in,
            requested_check_out=data.requested_check_out,
            status=CorrectionStatus.PENDING.value,
        )
        self.db.add(correction)
        await self.db.flush()
        return correction

    async def review_correction(
        self,
        correction_id: uuid.UUID,
        reviewer_id: uuid.UUID,
        data: CorrectionReviewRequest,
    ) -> None:
        result = await self.db.execute(
            select(AttendanceCorrection).where(
                AttendanceCorrection.id == correction_id
            )
        )
        correction = result.scalars().first()
        if not correction:
            raise NotFoundError("Correction", str(correction_id))

        correction.status = data.status
        correction.reviewed_by = reviewer_id
        correction.review_note = data.review_note

        # If approved, apply corrections to the attendance record
        if data.status == CorrectionStatus.APPROVED.value:
            rec_result = await self.db.execute(
                select(AttendanceRecord).where(
                    AttendanceRecord.id == correction.record_id
                )
            )
            record = rec_result.scalars().first()
            if record:
                if correction.requested_check_in:
                    record.check_in_time = correction.requested_check_in
                if correction.requested_check_out:
                    record.check_out_time = correction.requested_check_out
                self._compute_work_hours(record)

        await self.db.flush()