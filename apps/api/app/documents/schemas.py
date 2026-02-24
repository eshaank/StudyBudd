"""Pydantic schemas for document API operations."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DocumentBase(BaseModel):
    """Base schema with common document fields."""

    filename: str
    file_type: str
    mime_type: str
    file_size: int


class DocumentCreate(DocumentBase):
    """Schema for creating a document record (internal use)."""

    user_id: UUID
    original_filename: str
    storage_path: str


class DocumentResponse(DocumentBase):
    """Schema for document in API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    folder_id: UUID | None = None
    original_filename: str
    storage_path: str
    created_at: datetime
    updated_at: datetime


class DocumentUploadResponse(BaseModel):
    """Response schema for successful document upload."""

    message: str
    document: DocumentResponse
    processing_status: str | None = None  # "ready" | "error" | "unsupported" | None
    chunks_count: int | None = None
    processing_error: str | None = None


class DocumentListResponse(BaseModel):
    """Response schema for listing user's documents."""

    documents: list[DocumentResponse]
    total: int
