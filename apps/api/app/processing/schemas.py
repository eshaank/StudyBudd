"""Pydantic schemas for document processing + RAG."""

from __future__ import annotations

from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ProcessRequest(BaseModel):
    """Text payload to chunk + embed + store."""
    title: str = Field(default="untitled")
    text: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class ProcessingStatusResponse(BaseModel):
    """Response schema for processing status."""
    document_id: UUID
    status: str
    chunks_count: int
    error: Optional[str] = None


class ChunkResponse(BaseModel):
    """Response schema for a document chunk."""
    id: UUID
    document_id: UUID
    chunk_index: int
    content: str
    metadata: dict[str, Any]


class QueryRequest(BaseModel):
    document_id: UUID
    question: str
    top_k: int = 5


class QueryResponse(BaseModel):
    document_id: UUID
    question: str
    answer: str
    context_chunks: list[ChunkResponse]


class RetrieveResult(BaseModel):
    """Result of multi-document retrieval (no LLM answer; used by the chat agent tool)."""

    context_text: str
    context_chunks: list[ChunkResponse]
