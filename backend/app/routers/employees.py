from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.services.employee_service import EmployeeService
from app.dependencies import require
from app.models.user import User
import uuid

router = APIRouter(prefix="/employees", tags=["employees"])


@router.get("/")
async def list_employees(
    search: str = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("directory.read.all")),
):
    service = EmployeeService(db)
    return await service.list_employees(search=search, skip=skip, limit=limit)


@router.post("/", response_model=EmployeeResponse)
async def create_employee(
    data: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("directory.write.all")),
):
    service = EmployeeService(db)
    return await service.create_employee(data, user.id)


@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("directory.read.all")),
):
    service = EmployeeService(db)
    return await service.get_employee(employee_id)


@router.patch("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: uuid.UUID,
    data: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("directory.write.all")),
):
    service = EmployeeService(db)
    return await service.update_employee(employee_id, data)


@router.delete("/{employee_id}")
async def deactivate_employee(
    employee_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("directory.write.all")),
):
    service = EmployeeService(db)
    await service.deactivate_employee(employee_id)
    return {"message": "Employee deactivated"}