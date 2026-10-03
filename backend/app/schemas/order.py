from pydantic import BaseModel, Field
import uuid
from datetime import datetime


class OrderCreate(BaseModel):
    customer_name: str = Field(..., min_length=1, max_length=255)
    customer_phone: str | None = None
    customer_address: str | None = None
    total_amount: float = 0.00
    items_description: str | None = None
    notes: str | None = None


class OrderStatusUpdate(BaseModel):
    status: str
    notes: str | None = None


class OrderResponse(BaseModel):
    id: uuid.UUID
    order_number: str
    customer_name: str
    customer_phone: str | None = None
    customer_address: str | None = None
    status: str
    total_amount: float
    items_description: str | None = None
    notes: str | None = None
    broadcasted_at: datetime | None = None
    claimed_at: datetime | None = None
    delivered_at: datetime | None = None
    claimed_by_employee_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrderClaimResponse(BaseModel):
    id: uuid.UUID
    order_id: uuid.UUID
    employee_id: uuid.UUID
    claimed_at: datetime

    model_config = {"from_attributes": True}


class PODRequest(BaseModel):
    photo_url: str | None = None
    signature_url: str | None = None
    notes: str | None = None


class OrderListResponse(BaseModel):
    orders: list[OrderResponse]
    total: int