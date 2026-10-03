from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.task import TaskCreate, TaskUpdate, TaskSubmitRequest, TaskReviewRequest, TaskResponse
from app.services.task_service import TaskService
from app.dependencies import require
from app.models.user import User
import uuid

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.get("/")
async def list_tasks(
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("tasks.read.all")),
):
    service = TaskService(db)
    return await service.list_tasks(status=status, skip=skip, limit=limit)


@router.get("/me")
async def my_tasks(
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("tasks.read.self")),
):
    service = TaskService(db)
    employee_id = user.employee.id if user.employee else None
    return await service.list_tasks(status=status, employee_id=employee_id, skip=skip, limit=limit)


@router.post("/", response_model=TaskResponse)
async def create_task(
    data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("tasks.create")),
):
    service = TaskService(db)
    return await service.create_task(data, user.id)


@router.get("/{task_id}")
async def get_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("tasks.read.all")),
):
    service = TaskService(db)
    return await service.get_task_detail(task_id)


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("tasks.create")),
):
    service = TaskService(db)
    return await service.update_task(task_id, data)


@router.post("/{task_id}/publish")
async def publish_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("tasks.create")),
):
    service = TaskService(db)
    await service.publish_task(task_id)
    return {"message": "Task published"}


@router.post("/{task_id}/submit")
async def submit_task(
    task_id: uuid.UUID,
    data: TaskSubmitRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("tasks.submit.self")),
):
    service = TaskService(db)
    submission = await service.submit_task(task_id, user.employee.id, data)
    return {"message": "Task submitted", "submission_id": str(submission.id)}


@router.post("/submissions/{submission_id}/review")
async def review_submission(
    submission_id: uuid.UUID,
    data: TaskReviewRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("tasks.review")),
):
    service = TaskService(db)
    employee_id = user.employee.id if user.employee else None
    await service.review_submission(submission_id, employee_id, user.id, data)
    return {"message": f"Submission {data.status.lower()}"}