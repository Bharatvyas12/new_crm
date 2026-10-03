from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.complaint import ComplaintCreate, ComplaintStatusUpdate, CommentCreate
from app.services.complaint_service import ComplaintService
from app.dependencies import require
from app.models.user import User
import uuid

router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.get("/categories")
async def list_categories(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("complaints.read.self")),
):
    service = ComplaintService(db)
    return await service.get_categories()


@router.post("/")
async def create_complaint(
    data: ComplaintCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("complaints.create.self")),
):
    service = ComplaintService(db)
    complaint = await service.create_complaint(user.employee.id, data)
    return {"message": "Complaint submitted", "id": str(complaint.id)}


@router.get("/")
async def list_complaints(
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("complaints.read.all")),
):
    service = ComplaintService(db)
    return await service.list_complaints(is_admin=True, status=status, skip=skip, limit=limit)


@router.get("/me")
async def my_complaints(
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("complaints.read.self")),
):
    service = ComplaintService(db)
    return await service.list_complaints(
        employee_id=user.employee.id if user.employee else None,
        status=status, skip=skip, limit=limit,
    )


@router.get("/{complaint_id}")
async def get_complaint(
    complaint_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("complaints.read.self")),
):
    service = ComplaintService(db)
    return await service.get_complaint(complaint_id)


@router.post("/{complaint_id}/status")
async def update_complaint_status(
    complaint_id: uuid.UUID,
    data: ComplaintStatusUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("complaints.manage")),
):
    service = ComplaintService(db)
    await service.update_status(complaint_id, data, user.id)
    return {"message": f"Status updated to {data.status}"}


@router.post("/{complaint_id}/comments")
async def add_comment(
    complaint_id: uuid.UUID,
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("complaints.read.self")),
):
    service = ComplaintService(db)
    comment = await service.add_comment(complaint_id, user.id, data)
    return {"message": "Comment added", "id": str(comment.id)}