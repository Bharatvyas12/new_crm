from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.leave import LeaveApplyRequest, LeaveReviewRequest
from app.services.leave_service import LeaveService
from app.dependencies import require
from app.models.user import User
import uuid

router = APIRouter(prefix="/leaves", tags=["leaves"])


@router.get("/types")
async def list_leave_types(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("leave.read.self")),
):
    service = LeaveService(db)
    return await service.get_leave_types()


@router.post("/")
async def apply_leave(
    data: LeaveApplyRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("leave.apply.self")),
):
    service = LeaveService(db)
    request = await service.apply_leave(user.employee.id, data)
    return {"message": "Leave request submitted", "id": str(request.id)}


@router.get("/")
async def list_leave_requests(
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("leave.read.all")),
):
    service = LeaveService(db)
    return await service.list_requests(status=status, skip=skip, limit=limit)


@router.get("/me")
async def my_leave_requests(
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("leave.read.self")),
):
    service = LeaveService(db)
    return await service.list_requests(
        employee_id=user.employee.id if user.employee else None,
        status=status, skip=skip, limit=limit,
    )


@router.post("/{request_id}/review")
async def review_leave(
    request_id: uuid.UUID,
    data: LeaveReviewRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("leave.approve")),
):
    service = LeaveService(db)
    await service.review_leave(request_id, user.id, data)
    return {"message": f"Leave request {data.status.lower()}"}


@router.get("/balances/{employee_id}")
async def get_leave_balances(
    employee_id: uuid.UUID,
    year: int | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("leave.read.all")),
):
    service = LeaveService(db)
    return await service.get_balances(employee_id, year)


@router.get("/me/balances")
async def my_leave_balances(
    year: int | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("leave.read.self")),
):
    service = LeaveService(db)
    return await service.get_balances(user.employee.id, year)