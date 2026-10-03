import os

BASE_DIR = r"c:\Users\admin\Desktop\new_crm\backend"
FILES = {}

FILES["app/services/auth_service.py"] = """
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.user import User, Session
from app.models.rbac import UserRole, RolePermission, Role
from app.utils.security import verify_password, generate_session_token
from app.exceptions import UnauthorizedError
from datetime import datetime, timedelta, timezone
import secrets
import uuid

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def authenticate_user(self, email: str, password: str) -> User:
        result = await self.db.execute(
            select(User).where(User.email == email).options(
                selectinload(User.roles).selectinload(UserRole.role).selectinload(Role.role_permissions).selectinload(RolePermission.permission)
            )
        )
        user = result.scalars().first()
        if not user or not verify_password(user.hashed_password, password):
            raise UnauthorizedError("Invalid credentials")
        if not user.is_active:
            raise UnauthorizedError("User is disabled")
        return user

    async def create_session(self, user_id: uuid.UUID, ip_address: str, user_agent: str) -> Session:
        token = generate_session_token()
        csrf_token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        session = Session(
            user_id=user_id,
            token=token,
            csrf_token=csrf_token,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent
        )
        self.db.add(session)
        await self.db.commit()
        await self.db.refresh(session)
        return session

    async def get_user_permissions(self, user: User) -> list[str]:
        if user.is_superuser:
            return ["*"]
        permissions = set()
        for ur in user.roles:
            if getattr(ur.role, 'is_admin', False):
                return ["*"]
            for rp in ur.role.role_permissions:
                permissions.add(rp.permission.code)
        return list(permissions)
"""

FILES["app/services/employee_service.py"] = """
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.models.employee import Employee
from app.models.user import User
from app.utils.security import hash_password
from app.exceptions import NotFoundError, ConflictError
import uuid

class EmployeeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_employee(self, data: dict, current_user_id: uuid.UUID) -> Employee:
        # Check email conflict
        res = await self.db.execute(select(User).where(User.email == data.get("email")))
        if res.scalars().first():
            raise ConflictError("Email already exists")
            
        # Generate EMP code
        count_res = await self.db.execute(select(func.count(Employee.id)))
        count = count_res.scalar() or 0
        emp_code = f"EMP{count + 1:03d}"

        user = User(
            email=data.get("email"),
            hashed_password=hash_password(data.get("password", "temp123")),
            is_active=True
        )
        self.db.add(user)
        await self.db.flush()

        emp = Employee(
            user_id=user.id,
            employee_code=emp_code,
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            phone=data.get("phone"),
            department=data.get("department")
        )
        self.db.add(emp)
        await self.db.commit()
        await self.db.refresh(emp)
        return emp

    async def list_employees(self, search: str = None, skip: int = 0, limit: int = 100):
        q = select(Employee)
        if search:
            q = q.where(
                or_(
                    Employee.first_name.ilike(f"%{search}%"),
                    Employee.last_name.ilike(f"%{search}%"),
                    Employee.employee_code.ilike(f"%{search}%"),
                    Employee.department.ilike(f"%{search}%")
                )
            )
        q = q.offset(skip).limit(limit)
        res = await self.db.execute(q)
        return res.scalars().all()

    async def get_employee(self, id: uuid.UUID) -> Employee:
        res = await self.db.execute(select(Employee).where(Employee.id == id))
        emp = res.scalars().first()
        if not emp:
            raise NotFoundError("Employee not found")
        return emp

    async def update_employee(self, id: uuid.UUID, data: dict) -> Employee:
        emp = await self.get_employee(id)
        for k, v in data.items():
            if hasattr(emp, k) and v is not None:
                setattr(emp, k, v)
        await self.db.commit()
        return emp

    async def deactivate_employee(self, id: uuid.UUID):
        emp = await self.get_employee(id)
        # soft delete user
        res = await self.db.execute(select(User).where(User.id == emp.user_id))
        user = res.scalars().first()
        if user:
            user.is_active = False
        await self.db.commit()
        return emp
"""

FILES["app/services/attendance_service.py"] = """
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.attendance import AttendanceRecord
from app.exceptions import NotFoundError, BusinessRuleError, ValidationError
import uuid
from datetime import datetime, timezone, timedelta

class AttendanceService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def check_in(self, employee_id: uuid.UUID, data: dict) -> AttendanceRecord:
        now = datetime.now(timezone.utc)
        today = now.date()
        
        # Check existing record
        res = await self.db.execute(
            select(AttendanceRecord).where(
                and_(AttendanceRecord.employee_id == employee_id, AttendanceRecord.date == today)
            )
        )
        if res.scalars().first():
            raise BusinessRuleError("Already checked in today")
            
        record = AttendanceRecord(
            employee_id=employee_id,
            date=today,
            check_in_time=now,
            status="IN_PROGRESS"
        )
        # Validate GPS here if data contains lat/lon using geo.py
        self.db.add(record)
        await self.db.commit()
        await self.db.refresh(record)
        return record

    async def check_out(self, employee_id: uuid.UUID, data: dict) -> AttendanceRecord:
        now = datetime.now(timezone.utc)
        today = now.date()
        
        res = await self.db.execute(
            select(AttendanceRecord).where(
                and_(AttendanceRecord.employee_id == employee_id, AttendanceRecord.date == today)
            )
        )
        record = res.scalars().first()
        if not record:
            raise NotFoundError("No check-in record found for today")
        if record.check_out_time:
            raise BusinessRuleError("Already checked out")
            
        record.check_out_time = now
        await self.db.commit()
        return await self.recompute_record(record.id)

    async def start_break(self, employee_id: uuid.UUID):
        now = datetime.now(timezone.utc)
        today = now.date()
        res = await self.db.execute(
            select(AttendanceRecord).where(
                and_(AttendanceRecord.employee_id == employee_id, AttendanceRecord.date == today)
            )
        )
        record = res.scalars().first()
        if not record:
            raise NotFoundError("Check-in first")
        # Assume break tracking fields exist in the updated model
        if hasattr(record, 'break_start_time'):
            record.break_start_time = now
        await self.db.commit()
        return record

    async def end_break(self, employee_id: uuid.UUID):
        now = datetime.now(timezone.utc)
        today = now.date()
        res = await self.db.execute(
            select(AttendanceRecord).where(
                and_(AttendanceRecord.employee_id == employee_id, AttendanceRecord.date == today)
            )
        )
        record = res.scalars().first()
        if not record:
            raise NotFoundError("Record not found")
        if hasattr(record, 'break_end_time'):
            record.break_end_time = now
        await self.db.commit()
        return record

    async def get_today_status(self, employee_id: uuid.UUID):
        today = datetime.now(timezone.utc).date()
        res = await self.db.execute(
            select(AttendanceRecord).where(
                and_(AttendanceRecord.employee_id == employee_id, AttendanceRecord.date == today)
            )
        )
        return res.scalars().first()

    async def list_records(self, employee_id: uuid.UUID, date_from: datetime, date_to: datetime, skip: int = 0, limit: int = 100):
        q = select(AttendanceRecord).where(AttendanceRecord.employee_id == employee_id)
        if date_from: q = q.where(AttendanceRecord.date >= date_from)
        if date_to: q = q.where(AttendanceRecord.date <= date_to)
        q = q.offset(skip).limit(limit)
        res = await self.db.execute(q)
        return res.scalars().all()

    async def recompute_record(self, record_id: uuid.UUID) -> AttendanceRecord:
        res = await self.db.execute(select(AttendanceRecord).where(AttendanceRecord.id == record_id))
        record = res.scalars().first()
        if not record:
            raise NotFoundError("Record not found")
            
        if record.check_in_time and record.check_out_time:
            diff = record.check_out_time - record.check_in_time
            hours = diff.total_seconds() / 3600.0
            
            # Simple break deduction if fields exist
            if hasattr(record, 'break_start_time') and getattr(record, 'break_end_time') and record.break_start_time:
                break_diff = record.break_end_time - record.break_start_time
                hours -= (break_diff.total_seconds() / 3600.0)
                
            record.work_hours = max(0.0, hours)
            
            # Status classification
            if record.work_hours >= 10: record.status = "FULL_DAY"
            elif record.work_hours >= 5: record.status = "HALF_DAY"
            elif record.work_hours >= 0.5: record.status = "PARTIAL_DAY"
            else: record.status = "ABSENT"
            
            # Overtime logic (blocks of 30 mins)
            if record.work_hours > 10:
                raw_ot = record.work_hours - 10
                # round to 0.5 blocks
                blocks = int(raw_ot / 0.5)
                ot = blocks * 0.5
                record.overtime_hours = min(ot, 4.0)
            else:
                record.overtime_hours = 0.0
                
        await self.db.commit()
        return record
"""

FILES["app/services/task_service.py"] = """
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.task import Task, TaskAssignment, TaskSubmission
from app.exceptions import NotFoundError, BusinessRuleError, ValidationError
import uuid
from datetime import datetime, timezone

class TaskService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_task(self, data: dict, current_user_id: uuid.UUID) -> Task:
        task = Task(title=data["title"], description=data.get("description", ""), status="PUBLISHED")
        self.db.add(task)
        await self.db.flush()
        
        # Add assignments
        for emp_id in data.get("assignees", []):
            assignment = TaskAssignment(task_id=task.id, employee_id=emp_id)
            self.db.add(assignment)
            
        await self.db.commit()
        await self.db.refresh(task)
        return task

    async def list_tasks(self, status: str = None, employee_id: uuid.UUID = None, skip: int = 0, limit: int = 100):
        q = select(Task)
        if status:
            q = q.where(Task.status == status)
        if employee_id:
            # Need join for assignments
            q = q.join(TaskAssignment).where(TaskAssignment.employee_id == employee_id)
            
        q = q.offset(skip).limit(limit)
        res = await self.db.execute(q)
        return res.scalars().all()

    async def submit_task(self, task_id: uuid.UUID, employee_id: uuid.UUID, data: dict) -> TaskSubmission:
        res = await self.db.execute(select(TaskAssignment).where(TaskAssignment.task_id == task_id, TaskAssignment.employee_id == employee_id))
        if not res.scalars().first():
            raise ForbiddenError("Not assigned to this task")
            
        task_res = await self.db.execute(select(Task).where(Task.id == task_id))
        task = task_res.scalars().first()
        task.status = "SUBMITTED"
        
        sub = TaskSubmission(task_id=task_id, employee_id=employee_id, evidence_url=data.get("evidence_url"), status="PENDING")
        self.db.add(sub)
        await self.db.commit()
        await self.db.refresh(sub)
        return sub

    async def review_task(self, submission_id: uuid.UUID, reviewer_id: uuid.UUID, data: dict) -> TaskSubmission:
        res = await self.db.execute(select(TaskSubmission).where(TaskSubmission.id == submission_id))
        sub = res.scalars().first()
        if not sub: raise NotFoundError("Submission not found")
        
        # self review check (Assuming reviewer_id relates to Employee via User or passed directly as Employee)
        if str(sub.employee_id) == str(reviewer_id):
            raise BusinessRuleError("Cannot review your own task submission")
            
        sub.status = "APPROVED" if data.get("approved") else "REJECTED"
        
        task_res = await self.db.execute(select(Task).where(Task.id == sub.task_id))
        task = task_res.scalars().first()
        task.status = sub.status
        
        await self.db.commit()
        return sub
"""

def write_files():
    for filepath, content in FILES.items():
        full_path = os.path.join(BASE_DIR, filepath)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content.strip() + "\\n")
    print("Services Part 1 created successfully.")

if __name__ == "__main__":
    write_files()
