"""Add document share tables.

Revision ID: 20260224_000001
Revises: 20260221_000001
Create Date: 2026-02-24

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20260224_000001"
down_revision: Union[str, None] = "20260221_000001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Share links (STUD-14 / STUD-16)
    op.execute(
        sa.text(
            """
            CREATE TABLE IF NOT EXISTS document_shares (
                id UUID PRIMARY KEY,
                document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
                owner_user_id UUID NOT NULL,
                share_token VARCHAR(128) NOT NULL UNIQUE,
                expires_at TIMESTAMPTZ NULL,
                is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
            )
            """
        )
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_document_shares_document_id ON document_shares (document_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_document_shares_owner_user_id ON document_shares (owner_user_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_document_shares_share_token ON document_shares (share_token)"
    )

    op.execute(
        sa.text(
            """
            CREATE TABLE IF NOT EXISTS document_share_recipients (
                id UUID PRIMARY KEY,
                share_id UUID NOT NULL REFERENCES document_shares(id) ON DELETE CASCADE,
                recipient_email VARCHAR(320) NOT NULL,
                CONSTRAINT uq_document_share_recipients_share_email
                    UNIQUE (share_id, recipient_email)
            )
            """
        )
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_document_share_recipients_share_id ON document_share_recipients (share_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_document_share_recipients_recipient_email ON document_share_recipients (recipient_email)"
    )

def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS document_share_recipients")
    op.execute("DROP TABLE IF EXISTS document_shares")
