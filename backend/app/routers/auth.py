from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.auth import LoginRequest, UserResponse
from app.services.auth_service import AuthService
from app.dependencies import get_current_user
from app.models.user import User
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login(
    req: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    user = await service.authenticate_user(req.email, req.password)
    session = await service.create_session(
        user_id=user.id,
        ip_address=request.client.host if request.client else "unknown",
        user_agent=request.headers.get("user-agent", ""),
    )

    # Set session cookie
    response.set_cookie(
        key="wcrm_session",
        value=session.token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.SESSION_EXPIRE_HOURS * 3600,
        path="/",
    )
    # Set CSRF cookie (readable by JS)
    response.set_cookie(
        key="wcrm_csrf",
        value=session.csrf_token,
        httponly=False,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        max_age=settings.SESSION_EXPIRE_HOURS * 3600,
        path="/",
    )

    permissions = await service.get_user_permissions(user)

    return {
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "is_active": user.is_active,
            "is_superuser": user.is_superuser,
            "permissions": permissions,
            "employee_id": str(user.employee.id) if user.employee else None,
            "created_at": str(user.created_at),
        },
        "csrf_token": session.csrf_token,
    }


@router.get("/me")
async def get_me(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AuthService(db)
    permissions = await service.get_user_permissions(user)

    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active,
        "is_superuser": user.is_superuser,
        "permissions": permissions,
        "employee_id": str(user.employee.id) if user.employee else None,
        "created_at": str(user.created_at),
    }


@router.post("/logout")
async def logout(
    response: Response,
    user: User = Depends(get_current_user),
):
    response.delete_cookie("wcrm_session", path="/")
    response.delete_cookie("wcrm_csrf", path="/")
    return {"message": "Logged out"}