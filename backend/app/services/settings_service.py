from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.settings import BusinessSetting
from app.schemas.settings import SettingUpdate
from app.exceptions import NotFoundError
import uuid


class SettingsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, category: str | None = None) -> list[BusinessSetting]:
        query = select(BusinessSetting)
        if category:
            query = query.where(BusinessSetting.category == category)
        result = await self.db.execute(query.order_by(BusinessSetting.category, BusinessSetting.key))
        return result.scalars().all()

    async def get_value(self, key: str, default: str | None = None) -> str | None:
        result = await self.db.execute(
            select(BusinessSetting).where(BusinessSetting.key == key)
        )
        setting = result.scalars().first()
        return setting.value if setting else default

    async def get_schema(self, category: str | None = None) -> list[dict]:
        settings = await self.get_all(category)
        return [
            {
                "key": s.key,
                "label": s.label,
                "category": s.category,
                "data_type": s.data_type,
                "description": s.description,
                "current_value": s.value,
                "default_value": s.default_value,
            }
            for s in settings
        ]

    async def update_settings(self, updates: list[SettingUpdate]) -> None:
        for update in updates:
            result = await self.db.execute(
                select(BusinessSetting).where(BusinessSetting.key == update.key)
            )
            setting = result.scalars().first()
            if not setting:
                raise NotFoundError("Setting", update.key)
            setting.value = update.value
        await self.db.flush()