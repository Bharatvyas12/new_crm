from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog
import uuid
from typing import Any


class AuditService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def log(
        self,
        actor_user_id: uuid.UUID | None,
        category: str,
        action: str,
        entity_type: str,
        entity_id: str | None = None,
        before: dict[str, Any] | None = None,
        after: dict[str, Any] | None = None,
        ip_address: str | None = None,
        request_id: str | None = None,
        details: str | None = None,
    ) -> AuditLog:
        entry = AuditLog(
            actor_user_id=actor_user_id,
            category=category,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            before=before,
            after=after,
            ip_address=ip_address,
            request_id=request_id,
            details=details,
        )
        self.db.add(entry)
        await self.db.flush()
        return entry