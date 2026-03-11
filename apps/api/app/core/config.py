"""Application configuration using Pydantic settings."""

import re
from functools import lru_cache
from pathlib import Path
from urllib.parse import quote_plus, urlparse, urlunparse

from pydantic import AliasChoices, Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Find .env file - prefer monorepo root (parent of "apps") so Alembic and CLI use same env
def _find_env_file() -> Path | None:
    """Find .env file; prefer project root (parent of apps/) so it's used consistently."""
    current = Path(__file__).resolve().parent
    root_env: Path | None = None
    for _ in range(6):
        env_path = current / ".env"
        if env_path.exists():
            # Prefer directory that contains "apps" (monorepo root)
            if (current / "apps").is_dir():
                return env_path
            if root_env is None:
                root_env = env_path
        current = current.parent
    return root_env

_env_file = _find_env_file()


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file=str(_env_file) if _env_file else ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    app_name: str = "StudyBudd API"
    debug: bool = False
    log_level: str = Field(
        default="INFO",
        validation_alias=AliasChoices("LOG_LEVEL", "log_level"),
    )
    
    # Development - set DEV_USER_ID to bypass auth in debug mode
    dev_user_id: str | None = None

    # Database - prefer DATABASE_URL if set, otherwise build from components
    database_url_raw: str | None = Field(
        default=None, 
        validation_alias=AliasChoices("DATABASE_URL", "database_url")
    )
    db_host: str = Field(
        default="localhost", 
        validation_alias=AliasChoices("DB_HOST", "db_host")
    )
    db_port: int = Field(
        default=5432, 
        validation_alias=AliasChoices("DB_PORT", "db_port")
    )
    db_user: str = Field(
        default="postgres", 
        validation_alias=AliasChoices("DB_USER", "db_user")
    )
    db_password: str = Field(
        default="postgres", 
        validation_alias=AliasChoices("DB_PASSWORD", "db_password")
    )
    db_name: str = Field(
        default="postgres", 
        validation_alias=AliasChoices("DB_NAME", "db_name")
    )
    # Optional: use a different host for migrations (e.g. Supabase direct connection)
    db_migration_host: str | None = Field(
        default=None,
        validation_alias=AliasChoices("DB_MIGRATION_HOST", "db_migration_host"),
    )

    @computed_field
    @property
    def database_url(self) -> str:
        """Get database URL - prefer DATABASE_URL env var, else build from components."""
        if self.database_url_raw:
            url = self.database_url_raw
            # Convert postgresql:// to postgresql+asyncpg:// for async support
            if url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            elif url.startswith("postgres://"):
                url = url.replace("postgres://", "postgresql+asyncpg://", 1)
            
            # URL-encode password if it contains special characters
            # Pattern: protocol://user:password@host:port/db
            match = re.match(r"^(postgresql\+asyncpg://)([^:]+):([^@]+)@(.+)$", url)
            if match:
                protocol, user, password, rest = match.groups()
                # URL-encode the password to handle special characters
                encoded_password = quote_plus(password)
                url = f"{protocol}{user}:{encoded_password}@{rest}"
            
            return url
        # Fall back to building from components
        encoded_password = quote_plus(self.db_password)
        return f"postgresql+asyncpg://{self.db_user}:{encoded_password}@{self.db_host}:{self.db_port}/{self.db_name}"


    # Supabase
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_jwt_secret: str = ""
    supabase_storage_bucket: str = "documents"

    # Together AI
    together_api_key: str = Field(
        default="",
        validation_alias=AliasChoices("TOGETHER_API_KEY", "together_api_key")
    )
    together_model: str = Field(
        default="meta-llama/Llama-3.3-70B-Instruct-Turbo",
        validation_alias=AliasChoices("TOGETHER_MODEL", "together_model")
    )
    together_max_tokens: int = Field(
        default=1024,
        validation_alias=AliasChoices("TOGETHER_MAX_TOKENS", "together_max_tokens")
    )
    together_temperature: float = Field(
        default=0.7,
        validation_alias=AliasChoices("TOGETHER_TEMPERATURE", "together_temperature")
    )
    together_embed_model: str = Field(
        default="intfloat/multilingual-e5-large-instruct",
        validation_alias=AliasChoices("TOGETHER_EMBED_MODEL", "together_embed_model")
    )

    # Frontend base URL (used to build shareable links)
    web_base_url: str = Field(
        default="http://localhost:3000",
        validation_alias=AliasChoices("WEB_BASE_URL", "web_base_url"),
    )

    # Upload limits
    max_upload_size_mb: int = 10


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()