from sqlalchemy import String, Boolean, ForeignKey, Numeric, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Uuid
import uuid
import enum
from app.database import Base, TimestampMixin


class EmploymentType(str, enum.Enum):
    FULL_TIME = "FULL_TIME"
    PART_TIME = "PART_TIME"
    CONTRACT = "CONTRACT"


class Employee(TimestampMixin, Base):
    __tablename__ = "employees"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    employee_code: Mapped[str] = mapped_column(
        String(20), unique=True, index=True, nullable=False
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    designation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    employment_type: Mapped[str] = mapped_column(
        String(20), default=EmploymentType.FULL_TIME.value
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Compensation
    base_salary: Mapped[float] = mapped_column(
        Numeric(12, 2), default=0.00, nullable=False
    )
    hourly_rate: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    # Bank details (sensitive)
    bank_account_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bank_ifsc: Mapped[str | None] = mapped_column(String(20), nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="employee")


from app.models.user import User  # noqa: E402, F401