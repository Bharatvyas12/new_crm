import os

BASE_DIR = r"c:\Users\admin\Desktop\new_crm\backend"
FILES = {}

FILES["app/services/order_service.py"] = """
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.order import Order, OrderClaim, OrderLifecycleEvent
from app.exceptions import NotFoundError, BusinessRuleError, ConflictError
import uuid

class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_order(self, data: dict, user_id: uuid.UUID) -> Order:
        count_res = await self.db.execute(select(func.count(Order.id)))
        count = count_res.scalar() or 0
        order_number = f"ORD-{count + 1:04d}"

        order = Order(
            customer_name=data.get("customer_name"),
            status="DRAFT"
        )
        if hasattr(order, 'order_number'):
            order.order_number = order_number

        self.db.add(order)
        await self.db.commit()
        await self.db.refresh(order)
        return order

    async def broadcast_order(self, order_id: uuid.UUID, user_id: uuid.UUID) -> Order:
        res = await self.db.execute(select(Order).where(Order.id == order_id))
        order = res.scalars().first()
        if not order: raise NotFoundError("Order not found")
        if order.status != "DRAFT": raise BusinessRuleError("Order must be in DRAFT status")
        
        order.status = "BROADCASTED"
        await self.db.commit()
        return order

    async def claim_order(self, order_id: uuid.UUID, employee_id: uuid.UUID) -> OrderClaim:
        res = await self.db.execute(
            select(Order).where(Order.id == order_id).with_for_update(skip_locked=True)
        )
        order = res.scalars().first()
        if not order: raise NotFoundError("Order not found or locked by another transaction")
        if order.status != "BROADCASTED": raise BusinessRuleError("Order is not available for claiming")

        # Max claims check
        claims_res = await self.db.execute(
            select(func.count(OrderClaim.id)).where(OrderClaim.employee_id == employee_id)
        )
        active_claims = claims_res.scalar() or 0
        if active_claims >= 5: # Arbitrary rule logic
            raise BusinessRuleError("Max active claims reached")

        order.status = "CLAIMED"
        claim = OrderClaim(order_id=order_id, employee_id=employee_id)
        self.db.add(claim)
        
        event = OrderLifecycleEvent(order_id=order_id, status="CLAIMED")
        self.db.add(event)
        
        await self.db.commit()
        await self.db.refresh(claim)
        return claim

    async def update_order_status(self, order_id: uuid.UUID, status: str, user_id: uuid.UUID) -> Order:
        res = await self.db.execute(select(Order).where(Order.id == order_id))
        order = res.scalars().first()
        if not order: raise NotFoundError("Order not found")
        
        valid_transitions = {
            "CLAIMED": ["PACKING"],
            "PACKING": ["PACKED"],
            "PACKED": ["READY_FOR_DELIVERY"],
            "READY_FOR_DELIVERY": ["DELIVERED", "CANCELLED"]
        }
        allowed = valid_transitions.get(order.status, [])
        if status not in allowed and status != "CANCELLED":
            raise BusinessRuleError(f"Invalid transition from {order.status} to {status}")

        order.status = status
        event = OrderLifecycleEvent(order_id=order_id, status=status)
        self.db.add(event)
        await self.db.commit()
        return order

    async def deliver_order(self, order_id: uuid.UUID, pod_data: str, user_id: uuid.UUID) -> Order:
        res = await self.db.execute(select(Order).where(Order.id == order_id))
        order = res.scalars().first()
        if not order: raise NotFoundError("Order not found")
        if order.status != "READY_FOR_DELIVERY": raise BusinessRuleError("Order not ready for delivery")
        
        order.status = "DELIVERED"
        if hasattr(order, 'pod_data'):
            order.pod_data = pod_data
            
        event = OrderLifecycleEvent(order_id=order_id, status="DELIVERED")
        self.db.add(event)
        await self.db.commit()
        return order

    async def list_orders(self, status: str = None, skip: int = 0, limit: int = 100):
        q = select(Order)
        if status: q = q.where(Order.status == status)
        q = q.offset(skip).limit(limit)
        res = await self.db.execute(q)
        return res.scalars().all()
"""

FILES["app/services/leave_service.py"] = """
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.leave import LeaveRequest, LeaveType, LeaveBalance
from app.exceptions import NotFoundError, BusinessRuleError, ConflictError
import uuid
from datetime import datetime

class LeaveService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_leave_types(self):
        res = await self.db.execute(select(LeaveType))
        return res.scalars().all()

    async def apply_leave(self, employee_id: uuid.UUID, data: dict) -> LeaveRequest:
        start_date = data["start_date"]
        end_date = data["end_date"]
        leave_type_id = data["leave_type_id"]

        # Check overlap
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
            raise ConflictError("Dates overlap with existing leave request")

        req = LeaveRequest(
            employee_id=employee_id,
            leave_type_id=leave_type_id,
            start_date=start_date,
            end_date=end_date,
            is_half_day=data.get("is_half_day", False),
            status="PENDING"
        )
        self.db.add(req)
        await self.db.commit()
        await self.db.refresh(req)
        return req

    async def review_leave(self, request_id: uuid.UUID, reviewer_id: uuid.UUID, data: dict) -> LeaveRequest:
        res = await self.db.execute(select(LeaveRequest).where(LeaveRequest.id == request_id))
        req = res.scalars().first()
        if not req: raise NotFoundError("Leave request not found")
        
        status = data.get("status")
        req.status = status
        
        if status == "APPROVED":
            # deduct balance
            bal_res = await self.db.execute(
                select(LeaveBalance).where(
                    and_(LeaveBalance.employee_id == req.employee_id, LeaveBalance.leave_type_id == req.leave_type_id)
                )
            )
            bal = bal_res.scalars().first()
            if bal:
                days = 0.5 if req.is_half_day else (req.end_date - req.start_date).days + 1
                bal.balance -= days
                
        await self.db.commit()
        return req

    async def get_balances(self, employee_id: uuid.UUID, year: int = None):
        q = select(LeaveBalance).where(LeaveBalance.employee_id == employee_id)
        res = await self.db.execute(q)
        return res.scalars().all()

    async def list_requests(self, employee_id: uuid.UUID = None, status: str = None, skip: int = 0, limit: int = 100):
        q = select(LeaveRequest)
        if employee_id: q = q.where(LeaveRequest.employee_id == employee_id)
        if status: q = q.where(LeaveRequest.status == status)
        q = q.offset(skip).limit(limit)
        res = await self.db.execute(q)
        return res.scalars().all()
"""

FILES["app/services/ledger_service.py"] = """
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.ledger import LedgerEntry, EmployeeAdvance, AdvanceRepayment
from app.exceptions import NotFoundError, BusinessRuleError
import uuid

class LedgerService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def request_advance(self, employee_id: uuid.UUID, data: dict) -> EmployeeAdvance:
        adv = EmployeeAdvance(employee_id=employee_id, amount=data["amount"], status="PENDING")
        self.db.add(adv)
        await self.db.commit()
        await self.db.refresh(adv)
        return adv

    async def review_advance(self, advance_id: uuid.UUID, reviewer_id: uuid.UUID, status: str) -> EmployeeAdvance:
        res = await self.db.execute(select(EmployeeAdvance).where(EmployeeAdvance.id == advance_id))
        adv = res.scalars().first()
        if not adv: raise NotFoundError("Advance not found")
        adv.status = status
        await self.db.commit()
        return adv

    async def disburse_advance(self, advance_id: uuid.UUID, user_id: uuid.UUID) -> EmployeeAdvance:
        res = await self.db.execute(select(EmployeeAdvance).where(EmployeeAdvance.id == advance_id))
        adv = res.scalars().first()
        if not adv or adv.status != "APPROVED":
            raise BusinessRuleError("Advance must be APPROVED to be disbursed")
            
        adv.status = "DISBURSED"
        entry = LedgerEntry(employee_id=adv.employee_id, amount=adv.amount, entry_type="DEBIT", description="Advance Disbursement")
        self.db.add(entry)
        await self.db.commit()
        return adv

    async def record_repayment(self, data: dict, user_id: uuid.UUID) -> AdvanceRepayment:
        adv_id = data["advance_id"]
        amount = data["amount"]
        
        res = await self.db.execute(select(EmployeeAdvance).where(EmployeeAdvance.id == adv_id))
        adv = res.scalars().first()
        if not adv: raise NotFoundError("Advance not found")
        
        rep = AdvanceRepayment(advance_id=adv_id, amount=amount)
        self.db.add(rep)
        
        entry = LedgerEntry(employee_id=adv.employee_id, amount=amount, entry_type="CREDIT", description="Advance Repayment")
        self.db.add(entry)
        
        await self.db.commit()
        await self.db.refresh(rep)
        return rep

    async def get_employee_ledger(self, employee_id: uuid.UUID, skip: int = 0, limit: int = 100):
        res = await self.db.execute(select(LedgerEntry).where(LedgerEntry.employee_id == employee_id).offset(skip).limit(limit))
        return res.scalars().all()
"""

def write_files():
    for filepath, content in FILES.items():
        full_path = os.path.join(BASE_DIR, filepath)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content.strip() + "\\n")
    print("Services Part 2 created successfully.")

if __name__ == "__main__":
    write_files()
