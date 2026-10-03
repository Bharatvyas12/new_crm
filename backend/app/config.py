from pydantic_settings import BaseSettings
from typing import List, Union
import json


class Settings(BaseSettings):
    PROJECT_NAME: str = "Workforce CRM"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    SECRET_KEY: str = "dev-secret-change-in-production"
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/wcrm_db"

    CORS_ORIGINS: str = "http://localhost:3000"

    # Session config
    SESSION_EXPIRE_HOURS: int = 24
    COOKIE_SECURE: bool = False
    COOKIE_DOMAIN: str | None = None
    COOKIE_SAMESITE: str = "lax"

    model_config = {"env_file": ".env", "case_sensitive": True}

    @property
    def cors_origin_list(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, str):
            try:
                return json.loads(self.CORS_ORIGINS)
            except (json.JSONDecodeError, TypeError):
                return [x.strip() for x in self.CORS_ORIGINS.split(",") if x.strip()]
        return self.CORS_ORIGINS


settings = Settings()