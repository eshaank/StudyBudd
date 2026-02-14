"""Use pgvector in public schema so vector operators (<->, <=>) work

When only vector_db.vector exists (Supabase Vector product), the standard
distance operators are not available. This migration:

1. Creates the vector extension in the public schema (public.vector with operators).
2. Migrates document_chunks.embedding from vector_db.vector to public.vector.

Run with direct DB connection (port 5432). See docs/rag-setup.md.

Revision ID: 20260212_000001
Revises: 20260211_000001
Create Date: 2026-02-12

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260212_000001"
down_revision: Union[str, None] = "20260211_000001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ensure pgvector is in public schema so we get public.vector with <-> / <=> operators.
    with op.get_context().autocommit_block():
        op.execute("CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public")

    # If embedding is already public.vector, skip migration (e.g. first migration ran correctly).
    conn = op.get_bind()
    check = conn.execute(
        sa.text("""
            SELECT n.nspname, t.typname
            FROM pg_attribute a
            JOIN pg_type t ON a.atttypid = t.oid
            JOIN pg_namespace n ON t.typnamespace = n.oid
            JOIN pg_class c ON a.attrelid = c.oid
            JOIN pg_namespace nc ON c.relnamespace = nc.oid
            WHERE nc.nspname = 'public' AND c.relname = 'document_chunks'
              AND a.attname = 'embedding' AND NOT a.attisdropped
        """)
    ).fetchone()

    if check and check[0] == "public" and check[1] == "vector":
        # Column is already public.vector; ensure index exists.
        op.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
            ON document_chunks USING hnsw (embedding vector_cosine_ops)
            """
        )
        return

    # Migrate embedding from vector_db.vector to public.vector via text cast.
    op.execute("DROP INDEX IF EXISTS idx_document_chunks_embedding")
    op.execute(
        "ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS embedding_new public.vector(768)"
    )
    op.execute(
        sa.text(
            "UPDATE document_chunks SET embedding_new = (embedding::text)::public.vector(768)"
        )
    )
    op.execute("ALTER TABLE document_chunks DROP COLUMN embedding")
    op.execute("ALTER TABLE document_chunks RENAME COLUMN embedding_new TO embedding")
    op.execute("ALTER TABLE document_chunks ALTER COLUMN embedding SET NOT NULL")
    op.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
        ON document_chunks USING hnsw (embedding vector_cosine_ops)
        """
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_document_chunks_embedding")
    # Column is left as public.vector; reverting to vector_db.vector would require
    # re-backfilling. See docs/rag-setup.md.