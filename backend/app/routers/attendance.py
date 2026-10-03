from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.attendance import (
    CheckInRequest, CheckOutRequest, BreakRequest,
    AttendanceResponse, TodayStatusResponse, CorrectionRequest, CorrectionReviewRequest,
)
from app.services.attendance_service import AttendanceService
from app.dependencies import require, get_current_user
from app.models.user import User
import uuid

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.get("/me/today")
async def get_today_status(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("attendance.read.self")),
):
    service = AttendanceService(db)
    employee = user.employee
    if not employee:
        return {"has_checked_in": False, "has_checked_out": False, "is_on_break": False, "record": None}
    return await service.get_today_status(employee.id)


@router.post("/check-in")
async def check_in(
    data: CheckInRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("attendance.checkin.self")),
):
    service = AttendanceService(db)
    record = await service.check_in(user.employee.id, data)
    return {"message": "Checked in successfully", "record_id": str(record.id)}


@router.post("/check-out")
async def check_out(
    data: CheckOutRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("attendance.checkout.self")),
):
    service = AttendanceService(db)
    record = await service.check_out(user.employee.id, data)
    return {
        "message": "Checked out successfully",
        "work_hours": record.work_hours,
        "overtime_hours": record.overtime_hours,
        "day_classification": record.day_classification,
    }


@router.post("/break/start")
async def start_break(
    data: BreakRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("attendance.checkin.self")),
):
    service = AttendanceService(db)
    await service.start_break(user.employee.id)
    return {"message": "Break started"}


@router.post("/break/end")
async def end_break(
    data: BreakRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("attendance.checkin.self")),
):
    service = AttendanceService(db)
    await service.end_break(user.employee.id)
    return {"message": "Break ended"}


@router.get("/")
async def list_attendance(
    employee_id: uuid.UUID | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("attendance.read.all")),
):
    service = AttendanceService(db)
    return await service.list_records(
        employee_id=employee_id, date_from=date_from, date_to=date_to,
        skip=skip, limit=limit,
    )


@router.get("/me/history")
async def my_attendance_history(
    date_from: str | None = None,
    date_to: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("attendance.read.self")),
):
    service = AttendanceService(db)
    return await service.list_records(
        employee_id=user.employee.id if user.employee else None,
        date_from=date_from, date_to=date_to,
        skip=skip, limit=limit,
    )


@router.post("/{record_id}/recompute")
async def recompute_attendance(
    record_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("attendance.manage")),
):
    service = AttendanceService(db)
    record = await service.recompute_record(record_id)
    return {
        "message": "Recomputed",
        "work_hours": record.work_hours,
        "day_classification": record.day_classification,
    }


@router.post("/corrections")
async def submit_correction(
    data: CorrectionRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("attendance.read.self")),
):
    service = AttendanceService(db)
    correction = await service.submit_correction(user.employee.id, data)
    return {"message": "Correction submitted", "id": str(correction.id)}


@router.post("/corrections/{correction_id}/review")
async def review_correction(
    correction_id: uuid.UUID,
    data: CorrectionReviewRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("attendance.manage")),
):
    service = AttendanceService(db)
    await service.review_correction(correction_id, user.id, data)
    return {"message": f"Correction {data.status.lower()}"}