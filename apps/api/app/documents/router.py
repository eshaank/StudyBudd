"""API router for document endpoints."""

import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from app.core.dependencies import CurrentUser, DbSession
from app.documents.schemas import (
    DocumentListResponse,
    DocumentResponse,
    DocumentUploadResponse,
)
from app.documents.service import DocumentService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: Annotated[UploadFile, File(description="Document file (PDF, PNG, or JPEG)")],
    current_user: CurrentUser,
    db: DbSession,
) -> DocumentUploadResponse:
    """Upload a document.

    Uploads the file to Supabase Storage and stores metadata in the database.

    - **Supported file types**: PDF, PNG, JPEG
    - **Maximum file size**: 10MB (configurable)
    """
    logger.info("document upload started user_id=%s filename=%s", current_user.user_id, file.filename)
    document = await DocumentService.upload(
        db=db,
        file=file,
        user_id=current_user.user_id,
    )

    return DocumentUploadResponse(
        message="Document uploaded successfully",
        document=DocumentResponse.model_validate(document),
    )


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    current_user: CurrentUser,
    db: DbSession,
) -> DocumentListResponse:
    """List all documents for the authenticated user.

    Returns documents ordered by creation date (newest first).
    """
    logger.debug("list_documents user_id=%s", current_user.user_id)
    documents = await DocumentService.list_by_user(db, current_user.user_id)

    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(doc) for doc in documents],
        total=len(documents),
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
) -> DocumentResponse:
    """Get a specific document by ID.

    Only returns documents owned by the authenticated user.
    """
    logger.debug("get_document user_id=%s document_id=%s", current_user.user_id, document_id)
    document = await DocumentService.get_by_id(db, document_id, current_user.user_id)

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    return DocumentResponse.model_validate(document)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
) -> None:
    """Delete a document.

    Removes the file from Supabase Storage and deletes the metadata.
    Only the owner can delete their documents.
    """
    document = await DocumentService.get_by_id(db, document_id, current_user.user_id)

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    logger.info("document delete user_id=%s document_id=%s", current_user.user_id, document_id)
    await DocumentService.delete(db, document)
