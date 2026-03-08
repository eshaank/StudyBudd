"""API router for document processing endpoints (simple RAG)."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, DbSession
from app.documents.models import Document
from app.documents.text_extraction import extract_text_from_document
from app.processing.models import ProcessingDocument, DocumentChunk
from app.processing.schemas import (
    ChunkResponse,
    ProcessingStatusResponse,
    QueryRequest,
    QueryResponse,
)
from app.processing.service import ProcessingService

router = APIRouter(prefix="/processing", tags=["processing"])


# ----------------------------
# Ownership helper
# ----------------------------
async def _verify_document_ownership(
    document_id: UUID,
    user_id: UUID,
    db: AsyncSession,
) -> Document:
    """Verify user owns the document. Returns the document or raises 404."""
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == user_id,
        )
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found.")
    return doc


# ----------------------------
# Processing endpoints
# ----------------------------
@router.post("/{document_id}/process")
async def process_document(
    document_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
) -> ProcessingStatusResponse:
    """Re-run RAG processing for an uploaded document (text/csv only)."""
    doc = await _verify_document_ownership(document_id, current_user.user_id, db)

    if doc.file_type not in ("text", "csv", "pdf"):
        raise HTTPException(
            status_code=400,
            detail=f"Only text and CSV documents can be processed; got file_type={doc.file_type!r}",
        )

    try:
        text = extract_text_from_document(doc)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return await ProcessingService.process_document(
        db=db,
        document_id=document_id,
        title=doc.original_filename or "untitled",
        text=text,
    )


@router.get("/{document_id}/status")
async def get_status(
    document_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
) -> ProcessingStatusResponse:
    """Get processing status for a document."""
    await _verify_document_ownership(document_id, current_user.user_id, db)

    proc_doc = await db.scalar(select(ProcessingDocument).where(ProcessingDocument.id == document_id))
    if proc_doc is None:
        return ProcessingStatusResponse(
            document_id=document_id,
            status="pending",
            chunks_count=0,
            error=None,
        )

    chunks_count = await db.scalar(
        select(func.count()).select_from(DocumentChunk).where(
            DocumentChunk.document_id == document_id
        )
    )

    return ProcessingStatusResponse(
        document_id=proc_doc.id,
        status=proc_doc.status,
        chunks_count=int(chunks_count or 0),
        error=proc_doc.error,
    )


@router.get("/{document_id}/chunks")
async def get_chunks(
    document_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
) -> list[ChunkResponse]:
    """Get document chunks (requires document to be processed)."""
    await _verify_document_ownership(document_id, current_user.user_id, db)

    rows = (
        await db.execute(
            select(DocumentChunk)
            .where(DocumentChunk.document_id == document_id)
            .order_by(DocumentChunk.chunk_index.asc())
        )
    ).scalars().all()

    return [
        ChunkResponse(
            id=r.id,
            document_id=r.document_id,
            chunk_index=r.chunk_index,
            content=r.content,
            metadata=r.chunk_metadata or {},
        )
        for r in rows
    ]


# ----------------------------
# RAG query endpoint
# ----------------------------
@router.post("/rag/query", response_model=QueryResponse)
async def rag_query(
    req: QueryRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> QueryResponse:
    """Run RAG query on a document."""
    await _verify_document_ownership(req.document_id, current_user.user_id, db)

    return await ProcessingService.rag_query(
        db=db,
        document_id=req.document_id,
        question=req.question,
        top_k=req.top_k,
    )
