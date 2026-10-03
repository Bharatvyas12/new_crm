import os

BASE_DIR = r"c:\Users\admin\Desktop\new_crm\backend"
FILES = {}

FILES["app/services/complaint_service.py"] = """
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models.complaint import Complaint, ComplaintComment
from app.exceptions import NotFoundError
import uuid

class ComplaintService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_complaint(self, employee_id: uuid.UUID, data: dict) -> Complaint:
        comp = Complaint(
            category_id=data["category_id"],
            creator_id=employee_id,
            description=data["description"],
            visibility=data.get("visibility", "EMPLOYEE_PRIVATE"),
            status="OPEN"
        )
        self.db.add(comp)
        await self.db.commit()
        await self.db.refresh(comp)
        return comp

    async def list_complaints(self, employee_id: uuid.UUID, is_admin: bool, status: str = None, skip: int = 0, limit: int = 100):
        q = select(Complaint)
        if not is_admin:
            q = q.where(
                or_(
                    Complaint.visibility == "PUBLIC",
                    Complaint.creator_id == employee_id
                )
            )
        if status:
            q = q.where(Complaint.status == status)
        q = q.offset(skip).limit(limit)
        res = await self.db.execute(q)
        return res.scalars().all()

    async def update_status(self, complaint_id: uuid.UUID, data: dict, user_id: uuid.UUID) -> Complaint:
        res = await self.db.execute(select(Complaint).where(Complaint.id == complaint_id))
        comp = res.scalars().first()
        if not comp: raise NotFoundError("Complaint not found")
        comp.status = data["status"]
        await self.db.commit()
        return comp

    async def add_comment(self, complaint_id: uuid.UUID, user_id: uuid.UUID, data: dict) -> ComplaintComment:
        cmt = ComplaintComment(complaint_id=complaint_id, user_id=user_id, comment=data["comment"])
        self.db.add(cmt)
        await self.db.commit()
        await self.db.refresh(cmt)
        return cmt
"""

FILES["app/services/payroll_service.py"] = """
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.payroll import PayrollRun, PayrollSalaryRecord, PayrollRuleSnapshot
from app.models.employee import Employee
from app.models.ledger import LedgerEntry
from app.exceptions import NotFoundError, BusinessRuleError
import uuid

class PayrollService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_run(self, data: dict, user_id: uuid.UUID) -> PayrollRun:
        run = PayrollRun(month=data["month"], year=data["year"], status="DRAFT")
        self.db.add(run)
        await self.db.flush()
        
        # Capture simple snapshot
        snap = PayrollRuleSnapshot(payroll_run_id=run.id, rules={"base_multiplier": 1.0, "tax_rate": 0.1})
        self.db.add(snap)
        
        await self.db.commit()
        await self.db.refresh(run)
        return run

    async def generate_records(self, run_id: uuid.UUID):
        res = await self.db.execute(select(PayrollRun).where(PayrollRun.id == run_id))
        run = res.scalars().first()
        if not run: raise NotFoundError("Payroll run not found")
        
        if run.status != "DRAFT":
            raise BusinessRuleError("Run must be DRAFT to generate records")

        # Dummy complex logic representation
        emps_res = await self.db.execute(select(Employee))
        emps = emps_res.scalars().all()
        for emp in emps:
            # Here we would aggregate attendance, leave deductions, ledger advances
            base = 5000.0
            net = 4500.0
            rec = PayrollSalaryRecord(payroll_run_id=run.id, employee_id=emp.id, base_salary=base, net_salary=net)
            self.db.add(rec)
            
        run.status = "REVIEWED"
        await self.db.commit()
        return run

    async def approve_run(self, run_id: uuid.UUID, user_id: uuid.UUID) -> PayrollRun:
        res = await self.db.execute(select(PayrollRun).where(PayrollRun.id == run_id))
        run = res.scalars().first()
        if not run: raise NotFoundError("Payroll run not found")
        run.status = "APPROVED"
        await self.db.commit()
        return run

    async def mark_paid(self, run_id: uuid.UUID, user_id: uuid.UUID) -> PayrollRun:
        res = await self.db.execute(select(PayrollRun).where(PayrollRun.id == run_id))
        run = res.scalars().first()
        if not run: raise NotFoundError("Payroll run not found")
        if run.status != "APPROVED": raise BusinessRuleError("Run must be APPROVED to pay")
        
        # Fetch records and create ledger entries
        recs_res = await self.db.execute(select(PayrollSalaryRecord).where(PayrollSalaryRecord.payroll_run_id == run.id))
        for rec in recs_res.scalars().all():
            entry = LedgerEntry(employee_id=rec.employee_id, amount=rec.net_salary, entry_type="CREDIT", description=f"Salary for {run.month}/{run.year}")
            self.db.add(entry)
            
        run.status = "PAID"
        await self.db.commit()
        return run
"""

FILES["app/services/settings_service.py"] = """
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.settings import BusinessSetting
from app.exceptions import NotFoundError
import uuid

class SettingsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        res = await self.db.execute(select(BusinessSetting))
        return res.scalars().all()

    async def get_by_category(self, category: str):
        res = await self.db.execute(select(BusinessSetting).where(BusinessSetting.category == category))
        return res.scalars().all()

    async def get_value(self, key: str):
        res = await self.db.execute(select(BusinessSetting).where(BusinessSetting.key == key))
        setting = res.scalars().first()
        if not setting: raise NotFoundError(f"Setting {key} not found")
        return setting.value

    async def update_settings(self, updates: dict):
        res = await self.db.execute(select(BusinessSetting))
        settings_map = {s.key: s for s in res.scalars().all()}
        for k, v in updates.items():
            if k in settings_map:
                settings_map[k].value = v
        await self.db.commit()
        return True

    async def get_schema(self):
        res = await self.db.execute(select(BusinessSetting))
        settings = res.scalars().all()
        return [
            {
                "key": s.key,
                "category": s.category,
                "data_type": s.data_type,
                "label": s.label,
                "description": s.description,
                "default_value": s.default_value
            }
            for s in settings
        ]
"""

FILES["app/services/audit_service.py"] = """
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog
import uuid

class AuditService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(self, actor_id: uuid.UUID, category: str, action: str, entity_type: str, entity_id: uuid.UUID, before: dict, after: dict, ip: str):
        audit = AuditLog(
            actor_user_id=actor_id,
            category=category,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            before_state=before,
            after_state=after,
            ip_address=ip
        )
        self.db.add(audit)
        await self.db.commit()
"""

def write_files():
    for filepath, content in FILES.items():
        full_path = os.path.join(BASE_DIR, filepath)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content.strip() + "\\n")
            
    # Delete generic_service.py
    target = os.path.join(BASE_DIR, "app/services/generic_service.py")
    if os.path.exists(target):
        os.remove(target)
        print("Deleted generic_service.py")
        
    print("Services Part 3 created successfully.")

if __name__ == "__main__":
    write_files()
