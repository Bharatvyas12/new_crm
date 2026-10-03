from pydantic import BaseModel, Field
import uuid
from datetime import datetime


class AdvanceRequest(BaseModel):
    amount: float = Field(..., gt=0)
    reason: str | None = None
    repayment_mode: str = "SALARY_DEDUCTION"


class AdvanceReviewRequest(BaseModel):
    status: str  # APPROVED or REJECTED


class RepaymentCreate(BaseModel):
    advance_id: uuid.UUID
    amount: float = Field(..., gt=0)
    mode: str  # SALARY_DEDUCTION, CASH
    reference_note: str | None = None


class LedgerEntryResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    entry_type: str
    amount: float
    running_balance: float
    description: str | None = None
    reference_type: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AdvanceResponse(BaseModel):
    id: uuid.UUID
    employee_id: uuid.UUID
    amount: float
    outstanding: float
    reason: str | None = None
    status: str
    repayment_mode: str
    approved_at: datetime | None = None
    disbursed_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class RepaymentResponse(BaseModel):
    id: uuid.UUID
    advance_id: uuid.UUID
    amount: float
    mode: str
    reference_note: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class LedgerListResponse(BaseModel):
    entries: list[LedgerEntryResponse]
    total: int