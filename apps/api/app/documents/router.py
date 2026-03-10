"""API router for document endpoints."""

from __future__ import annotations

import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status
from fastapi.responses import Response

from app.core.dependencies import CurrentUser, DbSession
from app.core.supabase import download_file
from app.documents.schemas import (
    DocumentListResponse,
    DocumentResponse,
    DocumentUploadResponse,
    SharedDocumentResponse,
    ShareLinkCreateRequest,
    ShareLinkResponse,
)
from app.documents.service import DocumentService
from app.documents.text_extraction import extract_text_from_document
from app.folders.schemas import AssignFolderRequest
from app.folders.service import FolderService
from app.processing.service import ProcessingService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["documents"])


def _build_share_link_response(
    share_id: UUID,
    document_id: UUID,
    share_token: str,
    recipient_emails: list[str],
    expires_at,
    created_at,
) -> ShareLinkResponse:
    """Convert DB share data to API response."""
    return ShareLinkResponse(
        id=share_id,
        document_id=document_id,
        share_token=share_token,
        share_url=DocumentService.build_share_url(share_token),
        recipient_emails=recipient_emails,
        expires_at=expires_at,
        created_at=created_at,
    )


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: Annotated[
        UploadFile,
        File(description="Document file (PDF, PNG, JPEG, TXT, or CSV)"),
    ],
    current_user: CurrentUser,
    db: DbSession,
) -> DocumentUploadResponse:
    """Upload a document.

    Uploads the file to Supabase Storage and stores metadata in the database.
    For text and CSV files, RAG indexing runs immediately.

    - **Supported file types**: PDF, PNG, JPEG, TXT, CSV
    - **Maximum file size**: 10MB (configurable)
    """
    logger.info("document upload started user_id=%s filename=%s", current_user.user_id, file.filename)
    document = await DocumentService.upload(
        db=db,
        file=file,
        user_id=current_user.user_id,
    )

    processing_status: str | None = None
    chunks_count: int | None = None
    processing_error: str | None = None

    if document.file_type in ("text", "csv", "pdf"):
        try:
            text = extract_text_from_document(document)
            result = await ProcessingService.process_document(
                db=db,
                document_id=document.id,
                title=document.original_filename or "untitled",
                text=text,
            )
            processing_status = result.status
            chunks_count = result.chunks_count
            processing_error = result.error
        except ValueError as e:
            processing_status = "error"
            processing_error = str(e)
        except HTTPException as e:
            processing_status = "error"
            processing_error = e.detail or "Embedding failed."
    else:
        processing_status = "unsupported"

    return DocumentUploadResponse(
        message="Document uploaded successfully",
        document=DocumentResponse.model_validate(document),
        processing_status=processing_status,
        chunks_count=chunks_count,
        processing_error=processing_error,
    )


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    current_user: CurrentUser,
    db: DbSession,
    folder_id: UUID | None = Query(default=None, description="Filter by folder. Omit for all documents."),
) -> DocumentListResponse:
    """List documents for the authenticated user, optionally filtered by folder."""
    logger.debug("list_documents user_id=%s folder_id=%s", current_user.user_id, folder_id)
    documents = await DocumentService.list_by_user(db, current_user.user_id, folder_id=folder_id)

    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(doc) for doc in documents],
        total=len(documents),
    )


@router.post("/{document_id}/share-links", response_model=ShareLinkResponse)
async def create_share_link(
    document_id: UUID,
    body: ShareLinkCreateRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> ShareLinkResponse:
    """Create a shareable link for a document owned by the current user."""
    document = await DocumentService.get_by_id(db, document_id, current_user.user_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    share, recipients = await DocumentService.create_share_link(
        db=db,
        document=document,
        recipient_emails=body.recipient_emails,
        expires_in_hours=body.expires_in_hours,
    )
    logger.info(
        "share link created user_id=%s document_id=%s share_id=%s",
        current_user.user_id,
        document_id,
        share.id,
    )
    return _build_share_link_response(
        share_id=share.id,
        document_id=share.document_id,
        share_token=share.share_token,
        recipient_emails=recipients,
        expires_at=share.expires_at,
        created_at=share.created_at,
    )


@router.get("/shared/{share_token}", response_model=SharedDocumentResponse)
async def get_shared_document(
    share_token: str,
    current_user: CurrentUser,
    db: DbSession,
) -> SharedDocumentResponse:
    """Resolve a share token and return shared document metadata."""
    shared = await DocumentService.get_share_by_token(db, share_token)
    if shared is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share link not found",
        )

    share, document, recipients = shared
    access_level = DocumentService.verify_share_access(
        share=share,
        recipient_emails=recipients,
        current_user_id=current_user.user_id,
        current_user_email=current_user.email,
    )

    return SharedDocumentResponse(
        share_id=share.id,
        access_level=access_level,
        recipient_restricted=bool(recipients),
        expires_at=share.expires_at,
        document=DocumentResponse.model_validate(document),
    )


@router.get("/shared/{share_token}/download")
async def download_shared_document(
    share_token: str,
    current_user: CurrentUser,
    db: DbSession,
) -> Response:
    """Download a shared document if access checks pass."""
    shared = await DocumentService.get_share_by_token(db, share_token)
    if shared is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share link not found",
        )

    share, document, recipients = shared
    DocumentService.verify_share_access(
        share=share,
        recipient_emails=recipients,
        current_user_id=current_user.user_id,
        current_user_email=current_user.email,
    )

    content = download_file(document.storage_path)
    filename = document.original_filename or document.filename
    return Response(
        content=content,
        media_type=document.mime_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/shared/{share_token}/import", response_model=DocumentUploadResponse)
async def import_shared_document(
    share_token: str,
    current_user: CurrentUser,
    db: DbSession,
) -> DocumentUploadResponse:
    """Import a shared document into the current user's file library.

    Downloads the source file and creates a new copy owned by the current user,
    then indexes it for RAG if the file type supports it.
    """
    shared = await DocumentService.get_share_by_token(db, share_token)
    if shared is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share link not found",
        )

    share, document, recipients = shared
    DocumentService.verify_share_access(
        share=share,
        recipient_emails=recipients,
        current_user_id=current_user.user_id,
        current_user_email=current_user.email,
    )

    if document.user_id == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already own this document.",
        )

    new_doc = await DocumentService.import_shared_document(
        db=db,
        document=document,
        recipient_user_id=current_user.user_id,
    )

    processing_status: str | None = None
    chunks_count: int | None = None
    processing_error: str | None = None

    if new_doc.file_type in ("text", "csv", "pdf"):
        try:
            text = extract_text_from_document(new_doc)
            result = await ProcessingService.process_document(
                db=db,
                document_id=new_doc.id,
                title=new_doc.original_filename or "untitled",
                text=text,
            )
            processing_status = result.status
            chunks_count = result.chunks_count
            processing_error = result.error
        except ValueError as e:
            processing_status = "error"
            processing_error = str(e)
        except HTTPException as e:
            processing_status = "error"
            processing_error = e.detail or "Embedding failed."
    else:
        processing_status = "unsupported"

    logger.info(
        "shared document imported user_id=%s share_token=%s new_document_id=%s",
        current_user.user_id,
        share_token,
        new_doc.id,
    )
    return DocumentUploadResponse(
        message="Document saved to your library.",
        document=DocumentResponse.model_validate(new_doc),
        processing_status=processing_status,
        chunks_count=chunks_count,
        processing_error=processing_error,
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


@router.patch("/{document_id}/folder", response_model=DocumentResponse)
async def assign_document_folder(
    document_id: UUID,
    body: AssignFolderRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> DocumentResponse:
    """Assign or remove a document from a folder.

    Pass ``folder_id: null`` to unfile the document.
    """
    document = await DocumentService.get_by_id(db, document_id, current_user.user_id)
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    document = await FolderService.assign_document(db, document, body.folder_id, current_user.user_id)
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
