from fastapi import HTTPException, status
from typing import Any


class AppError(HTTPException):
    """Base application error."""

    def __init__(
        self,
        status_code: int = 500,
        detail: str = "Internal server error",
        error_code: str = "INTERNAL_ERROR",
        extra: dict[str, Any] | None = None,
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code
        self.extra = extra or {}


class NotFoundError(AppError):
    def __init__(self, entity: str = "Resource", entity_id: str | None = None):
        detail = f"{entity} not found" + (f": {entity_id}" if entity_id else "")
        super().__init__(status_code=404, detail=detail, error_code="NOT_FOUND")


class ConflictError(AppError):
    def __init__(self, detail: str = "Resource conflict"):
        super().__init__(status_code=409, detail=detail, error_code="CONFLICT")


class ForbiddenError(AppError):
    def __init__(self, detail: str = "Access denied"):
        super().__init__(status_code=403, detail=detail, error_code="FORBIDDEN")


class UnauthorizedError(AppError):
    def __init__(self, detail: str = "Not authenticated"):
        super().__init__(status_code=401, detail=detail, error_code="UNAUTHORIZED")


class ValidationError(AppError):
    def __init__(self, detail: str = "Validation error", field: str | None = None):
        super().__init__(
            status_code=422,
            detail=detail,
            error_code="VALIDATION_ERROR",
            extra={"field": field} if field else {},
        )


class BusinessRuleError(AppError):
    def __init__(self, detail: str, rule_code: str = "RULE_VIOLATION"):
        super().__init__(
            status_code=422, detail=detail, error_code=rule_code
        )