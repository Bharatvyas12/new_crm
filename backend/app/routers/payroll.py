from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.payroll import PayrollRunCreate
from app.services.payroll_service import PayrollService
from app.dependencies import require
from app.models.user import User
import uuid

router = APIRouter(prefix="/payroll", tags=["payroll"])


@router.get("/runs")
async def list_payroll_runs(
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("payroll.read")),
):
    service = PayrollService(db)
    return await service.list_runs(status=status, skip=skip, limit=limit)


@router.post("/runs")
async def create_payroll_run(
    data: PayrollRunCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("payroll.run")),
):
    service = PayrollService(db)
    run = await service.create_run(data, user.id)
    return {"message": "Payroll run created", "id": str(run.id)}


@router.post("/runs/{run_id}/generate")
async def generate_payroll_records(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("payroll.run")),
):
    service = PayrollService(db)
    run = await service.generate_records(run_id)
    return {
        "message": "Records generated",
        "employee_count": run.employee_count,
        "total_net": float(run.total_net),
    }


@router.get("/runs/{run_id}")
async def get_payroll_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("payroll.read")),
):
    service = PayrollService(db)
    return await service.get_run_detail(run_id)


@router.post("/runs/{run_id}/approve")
async def approve_payroll_run(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("payroll.approve")),
):
    service = PayrollService(db)
    await service.approve_run(run_id, user.id)
    return {"message": "Payroll run approved"}


@router.post("/runs/{run_id}/pay")
async def mark_paid(
    run_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("payroll.approve")),
):
    service = PayrollService(db)
    await service.mark_paid(run_id, user.id)
    return {"message": "Payroll marked as paid"}