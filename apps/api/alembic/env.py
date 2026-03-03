"""Alembic environment configuration."""

from logging.config import fileConfig

from sqlalchemy import create_engine, pool
from sqlalchemy.engine import Connection

import app.documents.models  # noqa: F401 — register tables on shared Base.metadata
import app.flashcards.models  # noqa: F401
import app.processing.models  # noqa: F401
import app.quizzes.models  # noqa: F401
from alembic import context
from app.core.config import get_settings
from app.core.models import Base

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Get settings and override sqlalchemy.url (use migration URL when DB_MIGRATION_HOST is set)
settings = get_settings()
migration_url = settings.migration_database_url
# Use sync driver for migrations (avoids asyncpg DNS issues on some macOS/asyncio setups)
sync_url = migration_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://", 1)
escaped_url = sync_url.replace("%", "%%")
config.set_main_option("sqlalchemy.url", escaped_url)

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url") or ""
    url = url.replace("%%", "%")  # ConfigParser stores % as %%
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    """Run migrations using connection."""
    context.configure(connection=connection, target_metadata=target_metadata)

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode using sync engine (psycopg2)."""
    connectable = create_engine(
        sync_url,
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        do_run_migrations(connection)

    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
