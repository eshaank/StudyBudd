"""API router for folder endpoints."""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from app.core.dependencies import CurrentUser, DbSession
from app.documents.schemas import DocumentListResponse, DocumentResponse
from app.documents.service import DocumentService
from app.folders.schemas import (
    FolderCreate,
    FolderListResponse,
    FolderResponse,
    FolderUpdate,
)
from app.folders.service import FolderService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/folders", tags=["folders"])


@router.post("", response_model=FolderResponse, status_code=status.HTTP_201_CREATED)
async def create_folder(
    body: FolderCreate,
    current_user: CurrentUser,
    db: DbSession,
) -> FolderResponse:
    """Create a new folder for the authenticated user."""
    logger.info("create_folder user_id=%s name=%r", current_user.user_id, body.name)
    folder = await FolderService.create(db, current_user.user_id, body.name)
    return FolderResponse.model_validate(folder)


@router.get("", response_model=FolderListResponse)
async def list_folders(
    current_user: CurrentUser,
    db: DbSession,
) -> FolderListResponse:
    """List all folders for the authenticated user."""
    folders = await FolderService.list_by_user(db, current_user.user_id)
    return FolderListResponse(
        folders=[FolderResponse.model_validate(f) for f in folders],
        total=len(folders),
    )


@router.patch("/{folder_id}", response_model=FolderResponse)
async def rename_folder(
    folder_id: UUID,
    body: FolderUpdate,
    current_user: CurrentUser,
    db: DbSession,
) -> FolderResponse:
    """Rename a folder."""
    folder = await FolderService.get_by_id(db, folder_id, current_user.user_id)
    if folder is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found.")
    folder = await FolderService.update(db, folder, body.name)
    return FolderResponse.model_validate(folder)


@router.delete("/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(
    folder_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
) -> None:
    """Delete a folder. Documents in this folder become unfiled."""
    folder = await FolderService.get_by_id(db, folder_id, current_user.user_id)
    if folder is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found.")
    await FolderService.delete(db, folder)


@router.get("/{folder_id}/documents", response_model=DocumentListResponse)
async def list_folder_documents(
    folder_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
) -> DocumentListResponse:
    """List all documents in a folder."""
    folder = await FolderService.get_by_id(db, folder_id, current_user.user_id)
    if folder is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found.")
    docs = await FolderService.list_documents_in_folder(db, folder_id, current_user.user_id)
    return DocumentListResponse(
        documents=[DocumentResponse.model_validate(d) for d in docs],
        total=len(docs),
    )


@router.patch("/{folder_id}/documents/{document_id}", response_model=DocumentResponse)
async def assign_document_to_folder(
    folder_id: UUID,
    document_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
) -> DocumentResponse:
    """Assign a document to this folder."""
    document = await DocumentService.get_by_id(db, document_id, current_user.user_id)
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    document = await FolderService.assign_document(db, document, folder_id, current_user.user_id)
    return DocumentResponse.model_validate(document)
