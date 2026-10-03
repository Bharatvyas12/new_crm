from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from app.models.complaint import Complaint, ComplaintCategory, ComplaintComment, ComplaintStatus
from app.schemas.complaint import ComplaintCreate, ComplaintStatusUpdate, CommentCreate
from app.exceptions import NotFoundError, BusinessRuleError
from datetime import datetime, timezone
import uuid


class ComplaintService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_categories(self) -> list[ComplaintCategory]:
        result = await self.db.execute(
            select(ComplaintCategory).where(ComplaintCategory.is_active == True)
        )
        return result.scalars().all()

    async def create_complaint(
        self, employee_id: uuid.UUID, data: ComplaintCreate
    ) -> Complaint:
        complaint = Complaint(
            category_id=data.category_id,
            raised_by=employee_id,
            subject=data.subject,
            description=data.description,
            visibility=data.visibility,
            status=ComplaintStatus.OPEN.value,
        )
        self.db.add(complaint)
        await self.db.flush()
        return complaint

    async def get_complaint(self, complaint_id: uuid.UUID) -> Complaint:
        result = await self.db.execute(
            select(Complaint)
            .where(Complaint.id == complaint_id)
            .options(selectinload(Complaint.comments))
        )
        complaint = result.scalars().first()
        if not complaint:
            raise NotFoundError("Complaint", str(complaint_id))
        return complaint

    async def list_complaints(
        self,
        employee_id: uuid.UUID | None = None,
        is_admin: bool = False,
        status: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> dict:
        query = select(Complaint)
        count_query = select(func.count(Complaint.id))

        filters = []
        if not is_admin and employee_id:
            # Non-admin can see their own + PUBLIC complaints
            filters.append(
                (Complaint.raised_by == employee_id) | (Complaint.visibility == "PUBLIC")
            )
        if status:
            filters.append(Complaint.status == status)

        if filters:
            query = query.where(and_(*filters))
            count_query = count_query.where(and_(*filters))

        total = (await self.db.execute(count_query)).scalar() or 0
        result = await self.db.execute(
            query.order_by(Complaint.created_at.desc()).offset(skip).limit(limit)
        )
        complaints = result.scalars().all()
        return {"complaints": complaints, "total": total}

    async def update_status(
        self, complaint_id: uuid.UUID, data: ComplaintStatusUpdate, user_id: uuid.UUID
    ) -> None:
        complaint = await self.get_complaint(complaint_id)

        complaint.status = data.status
        if data.status in [ComplaintStatus.RESOLVED.value, ComplaintStatus.CLOSED.value]:
            complaint.resolved_at = datetime.now(timezone.utc)
            complaint.resolution_note = data.resolution_note

        await self.db.flush()

    async def add_comment(
        self, complaint_id: uuid.UUID, user_id: uuid.UUID, data: CommentCreate
    ) -> ComplaintComment:
        # Verify complaint exists
        await self.get_complaint(complaint_id)

        comment = ComplaintComment(
            complaint_id=complaint_id,
            author_id=user_id,
            content=data.content,
            is_internal=data.is_internal,
        )
        self.db.add(comment)
        await self.db.flush()
        return comment