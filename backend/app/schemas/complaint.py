from pydantic import BaseModel, Field
import uuid
from datetime import datetime


class ComplaintCreate(BaseModel):
    category_id: uuid.UUID
    subject: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=5)
    visibility: str = "EMPLOYEE_PRIVATE"


class ComplaintStatusUpdate(BaseModel):
    status: str
    resolution_note: str | None = None


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1)
    is_internal: bool = False


class ComplaintCategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None

    model_config = {"from_attributes": True}


class CommentResponse(BaseModel):
    id: uuid.UUID
    complaint_id: uuid.UUID
    author_id: uuid.UUID
    content: str
    is_internal: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ComplaintResponse(BaseModel):
    id: uuid.UUID
    category_id: uuid.UUID
    raised_by: uuid.UUID
    subject: str
    description: str
    status: str
    visibility: str
    resolved_at: datetime | None = None
    resolution_note: str | None = None
    created_at: datetime
    updated_at: datetime
    comments: list[CommentResponse] = []

    model_config = {"from_attributes": True}


class ComplaintListResponse(BaseModel):
    complaints: list[ComplaintResponse]
    total: int