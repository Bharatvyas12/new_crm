from sqlalchemy import String, ForeignKey, Text, DateTime, Float, Numeric, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid
import uuid
import enum
from datetime import datetime, timezone
from app.database import Base, TimestampMixin


class OrderStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    BROADCASTED = "BROADCASTED"
    CLAIMED = "CLAIMED"
    PACKING = "PACKING"
    PACKED = "PACKED"
    READY_FOR_DELIVERY = "READY_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class Order(TimestampMixin, Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    order_number: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    customer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    customer_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), default=OrderStatus.DRAFT.value, index=True
    )
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00)
    items_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Broadcast info
    broadcasted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    broadcasted_by: Mapped[uuid.UUID | None] = mapped_column(
        Uuid(as_uuid=True), nullable=True
    )

    # Claim info
    claimed_by_employee_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), nullable=True
    )
    claimed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Delivery
    delivered_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    pod_photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    pod_signature_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )

    # Relationships
    claims: Mapped[list["OrderClaim"]] = relationship(
        "OrderClaim", back_populates="order", cascade="all, delete-orphan"
    )
    lifecycle_events: Mapped[list["OrderLifecycleEvent"]] = relationship(
        "OrderLifecycleEvent", back_populates="order", cascade="all, delete-orphan"
    )
    claimed_by: Mapped["Employee | None"] = relationship("Employee")


class OrderClaim(Base):
    __tablename__ = "order_claims"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), index=True
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), index=True
    )
    claimed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    released_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    order: Mapped["Order"] = relationship("Order", back_populates="claims")
    employee = relationship("Employee")


class OrderLifecycleEvent(Base):
    __tablename__ = "order_lifecycle_events"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    order_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), index=True
    )
    from_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    to_status: Mapped[str] = mapped_column(String(30), nullable=False)
    changed_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    order: Mapped["Order"] = relationship("Order", back_populates="lifecycle_events")


from app.models.employee import Employee  # noqa: E402, F401