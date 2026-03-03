"""Pydantic schemas for folder API operations."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FolderCreate(BaseModel):
    """Request body for creating a folder."""

    name: str = Field(..., min_length=1, max_length=255)


class FolderUpdate(BaseModel):
    """Request body for renaming a folder."""

    name: str = Field(..., min_length=1, max_length=255)


class FolderResponse(BaseModel):
    """API response for a single folder."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    name: str
    created_at: datetime
    updated_at: datetime


class FolderListResponse(BaseModel):
    """API response for listing folders."""

    folders: list[FolderResponse]
    total: int


class AssignFolderRequest(BaseModel):
    """Request body for assigning a document to a folder."""

    folder_id: UUID | None = None
