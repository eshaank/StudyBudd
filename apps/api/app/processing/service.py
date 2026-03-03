"""Business logic for document processing and RAG."""

from __future__ import annotations

import hashlib
import math
import re
from typing import Any
from uuid import UUID

import httpx
from fastapi import HTTPException
from sqlalchemy import delete, func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.documents.models import Document as UserDocument
from app.processing.models import ProcessingDocument, DocumentChunk
from app.processing.schemas import (
    ChunkResponse,
    ProcessingStatusResponse,
    QueryResponse,
    RetrieveResult,
)

# intfloat/multilingual-e5-large-instruct outputs 1024. Must match Vector(dim) in models.py.
EMBEDDING_DIM = 1024


# ----------------------------
# Chunking
# ----------------------------
def chunk_text(text: str, max_chars: int = 900, overlap: int = 150) -> list[str]:
    """Split text into overlapping chunks for embedding."""
    # PostgreSQL UTF-8 text cannot contain null bytes (0x00); PDF extraction can produce them
    text = text.replace("\x00", " ")
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []

    chunks: list[str] = []
    i = 0
    n = len(text)
    while i < n:
        end = min(i + max_chars, n)
        chunk = text[i:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == n:
            break
        i = max(0, end - overlap)
    return chunks


# ----------------------------
# Embeddings
# ----------------------------
def _hash_to_unit_vector(s: str, dim: int = EMBEDDING_DIM) -> list[float]:
    """
    Deterministic fallback embedding when no API key is configured.
    Hashes tokens into a fixed-size bag and L2-normalizes.
    """
    vec = [0.0] * dim
    tokens = re.findall(r"[A-Za-z0-9_]+", s.lower())
    if not tokens:
        return vec

    for t in tokens:
        h = int(hashlib.sha256(t.encode("utf-8")).hexdigest(), 16)
        vec[h % dim] += 1.0

    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


async def embed(texts: list[str], *, prefix: str | None = None) -> list[list[float]]:
    """Generate embeddings via Together API or fallback to deterministic hash vectors.

    Args:
        texts: Raw text strings to embed.
        prefix: Optional instruction prefix for models that require it
                (e.g. ``"query: "`` or ``"passage: "`` for E5-instruct).
    """
    prefixed = [f"{prefix}{t}" for t in texts] if prefix else texts

    settings = get_settings()
    if not settings.together_api_key:
        return [_hash_to_unit_vector(t) for t in prefixed]

    async with httpx.AsyncClient(timeout=30.0) as client:
        r = await client.post(
            "https://api.together.xyz/v1/embeddings",
            headers={"Authorization": f"Bearer {settings.together_api_key}"},
            json={"model": settings.together_embed_model, "input": prefixed},
        )
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"Embedding provider error: {r.text}")

        data = r.json()
        vectors = [item["embedding"] for item in data["data"]]

    if vectors and len(vectors[0]) != EMBEDDING_DIM:
        raise HTTPException(
            status_code=500,
            detail=(
                f"Embedding dimension mismatch: got {len(vectors[0])} but Vector is {EMBEDDING_DIM}. "
                "Either change EMBEDDING_DIM + Vector(dim) and migrate, or use a matching embed model."
            ),
        )
    return vectors


# ----------------------------
# Vector schema helper
# ----------------------------
async def _resolve_vec_schema(db: AsyncSession) -> str:
    """Resolve the schema where the pgvector 'vector' type lives on this connection."""
    result = await db.execute(
        text("""
            SELECT n.nspname FROM pg_type t
            JOIN pg_namespace n ON t.typnamespace = n.oid
            WHERE t.typname = 'vector'
            ORDER BY CASE n.nspname WHEN 'public' THEN 0 WHEN 'extensions' THEN 1 ELSE 2 END
            LIMIT 1
        """)
    )
    row = result.one_or_none()
    if not row:
        raise HTTPException(
            status_code=503,
            detail="Vector type not found. Use direct DB connection (port 5432) or enable pgvector.",
        )
    schema = row[0]
    return schema if schema in ("public", "extensions", "vector_db") else "extensions"


# ----------------------------
# RAG answer generation
# ----------------------------
async def generate_answer(question: str, context: str) -> str:
    """Generate RAG answer via Together chat API."""
    settings = get_settings()
    if not settings.together_api_key:
        return (
            "No LLM configured (TOGETHER_API_KEY not set). "
            "Here is the retrieved context you can use:\n\n"
            f"{context}"
        )

    async with httpx.AsyncClient(timeout=45.0) as client:
        r = await client.post(
            "https://api.together.xyz/v1/chat/completions",
            headers={"Authorization": f"Bearer {settings.together_api_key}"},
            json={
                "model": settings.together_model,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a helpful study assistant. The user is asking about a specific document. "
                            "The 'Context' below is the actual content extracted from that document (shown in chunks). "
                            "Answer the user's question using ONLY this context. "
                            "When they ask 'about this file' or 'about the document', describe or summarize what the context contains. "
                            "If the context is truly empty or irrelevant to the question, say you don't have enough information."
                        ),
                    },
                    {
                        "role": "user",
                        "content": (
                            f"The following context is the content of the document the user is asking about.\n\n"
                            f"Question: {question}\n\nContext:\n{context}"
                        ),
                    },
                ],
                "temperature": 0.2,
                "max_tokens": settings.together_max_tokens,
            },
        )
        if r.status_code >= 400:
            raise HTTPException(status_code=502, detail=f"LLM provider error: {r.text}")

        out = r.json()
        return out["choices"][0]["message"]["content"].strip()


# ----------------------------
# ProcessingService
# ----------------------------
class ProcessingService:
    """Service for processing documents into searchable chunks and running RAG queries."""

    @staticmethod
    async def process_document(
        db: AsyncSession,
        document_id: UUID,
        title: str,
        text: str,
        metadata: dict[str, Any] | None = None,
    ) -> ProcessingStatusResponse:
        """
        Full RAG pipeline: chunk text, embed, store in processing_documents and document_chunks.
        """
        meta = metadata or {}

        # Upsert processing_documents row
        existing = await db.scalar(select(ProcessingDocument).where(ProcessingDocument.id == document_id))
        if existing is None:
            doc = ProcessingDocument(id=document_id, title=title, status="processing")
            db.add(doc)
            await db.flush()
        else:
            await db.execute(
                update(ProcessingDocument)
                .where(ProcessingDocument.id == document_id)
                .values(title=title, status="processing", error=None)
            )

        # Clear old chunks
        await db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document_id))

        chunks = chunk_text(text)
        if not chunks:
            await db.execute(
                update(ProcessingDocument)
                .where(ProcessingDocument.id == document_id)
                .values(status="error", error="No text to process.")
            )
            await db.commit()
            return ProcessingStatusResponse(
                document_id=document_id,
                status="error",
                chunks_count=0,
                error="No text to process.",
            )

        try:
            vectors = await embed(chunks, prefix="passage: ")
        except HTTPException:
            await db.execute(
                update(ProcessingDocument)
                .where(ProcessingDocument.id == document_id)
                .values(status="error", error="Embedding failed.")
            )
            await db.commit()
            raise

        for idx, (content, vec) in enumerate(zip(chunks, vectors)):
            db.add(
                DocumentChunk(
                    document_id=document_id,
                    chunk_index=idx,
                    content=content,
                    embedding=vec,
                    chunk_metadata={**meta, "chunk_index": idx},
                )
            )

        await db.execute(
            update(ProcessingDocument).where(ProcessingDocument.id == document_id).values(status="ready", error=None)
        )
        await db.commit()

        return ProcessingStatusResponse(
            document_id=document_id,
            status="ready",
            chunks_count=len(chunks),
            error=None,
        )

    @staticmethod
    async def rag_query(
        db: AsyncSession,
        document_id: UUID,
        question: str,
        top_k: int = 5,
    ) -> QueryResponse:
        """
        Run RAG query: embed question, retrieve top-k chunks, generate answer.
        """
        doc = await db.scalar(select(ProcessingDocument).where(ProcessingDocument.id == document_id))
        if doc is None:
            raise HTTPException(status_code=404, detail="Document not found.")
        if doc.status != "ready":
            raise HTTPException(
                status_code=400,
                detail=f"Document status is '{doc.status}', not ready.",
            )

        qvec = (await embed([question], prefix="query: "))[0]
        vec_schema = await _resolve_vec_schema(db)
        qvec_str = "[" + ",".join(str(x) for x in qvec) + "]"

        stmt = text(
            f"""
            SELECT id, document_id, chunk_index, content, metadata, embedding, created_at
            FROM document_chunks
            WHERE document_id = :document_id
            ORDER BY embedding <=> CAST(:qvec AS {vec_schema}.vector)
            LIMIT :limit
            """
        )
        result = await db.execute(
            stmt,
            {"document_id": document_id, "qvec": qvec_str, "limit": top_k},
        )
        rows = result.mappings().all()

        context_chunks = [
            ChunkResponse(
                id=row["id"],
                document_id=row["document_id"],
                chunk_index=row["chunk_index"],
                content=row["content"],
                metadata=row["metadata"] or {},
            )
            for row in rows
        ]

        context_text = "\n\n---\n\n".join(
            f"[Chunk {c.chunk_index}]\n{c.content}" for c in context_chunks
        )

        answer = await generate_answer(question, context_text)

        return QueryResponse(
            document_id=document_id,
            question=question,
            answer=answer,
            context_chunks=context_chunks,
        )

    @staticmethod
    async def rag_retrieve_multi(
        db: AsyncSession,
        user_id: UUID,
        question: str,
        top_k: int = 5,
        document_ids: list[UUID] | None = None,
        folder_ids: list[UUID] | None = None,
    ) -> RetrieveResult:
        """Retrieve relevant chunks across multiple documents without generating an answer.

        The document set is resolved in this priority:
        1. ``folder_ids`` provided → docs in those folders that are RAG-ready.
        2. ``document_ids`` provided → those specific docs (ownership verified, must be ready).
        3. Neither provided → all of the user's RAG-ready documents.

        Returns context text and the matched chunks for source attribution.
        """
        # --- Resolve document ID set ---
        if folder_ids is not None and len(folder_ids) > 0:
            rows = await db.execute(
                select(UserDocument.id)
                .join(ProcessingDocument, ProcessingDocument.id == UserDocument.id)
                .where(
                    UserDocument.user_id == user_id,
                    UserDocument.folder_id.in_(folder_ids),
                    ProcessingDocument.status == "ready",
                )
            )
            resolved_ids = [r[0] for r in rows.all()]
        elif document_ids is not None and len(document_ids) > 0:
            rows = await db.execute(
                select(UserDocument.id)
                .join(ProcessingDocument, ProcessingDocument.id == UserDocument.id)
                .where(
                    UserDocument.id.in_(document_ids),
                    UserDocument.user_id == user_id,
                    ProcessingDocument.status == "ready",
                )
            )
            resolved_ids = [r[0] for r in rows.all()]
        else:
            rows = await db.execute(
                select(UserDocument.id)
                .join(ProcessingDocument, ProcessingDocument.id == UserDocument.id)
                .where(
                    UserDocument.user_id == user_id,
                    ProcessingDocument.status == "ready",
                )
            )
            resolved_ids = [r[0] for r in rows.all()]

        if not resolved_ids:
            return RetrieveResult(context_text="", context_chunks=[])

        qvec = (await embed([question], prefix="query: "))[0]
        vec_schema = await _resolve_vec_schema(db)
        qvec_str = "[" + ",".join(str(x) for x in qvec) + "]"

        stmt = text(
            f"""
            SELECT id, document_id, chunk_index, content, metadata, embedding, created_at
            FROM document_chunks
            WHERE document_id = ANY(:doc_ids)
            ORDER BY embedding <=> CAST(:qvec AS {vec_schema}.vector)
            LIMIT :limit
            """
        )
        result = await db.execute(
            stmt,
            {"doc_ids": resolved_ids, "qvec": qvec_str, "limit": top_k},
        )
        rows_data = result.mappings().all()

        context_chunks = [
            ChunkResponse(
                id=row["id"],
                document_id=row["document_id"],
                chunk_index=row["chunk_index"],
                content=row["content"],
                metadata=row["metadata"] or {},
            )
            for row in rows_data
        ]

        context_text = "\n\n---\n\n".join(
            f"[Doc {c.document_id} | Chunk {c.chunk_index}]\n{c.content}"
            for c in context_chunks
        )

        return RetrieveResult(context_text=context_text, context_chunks=context_chunks)
