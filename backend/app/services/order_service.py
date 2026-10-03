from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.order import Order, OrderClaim, OrderLifecycleEvent, OrderStatus
from app.schemas.order import OrderCreate, OrderStatusUpdate, PODRequest
from app.exceptions import NotFoundError, BusinessRuleError, ConflictError
from datetime import datetime, timezone
import uuid


class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def _generate_order_number(self) -> str:
        result = await self.db.execute(select(func.count(Order.id)))
        count = result.scalar() or 0
        return f"ORD-{count + 1:04d}"

    async def create_order(self, data: OrderCreate, user_id: uuid.UUID) -> Order:
        order_number = await self._generate_order_number()
        order = Order(
            order_number=order_number,
            customer_name=data.customer_name,
            customer_phone=data.customer_phone,
            customer_address=data.customer_address,
            total_amount=data.total_amount,
            items_description=data.items_description,
            notes=data.notes,
            status=OrderStatus.DRAFT.value,
            created_by=user_id,
        )
        self.db.add(order)
        await self.db.flush()
        return order

    async def get_order(self, order_id: uuid.UUID) -> Order:
        result = await self.db.execute(
            select(Order).where(Order.id == order_id)
        )
        order = result.scalars().first()
        if not order:
            raise NotFoundError("Order", str(order_id))
        return order

    async def broadcast_order(self, order_id: uuid.UUID, user_id: uuid.UUID) -> Order:
        order = await self.get_order(order_id)
        if order.status != OrderStatus.DRAFT.value:
            raise BusinessRuleError("Only DRAFT orders can be broadcasted")

        order.status = OrderStatus.BROADCASTED.value
        order.broadcasted_at = datetime.now(timezone.utc)
        order.broadcasted_by = user_id

        event = OrderLifecycleEvent(
            order_id=order.id,
            from_status=OrderStatus.DRAFT.value,
            to_status=OrderStatus.BROADCASTED.value,
            changed_by=user_id,
        )
        self.db.add(event)
        await self.db.flush()
        return order

    async def claim_order(
        self, order_id: uuid.UUID, employee_id: uuid.UUID
    ) -> OrderClaim:
        # Atomic lock — SELECT FOR UPDATE prevents race conditions
        result = await self.db.execute(
            select(Order)
            .where(Order.id == order_id)
            .with_for_update(skip_locked=True)
        )
        order = result.scalars().first()
        if not order:
            raise ConflictError("Order is being processed by another user")
        if order.status != OrderStatus.BROADCASTED.value:
            raise BusinessRuleError("Order is not available for claiming")

        # Max active claims guard (default: 3)
        claims_result = await self.db.execute(
            select(func.count(OrderClaim.id)).where(
                and_(
                    OrderClaim.employee_id == employee_id,
                    OrderClaim.is_active == True,
                )
            )
        )
        active_claims = claims_result.scalar() or 0
        if active_claims >= 3:
            raise BusinessRuleError("Maximum active claims limit reached (3)")

        # Claim the order
        order.status = OrderStatus.CLAIMED.value
        order.claimed_by_employee_id = employee_id
        order.claimed_at = datetime.now(timezone.utc)

        claim = OrderClaim(
            order_id=order_id,
            employee_id=employee_id,
            is_active=True,
        )
        self.db.add(claim)

        event = OrderLifecycleEvent(
            order_id=order_id,
            from_status=OrderStatus.BROADCASTED.value,
            to_status=OrderStatus.CLAIMED.value,
            changed_by=employee_id,
        )
        self.db.add(event)
        await self.db.flush()
        return claim

    async def update_order_status(
        self, order_id: uuid.UUID, status: str, user_id: uuid.UUID, notes: str | None = None
    ) -> Order:
        order = await self.get_order(order_id)

        valid_transitions = {
            "CLAIMED": ["PACKING", "CANCELLED"],
            "PACKING": ["PACKED", "CANCELLED"],
            "PACKED": ["READY_FOR_DELIVERY", "CANCELLED"],
            "READY_FOR_DELIVERY": ["DELIVERED", "CANCELLED"],
        }
        allowed = valid_transitions.get(order.status, [])
        if status not in allowed:
            raise BusinessRuleError(
                f"Cannot transition from {order.status} to {status}"
            )

        old_status = order.status
        order.status = status

        event = OrderLifecycleEvent(
            order_id=order_id,
            from_status=old_status,
            to_status=status,
            changed_by=user_id,
            notes=notes,
        )
        self.db.add(event)
        await self.db.flush()
        return order

    async def deliver_order(
        self, order_id: uuid.UUID, pod_data: PODRequest, user_id: uuid.UUID
    ) -> Order:
        order = await self.get_order(order_id)
        if order.status != OrderStatus.READY_FOR_DELIVERY.value:
            raise BusinessRuleError("Order is not ready for delivery")

        order.status = OrderStatus.DELIVERED.value
        order.delivered_at = datetime.now(timezone.utc)
        order.pod_photo_url = pod_data.photo_url
        order.pod_signature_url = pod_data.signature_url

        # Deactivate the claim
        claims_result = await self.db.execute(
            select(OrderClaim).where(
                and_(
                    OrderClaim.order_id == order_id,
                    OrderClaim.is_active == True,
                )
            )
        )
        for claim in claims_result.scalars().all():
            claim.is_active = False

        event = OrderLifecycleEvent(
            order_id=order_id,
            from_status=OrderStatus.READY_FOR_DELIVERY.value,
            to_status=OrderStatus.DELIVERED.value,
            changed_by=user_id,
            notes=pod_data.notes,
        )
        self.db.add(event)
        await self.db.flush()
        return order

    async def list_orders(
        self, status: str | None = None, skip: int = 0, limit: int = 50
    ) -> dict:
        query = select(Order)
        count_query = select(func.count(Order.id))

        if status:
            query = query.where(Order.status == status)
            count_query = count_query.where(Order.status == status)

        total = (await self.db.execute(count_query)).scalar() or 0
        result = await self.db.execute(
            query.order_by(Order.created_at.desc()).offset(skip).limit(limit)
        )
        orders = result.scalars().all()
        return {"orders": orders, "total": total}

    async def get_employee_orders(self, employee_id: uuid.UUID) -> dict:
        result = await self.db.execute(
            select(Order)
            .where(Order.claimed_by_employee_id == employee_id)
            .where(Order.status.in_(["CLAIMED", "PACKING", "PACKED", "READY_FOR_DELIVERY"]))
            .order_by(Order.claimed_at.desc())
        )
        orders = result.scalars().all()
        return {"orders": orders, "total": len(orders)}