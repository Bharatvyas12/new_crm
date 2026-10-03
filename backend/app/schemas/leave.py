from pydantic import BaseModel, Field
import uuid
from datetime import datetime


class LeaveTypeResponse(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    annual_quota: int
    is_paid: bool
    description: str | None = None

    model_config = {"from_attributes": True}


class LeaveApplyRequest(BaseModel):
    leave_type_id: uuid.UUID
    start_date: str  # YYYY-MM-DD
    end_date: str
    period: str = "FULL_DAY"  # FULL_DAY, FIRST_HALF, SECOND_HALF
    reason: str | None = None


class LeaveReviewRequest(BaseModel):
    status: str  # APPROVED or REJECTED
    review_note: str | None = None


class LeaveRequestResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    leave_type_id: uuid.UUID
    start_date: str
    end_date: str
    period: str
    total_days: float
    reason: str | None = None
    status: str
    reviewed_by: uuid.UUID | None = None
    review_note: str | None = None
    reviewed_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class LeaveBalanceResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    leave_type_id: uuid.UUID
    year: int
    total_quota: float
    used: float
    remaining: float

    model_config = {"from_attributes": True}


class LeaveListResponse(BaseModel):
    requests: list[LeaveRequestResponse]
    total: int