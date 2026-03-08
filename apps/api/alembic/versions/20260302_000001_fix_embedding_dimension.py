"""Fix embedding column dimension from vector(768) to vector(1024)

The original migration created document_chunks.embedding as vector(768),
but the embedding model (intfloat/multilingual-e5-large-instruct) outputs
1024-dimensional vectors. Aligns the DB column with the model and service.

Revision ID: 20260302_000001
Revises: 20260221_000001
Create Date: 2026-03-02
"""

from typing import Sequence, Union

from alembic import op

revision: str = "20260302_000001"
down_revision: Union[str, None] = "20260221_000001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_document_chunks_embedding")
    op.execute(
        "ALTER TABLE document_chunks "
        "ALTER COLUMN embedding TYPE vector(1024)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding "
        "ON document_chunks USING hnsw (embedding vector_cosine_ops)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_document_chunks_embedding")
    op.execute(
        "ALTER TABLE document_chunks "
        "ALTER COLUMN embedding TYPE vector(768)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding "
        "ON document_chunks USING hnsw (embedding vector_cosine_ops)"
    )
