"""Add flashcard_sets, flashcards, quiz_sets, quiz_questions tables

Revision ID: 20260302_000002
Revises: 20260302_000001
Create Date: 2026-03-02
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260302_000002"
down_revision: Union[str, None] = "20260302_000001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "flashcard_sets",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column(
            "folder_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("folders.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("document_ids", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "flashcards",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "set_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("flashcard_sets.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("front", sa.Text, nullable=False),
        sa.Column("back", sa.Text, nullable=False),
        sa.Column("position", sa.Integer, nullable=False, server_default="0"),
    )

    op.create_table(
        "quiz_sets",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.UUID(as_uuid=True), nullable=False, index=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column(
            "folder_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("folders.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("document_ids", sa.JSON, nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "quiz_questions",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "set_id",
            sa.UUID(as_uuid=True),
            sa.ForeignKey("quiz_sets.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("question", sa.Text, nullable=False),
        sa.Column("options", sa.JSON, nullable=False),
        sa.Column("correct_option", sa.String(10), nullable=False),
        sa.Column("explanation", sa.Text, nullable=True),
        sa.Column("position", sa.Integer, nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_table("quiz_questions")
    op.drop_table("quiz_sets")
    op.drop_table("flashcards")
    op.drop_table("flashcard_sets")
