"""Pydantic schemas for flashcard endpoints."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class FlashcardGenerateRequest(BaseModel):
    """Request body for generating a new flashcard set."""

    folder_id: UUID | None = None
    document_ids: list[UUID] | None = None
    topic: str | None = Field(None, max_length=500)
    title: str | None = Field(None, max_length=255, description="Display name for the set")
    num_cards: int = Field(10, ge=3, le=30)


class FlashcardResponse(BaseModel):
    """A single flashcard within a set."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    front: str
    back: str
    position: int


class SourceDocumentSummary(BaseModel):
    """Source file a set was generated from."""

    id: UUID
    original_filename: str


class SourceChunkSummary(BaseModel):
    """Chunk of text used as context when generating the set."""

    document_id: UUID
    chunk_index: int
    content_preview: str


class FlashcardSetResponse(BaseModel):
    """Full flashcard set with its cards."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    description: str | None
    folder_id: UUID | None
    document_ids: list
    cards: list[FlashcardResponse]
    created_at: datetime
    updated_at: datetime
    source_documents: list[SourceDocumentSummary] = []
    source_chunks: list[SourceChunkSummary] = []


class FlashcardSetSummary(BaseModel):
    """Lightweight summary for listing sets (no cards)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str | None
    folder_id: UUID | None
    card_count: int
    created_at: datetime
