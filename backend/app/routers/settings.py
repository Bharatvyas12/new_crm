from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.settings import SettingBulkUpdate
from app.services.settings_service import SettingsService
from app.dependencies import require
from app.models.user import User

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/schema")
async def get_settings_schema(
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("settings.read")),
):
    service = SettingsService(db)
    return await service.get_schema(category)


@router.get("/")
async def get_all_settings(
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("settings.read")),
):
    service = SettingsService(db)
    return await service.get_all(category)


@router.patch("/")
async def update_settings(
    data: SettingBulkUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require("settings.write")),
):
    service = SettingsService(db)
    await service.update_settings(data.settings)
    return {"message": f"Updated {len(data.settings)} setting(s)"}