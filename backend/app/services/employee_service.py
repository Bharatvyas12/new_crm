from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.models.employee import Employee
from app.models.user import User
from app.models.rbac import UserRole, Role
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.utils.security import hash_password
from app.exceptions import NotFoundError, ConflictError
import uuid


class EmployeeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _generate_employee_code(self) -> str:
        result = await self.db.execute(select(func.count(Employee.id)))
        count = result.scalar() or 0
        return f"EMP{count + 1:03d}"

    async def create_employee(
        self, data: EmployeeCreate, created_by: uuid.UUID
    ) -> Employee:
        # Check duplicate email
        existing = await self.db.execute(
            select(User).where(User.email == data.email)
        )
        if existing.scalars().first():
            raise ConflictError(f"Email {data.email} already in use")

        # Create user account
        user = User(
            email=data.email,
            hashed_password=hash_password(data.password),
            full_name=data.full_name,
            is_active=True,
            is_superuser=False,
        )
        self.db.add(user)
        await self.db.flush()

        # Assign EMPLOYEE role
        result = await self.db.execute(
            select(Role).where(Role.name == "EMPLOYEE")
        )
        employee_role = result.scalars().first()
        if employee_role:
            user_role = UserRole(user_id=user.id, role_id=employee_role.id)
            self.db.add(user_role)

        # Create employee profile
        employee_code = await self._generate_employee_code()
        employee = Employee(
            user_id=user.id,
            employee_code=employee_code,
            full_name=data.full_name,
            phone=data.phone,
            department=data.department,
            designation=data.designation,
            employment_type=data.employment_type,
            base_salary=data.base_salary,
            hourly_rate=data.hourly_rate,
        )
        self.db.add(employee)
        await self.db.flush()
        return employee

    async def list_employees(
        self,
        search: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> dict:
        query = select(Employee)
        count_query = select(func.count(Employee.id))

        if search:
            search_filter = or_(
                Employee.full_name.ilike(f"%{search}%"),
                Employee.employee_code.ilike(f"%{search}%"),
                Employee.department.ilike(f"%{search}%"),
            )
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        total = (await self.db.execute(count_query)).scalar() or 0
        result = await self.db.execute(
            query.order_by(Employee.created_at.desc()).offset(skip).limit(limit)
        )
        employees = result.scalars().all()

        return {"employees": employees, "total": total}

    async def get_employee(self, employee_id: uuid.UUID) -> Employee:
        result = await self.db.execute(
            select(Employee).where(Employee.id == employee_id)
        )
        employee = result.scalars().first()
        if not employee:
            raise NotFoundError("Employee", str(employee_id))
        return employee

    async def update_employee(
        self, employee_id: uuid.UUID, data: EmployeeUpdate
    ) -> Employee:
        employee = await self.get_employee(employee_id)
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(employee, key, value)
        await self.db.flush()
        return employee

    async def deactivate_employee(self, employee_id: uuid.UUID) -> None:
        employee = await self.get_employee(employee_id)
        employee.is_active = False
        # Also deactivate the user account
        result = await self.db.execute(
            select(User).where(User.id == employee.user_id)
        )
        user = result.scalars().first()
        if user:
            user.is_active = False
        await self.db.flush()