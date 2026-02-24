"""Business logic for document operations."""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.supabase import delete_file, upload_file
from app.documents.models import Document
from app.documents.schemas import DocumentCreate
from app.processing.models import Document as ProcessingDocument

logger = logging.getLogger(__name__)

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
