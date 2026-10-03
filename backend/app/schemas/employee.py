from pydantic import BaseModel, Field
import uuid
from datetime import datetime


class EmployeeCreate(BaseModel):
    email: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=4, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=255)
    phone: str | None = None
    department: str | None = None
    designation: str | None = None
    employment_type: str = "FULL_TIME"
    base_salary: float = 0.00
    hourly_rate: float | None = None


class EmployeeUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    department: str | None = None
    designation: str | None = None
    employment_type: str | None = None
    base_salary: float | None = None
    hourly_rate: float | None = None
    is_active: bool | None = None
    bank_account_number: str | None = None
    bank_ifsc: str | None = None
    bank_name: str | None = None


class EmployeeResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    employee_code: str
    full_name: str
    phone: str | None = None
    department: str | None = None
    designation: str | None = None
    employment_type: str
    is_active: bool
    base_salary: float
    hourly_rate: float | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class EmployeeListResponse(BaseModel):
    employees: list[EmployeeResponse]
    total: int