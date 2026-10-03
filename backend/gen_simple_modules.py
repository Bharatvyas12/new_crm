import os

BASE_DIR = r"c:\Users\admin\Desktop\new_crm\backend"
FILES = {}

FILES["app/services/employee_service.py"] = """
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.employee import Employee
from app.exceptions import NotFoundException
import uuid

class EmployeeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: uuid.UUID, first_name: str, last_name: str, phone: str = None, department: str = None) -> Employee:
        emp = Employee(user_id=user_id, first_name=first_name, last_name=last_name, phone=phone, department=department)
        self.db.add(emp)
        await self.db.commit()
        await self.db.refresh(emp)
        return emp

    async def get_by_id(self, emp_id: uuid.UUID) -> Employee:
        result = await self.db.execute(select(Employee).where(Employee.id == emp_id))
        emp = result.scalars().first()
        if not emp:
            raise NotFoundException("Employee not found")
        return emp

    async def update(self, emp_id: uuid.UUID, **kwargs) -> Employee:
        emp = await self.get_by_id(emp_id)
        for k, v in kwargs.items():
            if v is not None:
                setattr(emp, k, v)
        await self.db.commit()
        return emp

    async def list_all(self):
        result = await self.db.execute(select(Employee))
        return result.scalars().all()
"""

FILES["app/routers/employees.py"] = """
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.database import get_db
from app.schemas.employee import EmployeeResponse
from app.services.employee_service import EmployeeService
from app.dependencies import require
from app.models.user import User
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/employees", tags=["employees"])

class EmployeeCreate(BaseModel):
    user_id: uuid.UUID
    first_name: str
    last_name: str
    phone: Optional[str] = None
    department: Optional[str] = None

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None

@router.post("/", response_model=EmployeeResponse)
async def create_employee(req: EmployeeCreate, db: AsyncSession = Depends(get_db), user: User = Depends(require("employees:create"))):
    return await EmployeeService(db).create(req.user_id, req.first_name, req.last_name, req.phone, req.department)

@router.get("/{emp_id}", response_model=EmployeeResponse)
async def get_employee(emp_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require("employees:read"))):
    return await EmployeeService(db).get_by_id(emp_id)

@router.put("/{emp_id}", response_model=EmployeeResponse)
async def update_employee(emp_id: uuid.UUID, req: EmployeeUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(require("employees:update"))):
    return await EmployeeService(db).update(emp_id, **req.dict(exclude_unset=True))

@router.get("/", response_model=List[EmployeeResponse])
async def list_employees(db: AsyncSession = Depends(get_db), user: User = Depends(require("employees:read"))):
    return await EmployeeService(db).list_all()
"""

FILES["app/services/ledger_service.py"] = """
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.ledger import LedgerEntry, EmployeeAdvance, AdvanceRepayment
from app.exceptions import NotFoundException
import uuid

class LedgerService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_advance(self, employee_id: uuid.UUID, amount: float) -> EmployeeAdvance:
        adv = EmployeeAdvance(employee_id=employee_id, amount=amount, status="PENDING")
        self.db.add(adv)
        await self.db.commit()
        await self.db.refresh(adv)
        return adv

    async def approve_advance(self, advance_id: uuid.UUID) -> EmployeeAdvance:
        result = await self.db.execute(select(EmployeeAdvance).where(EmployeeAdvance.id == advance_id))
        adv = result.scalars().first()
        if not adv:
            raise NotFoundException("Advance not found")
        adv.status = "APPROVED"
        
        entry = LedgerEntry(employee_id=adv.employee_id, amount=adv.amount, entry_type="DEBIT", description="Advance Approved")
        self.db.add(entry)
        await self.db.commit()
        return adv

    async def list_entries(self, employee_id: uuid.UUID):
        result = await self.db.execute(select(LedgerEntry).where(LedgerEntry.employee_id == employee_id))
        return result.scalars().all()
"""

FILES["app/routers/ledger.py"] = """
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.schemas.ledger import LedgerEntryResponse
from app.services.ledger_service import LedgerService
from app.dependencies import require
from app.models.user import User
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/ledger", tags=["ledger"])

class AdvanceRequest(BaseModel):
    employee_id: uuid.UUID
    amount: float

@router.post("/advances")
async def create_advance(req: AdvanceRequest, db: AsyncSession = Depends(get_db), user: User = Depends(require("ledger:create"))):
    adv = await LedgerService(db).create_advance(req.employee_id, req.amount)
    return {"id": adv.id, "status": adv.status}

@router.post("/advances/{advance_id}/approve")
async def approve_advance(advance_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require("ledger:approve"))):
    adv = await LedgerService(db).approve_advance(advance_id)
    return {"id": adv.id, "status": adv.status}

@router.get("/{employee_id}/entries", response_model=List[LedgerEntryResponse])
async def list_entries(employee_id: uuid.UUID, db: AsyncSession = Depends(get_db), user: User = Depends(require("ledger:read"))):
    return await LedgerService(db).list_entries(employee_id)
"""

FILES["app/services/complaint_service.py"] = """
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.complaint import Complaint, ComplaintComment
from app.exceptions import NotFoundException
import uuid

class ComplaintService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, category_id: uuid.UUID, creator_id: uuid.UUID, description: str, visibility: str) -> Complaint:
        comp = Complaint(category_id=category_id, creator_id=creator_id, description=description, visibility=visibility)
        self.db.add(comp)
        await self.db.commit()
        await self.db.refresh(comp)
        return comp

    async def add_comment(self, complaint_id: uuid.UUID, user_id: uuid.UUID, comment: str) -> ComplaintComment:
        cmt = ComplaintComment(complaint_id=complaint_id, user_id=user_id, comment=comment)
        self.db.add(cmt)
        await self.db.commit()
        await self.db.refresh(cmt)
        return cmt

    async def list_complaints(self):
        result = await self.db.execute(select(Complaint))
        return result.scalars().all()
"""

FILES["app/routers/complaints.py"] = """
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.schemas.complaint import ComplaintResponse
from app.services.complaint_service import ComplaintService
from app.dependencies import require, get_current_user
from app.models.user import User
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/complaints", tags=["complaints"])

class ComplaintCreate(BaseModel):
    category_id: uuid.UUID
    description: str
    visibility: str = "EMPLOYEE_PRIVATE"

class CommentCreate(BaseModel):
    comment: str

@router.post("/", response_model=ComplaintResponse)
async def create_complaint(req: ComplaintCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await ComplaintService(db).create(req.category_id, user.id, req.description, req.visibility)

@router.post("/{comp_id}/comments")
async def add_comment(comp_id: uuid.UUID, req: CommentCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    cmt = await ComplaintService(db).add_comment(comp_id, user.id, req.comment)
    return {"id": cmt.id, "comment": cmt.comment}

@router.get("/", response_model=List[ComplaintResponse])
async def list_complaints(db: AsyncSession = Depends(get_db), user: User = Depends(require("complaints:read"))):
    return await ComplaintService(db).list_complaints()
"""

FILES["app/services/settings_service.py"] = """
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.settings import BusinessSetting
from app.exceptions import NotFoundException
import uuid

class SettingsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(select(BusinessSetting))
        return result.scalars().all()

    async def update_setting(self, key: str, value: dict) -> BusinessSetting:
        result = await self.db.execute(select(BusinessSetting).where(BusinessSetting.key == key))
        setting = result.scalars().first()
        if not setting:
            raise NotFoundException("Setting not found")
        setting.value = value
        await self.db.commit()
        return setting
"""

FILES["app/routers/settings.py"] = """
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
from app.database import get_db
from app.schemas.settings import SettingResponse
from app.services.settings_service import SettingsService
from app.dependencies import require
from app.models.user import User
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/settings", tags=["settings"])

class SettingUpdate(BaseModel):
    value: Dict[str, Any]

@router.get("/", response_model=List[SettingResponse])
async def list_settings(db: AsyncSession = Depends(get_db), user: User = Depends(require("settings:read"))):
    return await SettingsService(db).get_all()

@router.put("/{key}", response_model=SettingResponse)
async def update_setting(key: str, req: SettingUpdate, db: AsyncSession = Depends(get_db), user: User = Depends(require("settings:update"))):
    return await SettingsService(db).update_setting(key, req.value)
"""

FILES["app/services/rbac_service.py"] = """
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.rbac import Role, Permission
from app.exceptions import NotFoundException
import uuid

class RbacService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_roles(self):
        result = await self.db.execute(select(Role))
        return result.scalars().all()

    async def create_role(self, name: str, description: str, is_admin: bool) -> Role:
        role = Role(name=name, description=description, is_admin=is_admin)
        self.db.add(role)
        await self.db.commit()
        await self.db.refresh(role)
        return role
"""

FILES["app/routers/roles.py"] = """
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database import get_db
from app.schemas.rbac import RoleResponse
from app.services.rbac_service import RbacService
from app.dependencies import require
from app.models.user import User
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/roles", tags=["roles"])

class RoleCreate(BaseModel):
    name: str
    description: str = ""
    is_admin: bool = False

@router.get("/", response_model=List[RoleResponse])
async def list_roles(db: AsyncSession = Depends(get_db), user: User = Depends(require("roles:read"))):
    return await RbacService(db).get_roles()

@router.post("/", response_model=RoleResponse)
async def create_role(req: RoleCreate, db: AsyncSession = Depends(get_db), user: User = Depends(require("roles:create"))):
    return await RbacService(db).create_role(req.name, req.description, req.is_admin)
"""

def write_files():
    for filepath, content in FILES.items():
        full_path = os.path.join(BASE_DIR, filepath)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content.strip() + "\\n")
    print("Simple modules created successfully.")

if __name__ == "__main__":
    write_files()
