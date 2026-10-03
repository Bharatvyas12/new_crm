from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.order import OrderCreate, OrderStatusUpdate, OrderResponse, PODRequest
from app.services.order_service import OrderService
from app.dependencies import require
from app.models.user import User
import uuid

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("/")
async def list_orders(
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("orders.read.all")),
):
    service = OrderService(db)
    return await service.list_orders(status=status, skip=skip, limit=limit)


@router.get("/pool")
async def get_order_pool(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("orders.claim")),
):
    """Get all broadcasted orders available for claiming."""
    service = OrderService(db)
    return await service.list_orders(status="BROADCASTED", skip=0, limit=100)


@router.post("/", response_model=OrderResponse)
async def create_order(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("orders.create")),
):
    service = OrderService(db)
    return await service.create_order(data, user.id)


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("orders.read.all")),
):
    service = OrderService(db)
    return await service.get_order(order_id)


@router.post("/{order_id}/broadcast")
async def broadcast_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("orders.broadcast")),
):
    service = OrderService(db)
    order = await service.broadcast_order(order_id, user.id)
    return {"message": "Order broadcasted", "order_id": str(order.id)}


@router.post("/{order_id}/claim")
async def claim_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("orders.claim")),
):
    service = OrderService(db)
    claim = await service.claim_order(order_id, user.employee.id)
    return {"message": "Order claimed", "claim_id": str(claim.id)}


@router.post("/{order_id}/status")
async def update_order_status(
    order_id: uuid.UUID,
    data: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("orders.update.status")),
):
    service = OrderService(db)
    order = await service.update_order_status(order_id, data.status, user.id, data.notes)
    return {"message": f"Status updated to {order.status}"}


@router.post("/{order_id}/deliver")
async def deliver_order(
    order_id: uuid.UUID,
    data: PODRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("orders.update.status")),
):
    service = OrderService(db)
    order = await service.deliver_order(order_id, data, user.id)
    return {"message": "Order delivered", "delivered_at": str(order.delivered_at)}


@router.get("/me/claimed")
async def my_claimed_orders(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("orders.claim")),
):
    service = OrderService(db)
    return await service.get_employee_orders(user.employee.id)