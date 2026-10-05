from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.exceptions import AppError

from app.routers import (
    auth,
    employees,
    attendance,
    tasks,
    orders,
    leaves,
    ledger,
    complaints,
    payroll,
    roles,
    settings as settings_router,
    sync,
)
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-create tables on startup in Render PostgreSQL
    try:
        from app.database import engine, Base
        import app.models  # Ensure all model tables are registered
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("[Startup] Database tables initialized successfully.")
    except Exception as e:
        print(f"[Startup] DB initialization note: {e}")

    # Load persistent store from PostgreSQL
    try:
        from app.routers.sync import load_store_from_postgres
        await load_store_from_postgres()
    except Exception as e:
        print(f"[Startup] Sync store load note: {e}")

    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version="1.0.0",
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        docs_url=f"{settings.API_V1_STR}/docs",
        lifespan=lifespan,
    )

    # Permissive CORS middleware for cross-origin web/mobile clients
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?:\/\/.*$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Custom exception handler
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.detail,
                "error_code": exc.error_code,
                **({"extra": exc.extra} if exc.extra else {}),
            },
        )

    # Register all routers
    prefix = settings.API_V1_STR
    app.include_router(auth.router, prefix=prefix)
    app.include_router(employees.router, prefix=prefix)
    app.include_router(attendance.router, prefix=prefix)
    app.include_router(tasks.router, prefix=prefix)
    app.include_router(orders.router, prefix=prefix)
    app.include_router(leaves.router, prefix=prefix)
    app.include_router(ledger.router, prefix=prefix)
    app.include_router(complaints.router, prefix=prefix)
    app.include_router(payroll.router, prefix=prefix)
    app.include_router(roles.router, prefix=prefix)
    app.include_router(settings_router.router, prefix=prefix)
    app.include_router(sync.router, prefix=prefix)

    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "version": "1.0.0"}

    return app


app = create_app()