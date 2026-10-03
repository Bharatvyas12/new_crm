from pydantic import BaseModel, Field
import uuid
from datetime import datetime


class CheckInRequest(BaseModel):
    latitude: float | None = None
    longitude: float | None = None
    accuracy: float | None = None
    qr_token: str | None = None
    idempotency_key: str | None = None


class CheckOutRequest(BaseModel):
    latitude: float | None = None
    longitude: float | None = None
    idempotency_key: str | None = None


class BreakRequest(BaseModel):
    idempotency_key: str | None = None


class AttendanceResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    date: str
    check_in_time: datetime | None = None
    check_out_time: datetime | None = None
    break_start_time: datetime | None = None
    break_end_time: datetime | None = None
    work_hours: float
    overtime_hours: float
    day_classification: str
    is_late: bool
    is_early_checkout: bool
    verification_mode: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TodayStatusResponse(BaseModel):
    has_checked_in: bool = False
    has_checked_out: bool = False
    is_on_break: bool = False
    record: AttendanceResponse | None = None
    current_work_duration_minutes: float = 0.0


class CorrectionRequest(BaseModel):
    record_id: uuid.UUID
    reason: str = Field(..., min_length=5)
    requested_check_in: datetime | None = None
    requested_check_out: datetime | None = None


class CorrectionReviewRequest(BaseModel):
    status: str  # APPROVED or REJECTED
    review_note: str | None = None


class CorrectionResponse(BaseModel):
    id: uuid.UUID
    record_id: uuid.UUID
    employee_id: uuid.UUID
    reason: str
    requested_check_in: datetime | None = None
    requested_check_out: datetime | None = None
    status: str
    review_note: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AttendanceListResponse(BaseModel):
    records: list[AttendanceResponse]
    total: int