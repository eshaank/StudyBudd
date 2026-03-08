"""Add source_chunks to flashcard_sets for source attribution

Revision ID: 20260302_000003
Revises: 20260302_000002
Create Date: 2026-03-02

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "20260302_000003"
down_revision: Union[str, None] = "20260302_000002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "flashcard_sets",
        sa.Column("source_chunks", JSONB(), nullable=False, server_default="[]"),
    )


def downgrade() -> None:
    op.drop_column("flashcard_sets", "source_chunks")
