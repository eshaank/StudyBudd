"""Database configuration and session management."""

from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()

# Build connection args for SSL (required for Supabase)
connect_args = {}
if "supabase" in settings.database_url or "supabase" in settings.db_host:
    connect_args["ssl"] = "require"
# Disable prepared statement cache when using pgbouncer (e.g. Supabase)
connect_args["statement_cache_size"] = 0

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
    connect_args=connect_args,
)

async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database sessions."""
    async with async_session_maker() as session:
        # Supabase: include extensions so unqualified "vector" resolves (pgvector may be in public or extensions)
        if "supabase" in settings.database_url or "supabase" in settings.db_host:
            await session.execute(text("SET search_path TO public, extensions, vector_db"))
        yield session
