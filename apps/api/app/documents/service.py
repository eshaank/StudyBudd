"""Business logic for document operations."""

from __future__ import annotations

import logging
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.supabase import delete_file, upload_file
from app.documents.models import Document, DocumentShare, DocumentShareRecipient
from app.processing.models import ProcessingDocument

logger = logging.getLogger(__name__)
settings = get_settings()

# =============================================================================
# Constants
# =============================================================================

ALLOWED_MIME_TYPES: dict[str, str] = {
    "application/pdf": "pdf",
    "image/png": "image",
    "image/jpeg": "image",
    "text/plain": "text",
    "text/csv": "csv",
    "application/csv": "csv",
}


# =============================================================================
# Document Service
# =============================================================================


class DocumentService:
    """Service class for document operations."""

    MAX_SHARE_RECIPIENTS = 50

    @staticmethod
    def validate_file_type(file: UploadFile) -> str:
        """Validate that the file type is allowed.

        Args:
            file: The uploaded file to validate.

        Returns:
            The file type category ("pdf", "image", "text", or "csv").

        Raises:
            HTTPException: If file type is not allowed.
        """
        if not file.content_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File content type is required",
            )

        if file.content_type not in ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {file.content_type} not allowed. Allowed: PDF, PNG, JPEG, TXT, CSV",
            )

        return ALLOWED_MIME_TYPES[file.content_type]

    @staticmethod
    async def upload(
        db: AsyncSession,
        file: UploadFile,
        user_id: UUID,
    ) -> Document:
        """Upload a document and create database record.

        Args:
            db: Database session.
            file: The uploaded file.
            user_id: ID of the user uploading.

        Returns:
            The created Document entity.
        """
        # Validate file type
        file_type = DocumentService.validate_file_type(file)

        # Read file content
        content = await file.read()
        file_size = len(content)

        # Upload to Supabase Storage
        storage_path = await upload_file(
            content=content,
            user_id=user_id,
            filename=file.filename or "unknown",
            content_type=file.content_type or "application/octet-stream",
        )

        # Extract generated filename from storage path
        filename = storage_path.split("/")[-1]

        # Create document record
        document = Document(
            user_id=user_id,
            filename=filename,
            original_filename=file.filename or "unknown",
            file_type=file_type,
            mime_type=file.content_type or "application/octet-stream",
            file_size=file_size,
            storage_path=storage_path,
        )
        db.add(document)
        await db.commit()
        await db.refresh(document)

        logger.info("document uploaded user_id=%s document_id=%s filename=%s size=%d", user_id, document.id, file.filename, file_size)
        return document

    @staticmethod
    async def list_by_user(
        db: AsyncSession,
        user_id: UUID,
        folder_id: UUID | None = None,
    ) -> list[Document]:
        """Get documents for a user, optionally filtered by folder.

        Args:
            db: Database session.
            user_id: The user's ID.
            folder_id: If provided, return only docs in this folder.

        Returns:
            List of documents ordered by creation date (newest first).
        """
        stmt = select(Document).where(Document.user_id == user_id)
        if folder_id is not None:
            stmt = stmt.where(Document.folder_id == folder_id)
        result = await db.execute(stmt.order_by(Document.created_at.desc()))
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id(
        db: AsyncSession,
        document_id: UUID,
        user_id: UUID,
    ) -> Document | None:
        """Get a document by ID for a specific user.

        Args:
            db: Database session.
            document_id: The document's ID.
            user_id: The user's ID (for ownership check).

        Returns:
            The document if found and owned by user, None otherwise.
        """
        result = await db.execute(
            select(Document).where(
                Document.id == document_id,
                Document.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def delete(db: AsyncSession, document: Document) -> None:
        """Delete a document from storage and database.

        Also removes processing_documents and document_chunks for RAG.
        """
        doc_id, user_id = document.id, document.user_id

        # Delete RAG processing data (chunks cascade from processing_documents)
        await db.execute(delete(ProcessingDocument).where(ProcessingDocument.id == doc_id))

        # Delete from Supabase Storage
        if not delete_file(document.storage_path):
            logger.warning(
                "storage deletion failed — orphaned file document_id=%s path=%s",
                doc_id,
                document.storage_path,
            )

        # Delete from database
        await db.delete(document)
        await db.commit()
        logger.info("document deleted document_id=%s user_id=%s", doc_id, user_id)

    @staticmethod
    def normalize_recipient_emails(recipient_emails: list[str]) -> list[str]:
        """Normalize, validate and deduplicate recipient emails."""
        normalized: list[str] = []
        seen: set[str] = set()

        for raw in recipient_emails:
            email = raw.strip().lower()
            if not email:
                continue
            if "@" not in email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid recipient email: {raw!r}",
                )
            if email in seen:
                continue
            seen.add(email)
            normalized.append(email)

        if len(normalized) > DocumentService.MAX_SHARE_RECIPIENTS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Too many recipients. Maximum is "
                    f"{DocumentService.MAX_SHARE_RECIPIENTS}."
                ),
            )
        return normalized

    @staticmethod
    def build_share_url(share_token: str) -> str:
        """Build frontend share URL from token."""
        base = settings.web_base_url.rstrip("/")
        return f"{base}/shared/{share_token}"

    @staticmethod
    async def create_share_link(
        db: AsyncSession,
        document: Document,
        recipient_emails: list[str],
        expires_in_hours: int | None,
    ) -> tuple[DocumentShare, list[str]]:
        """Create a share link for a document."""
        normalized_recipients = DocumentService.normalize_recipient_emails(
            recipient_emails
        )
        expires_at = (
            datetime.now(UTC) + timedelta(hours=expires_in_hours)
            if expires_in_hours
            else None
        )

        # Retry token generation on collision (extremely rare).
        for _ in range(3):
            share_token = secrets.token_urlsafe(24)
            existing = await db.scalar(
                select(DocumentShare.id).where(DocumentShare.share_token == share_token)
            )
            if existing is None:
                break
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate unique share token",
            )

        share = DocumentShare(
            document_id=document.id,
            owner_user_id=document.user_id,
            share_token=share_token,
            expires_at=expires_at,
            is_revoked=False,
        )
        db.add(share)
        await db.flush()

        for recipient_email in normalized_recipients:
            db.add(
                DocumentShareRecipient(
                    share_id=share.id,
                    recipient_email=recipient_email,
                )
            )

        await db.commit()
        await db.refresh(share)
        logger.info(
            "document share created document_id=%s share_id=%s recipients=%d",
            document.id,
            share.id,
            len(normalized_recipients),
        )
        return share, normalized_recipients

    @staticmethod
    async def get_share_by_token(
        db: AsyncSession,
        share_token: str,
    ) -> tuple[DocumentShare, Document, list[str]] | None:
        """Get share, linked document, and recipients by token."""
        share = await db.scalar(
            select(DocumentShare).where(DocumentShare.share_token == share_token)
        )
        if share is None:
            return None

        document = await db.scalar(
            select(Document).where(Document.id == share.document_id)
        )
        if document is None:
            return None

        recipient_rows = (
            await db.execute(
                select(DocumentShareRecipient.recipient_email).where(
                    DocumentShareRecipient.share_id == share.id
                )
            )
        ).scalars()
        recipient_emails = list(recipient_rows)

        return share, document, recipient_emails

    @staticmethod
    def verify_share_access(
        share: DocumentShare,
        recipient_emails: list[str],
        current_user_id: UUID,
        current_user_email: str | None,
    ) -> str:
        """Validate access to a shared document and return access level."""
        if share.is_revoked:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Share link not found",
            )

        expires_at = share.expires_at
        if expires_at and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=UTC)
        if expires_at and expires_at < datetime.now(UTC):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Share link has expired",
            )

        if share.owner_user_id == current_user_id:
            return "owner"

        if recipient_emails:
            if not current_user_email:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Share access requires a user email",
                )
            email = current_user_email.strip().lower()
            if email not in set(recipient_emails):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have access to this shared document",
                )
            return "recipient"

        return "link"
