from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.ledger import AdvanceRequest, AdvanceReviewRequest, RepaymentCreate
from app.services.ledger_service import LedgerService
from app.dependencies import require
from app.models.user import User
import uuid

router = APIRouter(prefix="/ledger", tags=["ledger"])


@router.get("/")
async def list_ledger_entries(
    employee_id: uuid.UUID | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("ledger.read.all")),
):
    service = LedgerService(db)
    return await service.get_employee_ledger(employee_id, skip, limit)


@router.get("/me")
async def my_ledger(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("ledger.read.self")),
):
    service = LedgerService(db)
    return await service.get_employee_ledger(user.employee.id, skip, limit)


@router.post("/advances")
async def request_advance(
    data: AdvanceRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("ledger.advance.request")),
):
    service = LedgerService(db)
    advance = await service.request_advance(user.employee.id, data)
    return {"message": "Advance requested", "id": str(advance.id)}


@router.get("/advances")
async def list_advances(
    status: str | None = None,
    employee_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("ledger.read.all")),
):
    service = LedgerService(db)
    return await service.list_advances(employee_id=employee_id, status=status)


@router.get("/advances/me")
async def my_advances(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("ledger.read.self")),
):
    service = LedgerService(db)
    return await service.list_advances(employee_id=user.employee.id)


@router.post("/advances/{advance_id}/review")
async def review_advance(
    advance_id: uuid.UUID,
    data: AdvanceReviewRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("ledger.advance.approve")),
):
    service = LedgerService(db)
    await service.review_advance(advance_id, user.id, data.status)
    return {"message": f"Advance {data.status.lower()}"}


@router.post("/advances/{advance_id}/disburse")
async def disburse_advance(
    advance_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("ledger.advance.approve")),
):
    service = LedgerService(db)
    await service.disburse_advance(advance_id, user.id)
    return {"message": "Advance disbursed"}


@router.post("/repayments")
async def record_repayment(
    data: RepaymentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("ledger.advance.approve")),
):
    service = LedgerService(db)
    repayment = await service.record_repayment(data, user.id)
    return {"message": "Repayment recorded", "id": str(repayment.id)}