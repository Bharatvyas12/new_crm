import os

BASE_DIR = r"c:\Users\admin\Desktop\new_crm\backend"
FILES = {}

FILES["app/dependencies.py"] = """
from fastapi import Depends, Request, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import get_db
from app.models.user import Session, User
from app.services.auth_service import AuthService
from datetime import datetime, timezone

async def get_current_session(request: Request, db: AsyncSession = Depends(get_db)) -> Session:
    session_token = request.cookies.get("wcrm_session")
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = await db.execute(
        select(Session).where(Session.token == session_token).options(selectinload(Session.user))
    )
    session = result.scalars().first()
    
    if not session or session.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    return session

async def get_current_user(session: Session = Depends(get_current_session)) -> User:
    return session.user

def require(permission_code: str):
    async def permission_checker(
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ):
        auth_service = AuthService(db)
        perms = await auth_service.get_user_permissions(user)
        if "*" not in perms and permission_code not in perms:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user
    return permission_checker
"""

FILES["app/services/order_service.py"] = """
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.order import Order, OrderClaim, OrderLifecycleEvent
from app.exceptions import BadRequestException, NotFoundException
import uuid

class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, customer_name: str) -> Order:
        order = Order(customer_name=customer_name, status="DRAFT")
        self.db.add(order)
        await self.db.commit()
        await self.db.refresh(order)
        return order

    async def broadcast(self, order_id: uuid.UUID) -> Order:
        order = await self.get_by_id(order_id)
        if order.status != "DRAFT":
            raise BadRequestException("Only DRAFT orders can be broadcasted")
        order.status = "BROADCASTED"
        await self.db.commit()
        return order

    async def claim_order(self, order_id: uuid.UUID, employee_id: uuid.UUID) -> OrderClaim:
        result = await self.db.execute(
            select(Order).where(Order.id == order_id).with_for_update(skip_locked=True)
        )
        order = result.scalars().first()
        if not order or order.status != "BROADCASTED":
            raise BadRequestException("Order not available for claiming")
        
        # Max claims guard logic could go here
        order.status = "CLAIMED"
        claim = OrderClaim(order_id=order.id, employee_id=employee_id)
        self.db.add(claim)
        
        event = OrderLifecycleEvent(order_id=order.id, status="CLAIMED")
        self.db.add(event)
        
        await self.db.commit()
        await self.db.refresh(claim)
        return claim

    async def update_status(self, order_id: uuid.UUID, status: str) -> Order:
        order = await self.get_by_id(order_id)
        order.status = status
        event = OrderLifecycleEvent(order_id=order.id, status=status)
        self.db.add(event)
        await self.db.commit()
        return order

    async def get_by_id(self, order_id: uuid.UUID) -> Order:
        result = await self.db.execute(select(Order).where(Order.id == order_id))
        order = result.scalars().first()
        if not order:
            raise NotFoundException("Order not found")
        return order

    async def list_by_status(self, status: str):
        result = await self.db.execute(select(Order).where(Order.status == status))
        return result.scalars().all()
"""

FILES["app/routers/orders.py"] = """
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.schemas.order import OrderResponse
from app.services.order_service import OrderService
from app.dependencies import require, get_current_user
from app.models.user import User
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/orders", tags=["orders"])

class OrderCreate(BaseModel):
    customer_name: str

class StatusUpdate(BaseModel):
    status: str

@router.post("/", response_model=OrderResponse)
async def create_order(
    req: OrderCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("orders:create"))
):
    return await OrderService(db).create(req.customer_name)

@router.post("/{order_id}/broadcast", response_model=OrderResponse)
async def broadcast_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("orders:broadcast"))
):
    return await OrderService(db).broadcast(order_id)

@router.post("/{order_id}/claim")
async def claim_order(
    order_id: uuid.UUID,
    employee_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("orders:claim"))
):
    claim = await OrderService(db).claim_order(order_id, employee_id)
    return {"id": claim.id, "order_id": claim.order_id, "status": "CLAIMED"}

@router.put("/{order_id}/status", response_model=OrderResponse)
async def update_status(
    order_id: uuid.UUID,
    req: StatusUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("orders:update"))
):
    return await OrderService(db).update_status(order_id, req.status)

@router.get("/", response_model=List[OrderResponse])
async def list_orders(
    status: str = "DRAFT",
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("orders:read"))
):
    return await OrderService(db).list_by_status(status)
"""

FILES["app/services/task_service.py"] = """
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.task import Task, TaskAssignment, TaskSubmission
from app.exceptions import BadRequestException, NotFoundException
import uuid

class TaskService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, title: str, description: str) -> Task:
        task = Task(title=title, description=description, status="DRAFT")
        self.db.add(task)
        await self.db.commit()
        await self.db.refresh(task)
        return task

    async def assign(self, task_id: uuid.UUID, employee_id: uuid.UUID) -> TaskAssignment:
        task = await self.get_by_id(task_id)
        if task.status == "DRAFT":
            task.status = "PUBLISHED"
        assignment = TaskAssignment(task_id=task_id, employee_id=employee_id)
        self.db.add(assignment)
        await self.db.commit()
        await self.db.refresh(assignment)
        return assignment

    async def submit(self, task_id: uuid.UUID, employee_id: uuid.UUID, evidence_url: str) -> TaskSubmission:
        submission = TaskSubmission(task_id=task_id, employee_id=employee_id, evidence_url=evidence_url, status="SUBMITTED")
        task = await self.get_by_id(task_id)
        task.status = "SUBMITTED"
        self.db.add(submission)
        await self.db.commit()
        await self.db.refresh(submission)
        return submission

    async def review(self, submission_id: uuid.UUID, reviewer_id: uuid.UUID, approved: bool) -> TaskSubmission:
        result = await self.db.execute(select(TaskSubmission).where(TaskSubmission.id == submission_id))
        sub = result.scalars().first()
        if not sub:
            raise NotFoundException("Submission not found")
        # Self-review prevention
        if str(sub.employee_id) == str(reviewer_id):
            raise BadRequestException("Cannot review own submission")
            
        sub.status = "APPROVED" if approved else "REJECTED"
        task = await self.get_by_id(sub.task_id)
        task.status = sub.status
        await self.db.commit()
        return sub

    async def get_by_id(self, task_id: uuid.UUID) -> Task:
        result = await self.db.execute(select(Task).where(Task.id == task_id))
        task = result.scalars().first()
        if not task:
            raise NotFoundException("Task not found")
        return task

    async def list_tasks(self, status: str = None):
        q = select(Task)
        if status:
            q = q.where(Task.status == status)
        result = await self.db.execute(q)
        return result.scalars().all()
"""

FILES["app/routers/tasks.py"] = """
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.database import get_db
from app.schemas.task import TaskResponse, TaskCreate
from app.services.task_service import TaskService
from app.dependencies import require, get_current_user
from app.models.user import User
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/tasks", tags=["tasks"])

class AssignTask(BaseModel):
    employee_id: uuid.UUID

class SubmitTask(BaseModel):
    employee_id: uuid.UUID
    evidence_url: str

class ReviewTask(BaseModel):
    reviewer_id: uuid.UUID
    approved: bool

@router.post("/", response_model=TaskResponse)
async def create_task(
    req: TaskCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("tasks:create"))
):
    return await TaskService(db).create(req.title, req.description)

@router.post("/{task_id}/assign")
async def assign_task(
    task_id: uuid.UUID,
    req: AssignTask,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("tasks:assign"))
):
    assignment = await TaskService(db).assign(task_id, req.employee_id)
    return {"id": assignment.id, "status": "ASSIGNED"}

@router.post("/{task_id}/submit")
async def submit_task(
    task_id: uuid.UUID,
    req: SubmitTask,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("tasks:submit"))
):
    sub = await TaskService(db).submit(task_id, req.employee_id, req.evidence_url)
    return {"id": sub.id, "status": "SUBMITTED"}

@router.post("/submissions/{sub_id}/review")
async def review_task(
    sub_id: uuid.UUID,
    req: ReviewTask,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("tasks:review"))
):
    sub = await TaskService(db).review(sub_id, req.reviewer_id, req.approved)
    return {"id": sub.id, "status": sub.status}

@router.get("/", response_model=List[TaskResponse])
async def list_tasks(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("tasks:read"))
):
    return await TaskService(db).list_tasks(status)
"""

FILES["app/services/leave_service.py"] = """
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.leave import LeaveRequest, LeaveType, LeaveBalance
from app.exceptions import BadRequestException, NotFoundException
import uuid
from datetime import datetime

class LeaveService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_types(self):
        result = await self.db.execute(select(LeaveType))
        return result.scalars().all()

    async def apply(self, employee_id: uuid.UUID, leave_type_id: uuid.UUID, start_date: datetime, end_date: datetime, is_half_day: bool) -> LeaveRequest:
        # Check overlaps
        overlaps = await self.db.execute(
            select(LeaveRequest).where(
                and_(
                    LeaveRequest.employee_id == employee_id,
                    LeaveRequest.status != "REJECTED",
                    LeaveRequest.start_date <= end_date,
                    LeaveRequest.end_date >= start_date
                )
            )
        )
        if overlaps.scalars().first():
            raise BadRequestException("Dates overlap with existing leave request")
            
        req = LeaveRequest(
            employee_id=employee_id,
            leave_type_id=leave_type_id,
            start_date=start_date,
            end_date=end_date,
            is_half_day=is_half_day,
            status="PENDING"
        )
        self.db.add(req)
        await self.db.commit()
        await self.db.refresh(req)
        return req

    async def approve_reject(self, request_id: uuid.UUID, status: str) -> LeaveRequest:
        result = await self.db.execute(select(LeaveRequest).where(LeaveRequest.id == request_id))
        req = result.scalars().first()
        if not req:
            raise NotFoundException("Leave request not found")
        req.status = status
        await self.db.commit()
        return req

    async def get_balance(self, employee_id: uuid.UUID):
        result = await self.db.execute(select(LeaveBalance).where(LeaveBalance.employee_id == employee_id))
        return result.scalars().all()

    async def my_leaves(self, employee_id: uuid.UUID):
        result = await self.db.execute(select(LeaveRequest).where(LeaveRequest.employee_id == employee_id))
        return result.scalars().all()
"""

FILES["app/routers/leaves.py"] = """
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.schemas.leave import LeaveRequestResponse
from app.services.leave_service import LeaveService
from app.dependencies import require, get_current_user
from app.models.user import User
from pydantic import BaseModel
import uuid
from datetime import datetime

router = APIRouter(prefix="/leaves", tags=["leaves"])

class LeaveApply(BaseModel):
    employee_id: uuid.UUID
    leave_type_id: uuid.UUID
    start_date: datetime
    end_date: datetime
    is_half_day: bool

class LeaveReview(BaseModel):
    status: str

@router.get("/types")
async def list_types(db: AsyncSession = Depends(get_db), user: User = Depends(require("leaves:read"))):
    return await LeaveService(db).list_types()

@router.post("/apply", response_model=LeaveRequestResponse)
async def apply_leave(
    req: LeaveApply,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("leaves:create"))
):
    return await LeaveService(db).apply(req.employee_id, req.leave_type_id, req.start_date, req.end_date, req.is_half_day)

@router.post("/{request_id}/review", response_model=LeaveRequestResponse)
async def review_leave(
    request_id: uuid.UUID,
    req: LeaveReview,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("leaves:review"))
):
    return await LeaveService(db).approve_reject(request_id, req.status)

@router.get("/{employee_id}/balances")
async def get_balances(employee_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require("leaves:read"))):
    return await LeaveService(db).get_balance(employee_id)
"""

FILES["app/services/payroll_service.py"] = """
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.payroll import PayrollRun, PayrollSalaryRecord
from app.models.employee import Employee
from app.exceptions import NotFoundException
import uuid

class PayrollService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_run(self, month: int, year: int) -> PayrollRun:
        run = PayrollRun(month=month, year=year, status="DRAFT")
        self.db.add(run)
        await self.db.commit()
        await self.db.refresh(run)
        return run

    async def generate_records(self, run_id: uuid.UUID):
        run = await self.get_run_by_id(run_id)
        # Dummy aggregation logic for now to fulfill the interface
        emps = await self.db.execute(select(Employee))
        for emp in emps.scalars().all():
            rec = PayrollSalaryRecord(
                payroll_run_id=run.id,
                employee_id=emp.id,
                base_salary=5000.0,
                net_salary=4500.0
            )
            self.db.add(rec)
        run.status = "REVIEWED"
        await self.db.commit()
        return run

    async def approve_run(self, run_id: uuid.UUID) -> PayrollRun:
        run = await self.get_run_by_id(run_id)
        run.status = "APPROVED"
        await self.db.commit()
        return run

    async def get_run_by_id(self, run_id: uuid.UUID) -> PayrollRun:
        result = await self.db.execute(select(PayrollRun).where(PayrollRun.id == run_id))
        run = result.scalars().first()
        if not run:
            raise NotFoundException("Payroll Run not found")
        return run

    async def list_payslips(self, run_id: uuid.UUID):
        result = await self.db.execute(select(PayrollSalaryRecord).where(PayrollSalaryRecord.payroll_run_id == run_id))
        return result.scalars().all()
"""

FILES["app/routers/payroll.py"] = """
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.schemas.payroll import PayrollRunResponse
from app.services.payroll_service import PayrollService
from app.dependencies import require, get_current_user
from app.models.user import User
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/payroll", tags=["payroll"])

class PayrollCreate(BaseModel):
    month: int
    year: int

@router.post("/", response_model=PayrollRunResponse)
async def create_run(req: PayrollCreate, db: AsyncSession = Depends(get_db), user: User = Depends(require("payroll:create"))):
    return await PayrollService(db).create_run(req.month, req.year)

@router.post("/{run_id}/generate")
async def generate_records(run_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require("payroll:generate"))):
    run = await PayrollService(db).generate_records(run_id)
    return {"id": run.id, "status": run.status}

@router.post("/{run_id}/approve", response_model=PayrollRunResponse)
async def approve_run(run_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require("payroll:approve"))):
    return await PayrollService(db).approve_run(run_id)

@router.get("/{run_id}/payslips")
async def list_payslips(run_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require("payroll:read"))):
    return await PayrollService(db).list_payslips(run_id)
"""

def write_files():
    for filepath, content in FILES.items():
        full_path = os.path.join(BASE_DIR, filepath)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content.strip() + "\\n")
    print("Complex modules created successfully.")

if __name__ == "__main__":
    write_files()
