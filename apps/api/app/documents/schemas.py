"""Pydantic schemas for document API operations."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


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


class ShareLinkCreateRequest(BaseModel):
    """Request body for creating a share link."""

    recipient_emails: list[str] = Field(default_factory=list)
    expires_in_hours: int | None = Field(default=None, ge=1, le=720)

    @field_validator("recipient_emails")
    @classmethod
    def normalize_recipient_emails(cls, value: list[str]) -> list[str]:
        """Normalize, validate and deduplicate recipient emails."""
        normalized: list[str] = []
        seen: set[str] = set()
        for raw in value:
            email = raw.strip().lower()
            if not email:
                continue
            if "@" not in email:
                raise ValueError(f"Invalid email: {raw!r}")
            if email in seen:
                continue
            seen.add(email)
            normalized.append(email)
        return normalized


class ShareLinkResponse(BaseModel):
    """Response schema for a created share link."""

    id: UUID
    document_id: UUID
    share_token: str
    share_url: str
    recipient_emails: list[str]
    expires_at: datetime | None
    created_at: datetime


class SharedDocumentResponse(BaseModel):
    """Response schema for resolving a share link to a document."""

    share_id: UUID
    access_level: str  # "owner" | "recipient" | "link"
    recipient_restricted: bool
    expires_at: datetime | None
    document: DocumentResponse
