from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    APP_NAME: str = "MySQL API Connector"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # Database metadata app
    DATABASE_URL: str = "mysql+aiomysql://root:password@mysql_meta:3306/mac_meta"
    DATABASE_SYNC_URL: str = "mysql+pymysql://root:password@mysql_meta:3306/mac_meta"

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
