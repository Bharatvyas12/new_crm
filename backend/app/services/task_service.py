from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from app.models.task import Task, TaskAssignment, TaskSubmission, TaskStatus
from app.schemas.task import TaskCreate, TaskUpdate, TaskSubmitRequest, TaskReviewRequest
from app.exceptions import NotFoundError, BusinessRuleError, ForbiddenError
import uuid
from datetime import datetime, timezone


class TaskService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_task(self, data: TaskCreate, current_user_id: uuid.UUID) -> Task:
        task = Task(
            title=data.title,
            description=data.description,
            priority=data.priority,
            due_date=data.due_date,
            requires_evidence=data.requires_evidence,
            status=TaskStatus.DRAFT.value,
            created_by=current_user_id,
        )
        self.db.add(task)
        await self.db.flush()

        # Create assignments
        for emp_id in data.employee_ids:
            assignment = TaskAssignment(
                task_id=task.id, employee_id=emp_id
            )
            self.db.add(assignment)

        await self.db.flush()
        return task

    async def update_task(self, task_id: uuid.UUID, data: TaskUpdate) -> Task:
        task = await self._get_task(task_id)
        if task.status not in [TaskStatus.DRAFT.value, TaskStatus.PUBLISHED.value]:
            raise BusinessRuleError("Can only edit DRAFT or PUBLISHED tasks")

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(task, key, value)
        await self.db.flush()
        return task

    async def publish_task(self, task_id: uuid.UUID) -> Task:
        task = await self._get_task(task_id)
        if task.status != TaskStatus.DRAFT.value:
            raise BusinessRuleError("Only DRAFT tasks can be published")
        task.status = TaskStatus.PUBLISHED.value
        await self.db.flush()
        return task

    async def submit_task(
        self, task_id: uuid.UUID, employee_id: uuid.UUID, data: TaskSubmitRequest
    ) -> TaskSubmission:
        # Verify assignment
        result = await self.db.execute(
            select(TaskAssignment).where(
                and_(
                    TaskAssignment.task_id == task_id,
                    TaskAssignment.employee_id == employee_id,
                )
            )
        )
        if not result.scalars().first():
            raise ForbiddenError("You are not assigned to this task")

        task = await self._get_task(task_id)
        if task.status not in [TaskStatus.PUBLISHED.value, TaskStatus.IN_PROGRESS.value]:
            raise BusinessRuleError("Task is not in a submittable state")

        task.status = TaskStatus.SUBMITTED.value

        submission = TaskSubmission(
            task_id=task_id,
            employee_id=employee_id,
            notes=data.notes,
            evidence_url=data.evidence_url,
            status="PENDING",
        )
        self.db.add(submission)
        await self.db.flush()
        return submission

    async def review_submission(
        self,
        submission_id: uuid.UUID,
        reviewer_employee_id: uuid.UUID | None,
        reviewer_user_id: uuid.UUID,
        data: TaskReviewRequest,
    ) -> None:
        result = await self.db.execute(
            select(TaskSubmission).where(TaskSubmission.id == submission_id)
        )
        submission = result.scalars().first()
        if not submission:
            raise NotFoundError("Submission", str(submission_id))

        # Self-review prevention
        if reviewer_employee_id and str(submission.employee_id) == str(reviewer_employee_id):
            raise BusinessRuleError("Cannot review your own task submission")

        submission.status = data.status
        submission.reviewed_by = reviewer_user_id
        submission.review_note = data.review_note

        # Update task status
        task = await self._get_task(submission.task_id)
        if data.status == "APPROVED":
            task.status = TaskStatus.APPROVED.value
        elif data.status == "REJECTED":
            task.status = TaskStatus.REJECTED.value

        await self.db.flush()

    async def list_tasks(
        self,
        status: str | None = None,
        employee_id: uuid.UUID | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> dict:
        query = select(Task)
        count_query = select(func.count(Task.id))

        if status:
            query = query.where(Task.status == status)
            count_query = count_query.where(Task.status == status)

        if employee_id:
            query = query.join(TaskAssignment).where(
                TaskAssignment.employee_id == employee_id
            )
            count_query = count_query.join(TaskAssignment).where(
                TaskAssignment.employee_id == employee_id
            )

        total = (await self.db.execute(count_query)).scalar() or 0
        result = await self.db.execute(
            query.order_by(Task.created_at.desc()).offset(skip).limit(limit)
        )
        tasks = result.scalars().all()
        return {"tasks": tasks, "total": total}

    async def get_task_detail(self, task_id: uuid.UUID) -> dict:
        result = await self.db.execute(
            select(Task)
            .where(Task.id == task_id)
            .options(
                selectinload(Task.assignments),
                selectinload(Task.submissions),
            )
        )
        task = result.scalars().first()
        if not task:
            raise NotFoundError("Task", str(task_id))
        return {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "status": task.status,
            "priority": task.priority,
            "due_date": task.due_date,
            "requires_evidence": task.requires_evidence,
            "created_by": task.created_by,
            "created_at": task.created_at,
            "updated_at": task.updated_at,
            "assignments": [
                {"id": str(a.id), "employee_id": str(a.employee_id), "assigned_at": str(a.assigned_at)}
                for a in task.assignments
            ],
            "submissions": [
                {
                    "id": str(s.id),
                    "employee_id": str(s.employee_id),
                    "notes": s.notes,
                    "evidence_url": s.evidence_url,
                    "status": s.status,
                    "created_at": str(s.created_at),
                }
                for s in task.submissions
            ],
        }

    async def _get_task(self, task_id: uuid.UUID) -> Task:
        result = await self.db.execute(
            select(Task).where(Task.id == task_id)
        )
        task = result.scalars().first()
        if not task:
            raise NotFoundError("Task", str(task_id))
        return task