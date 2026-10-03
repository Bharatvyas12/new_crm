from pydantic import BaseModel, Field
import uuid
from datetime import datetime


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    priority: str = "MEDIUM"
    due_date: datetime | None = None
    requires_evidence: bool = False
    employee_ids: list[uuid.UUID] = []


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: str | None = None
    due_date: datetime | None = None
    requires_evidence: bool | None = None


class TaskSubmitRequest(BaseModel):
    notes: str | None = None
    evidence_url: str | None = None


class TaskReviewRequest(BaseModel):
    status: str  # APPROVED or REJECTED
    review_note: str | None = None


class TaskResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None = None
    status: str
    priority: str
    due_date: datetime | None = None
    requires_evidence: bool
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    assignee_count: int = 0

    model_config = {"from_attributes": True}


class TaskDetailResponse(TaskResponse):
    assignments: list[dict] = []
    submissions: list[dict] = []


class TaskListResponse(BaseModel):
    tasks: list[TaskResponse]
    total: int