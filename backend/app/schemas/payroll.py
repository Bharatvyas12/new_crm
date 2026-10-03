from pydantic import BaseModel, Field
import uuid
from datetime import datetime


class PayrollRunCreate(BaseModel):
    period_start: str  # YYYY-MM-DD
    period_end: str
    notes: str | None = None


class PayrollRunResponse(BaseModel):
    id: uuid.UUID
    period_start: str
    period_end: str
    status: str
    total_gross: float
    total_deductions: float
    total_net: float
    employee_count: int
    notes: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PayrollRecordResponse(BaseModel):
    id: uuid.UUID
    payroll_run_id: uuid.UUID
    employee_id: uuid.UUID
    total_working_days: int
    days_present: float
    half_days: float
    absent_days: float
    overtime_hours: float
    leave_days_paid: float
    leave_days_unpaid: float
    base_salary: float
    overtime_pay: float
    gross_salary: float
    unpaid_leave_deduction: float
    advance_deduction: float
    other_deductions: float
    total_deductions: float
    net_salary: float

    model_config = {"from_attributes": True}


class PayrollRunDetailResponse(PayrollRunResponse):
    records: list[PayrollRecordResponse] = []