"""Business logic for flashcard generation and CRUD."""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.documents.models import Document
from app.flashcards.models import Flashcard, FlashcardSet
from app.flashcards.schemas import (
    FlashcardSetResponse,
    FlashcardSetSummary,
    SourceChunkSummary,
    SourceDocumentSummary,
)
from app.inference.client import get_llm_client
from app.inference.prompts import FLASHCARD_SYSTEM_PROMPT
from app.processing.service import ProcessingService

logger = logging.getLogger(__name__)

PREVIEW_MAX_LEN = 200


async def _resolve_source_documents(
    db: AsyncSession, user_id: UUID, document_ids: list
) -> list[SourceDocumentSummary]:
    """Resolve document IDs to source document summaries (id, original_filename)."""
    if not document_ids:
        return []
    ids = [UUID(str(d)) if not isinstance(d, UUID) else d for d in document_ids]
    result = await db.execute(
        select(Document.id, Document.original_filename).where(
            Document.id.in_(ids),
            Document.user_id == user_id,
        )
    )
    return [
        SourceDocumentSummary(id=row.id, original_filename=row.original_filename)
        for row in result.all()
    ]


def _enrich_set_response(
    base: FlashcardSetResponse,
    source_documents: list[SourceDocumentSummary],
    source_chunks: list[SourceChunkSummary],
) -> FlashcardSetResponse:
    """Attach source attribution to a set response."""
    return base.model_copy(
        update={
            "source_documents": source_documents,
            "source_chunks": source_chunks,
        }
    )


class FlashcardService:
    """Service for generating, listing, and managing flashcard sets."""

    @staticmethod
    async def generate(
        db: AsyncSession,
        user_id: UUID,
        *,
        folder_id: UUID | None = None,
        document_ids: list[UUID] | None = None,
        topic: str | None = None,
        title: str | None = None,
        num_cards: int = 10,
    ) -> FlashcardSetResponse:
        """Generate a flashcard set from user documents via RAG + LLM.

        1. Retrieve relevant chunks using the existing RAG pipeline.
        2. Prompt the LLM for structured flashcard JSON.
        3. Persist the set and individual cards.
        """
        folder_ids = [folder_id] if folder_id else None

        retrieve = await ProcessingService.rag_retrieve_multi(
            db=db,
            user_id=user_id,
            question=topic or "key concepts and important information",
            top_k=12,
            document_ids=document_ids,
            folder_ids=folder_ids,
        )

        if not retrieve.context_chunks:
            raise HTTPException(
                status_code=400,
                detail=(
                    "No indexed documents found matching the request. "
                    "Upload and process documents first."
                ),
            )

        topic_hint = f"Focus on: {topic}" if topic else ""
        user_prompt = (
            f"Generate exactly {num_cards} flashcards "
            f"from the following study material.\n\n"
            f"{topic_hint}\n\n"
            f"Study material:\n{retrieve.context_text}"
        )

        llm = get_llm_client()
        raw = await llm.generate_json(
            system_prompt=FLASHCARD_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.3,
        )

        cards_data = raw.get("flashcards", [])
        if not cards_data:
            raise HTTPException(
                status_code=502,
                detail="LLM did not return any flashcards.",
            )

        source_doc_ids = list({str(c.document_id) for c in retrieve.context_chunks})
        set_title = (title or topic or "Flashcard Set").strip() or "Flashcard Set"

        source_chunks_payload = [
            {
                "document_id": str(c.document_id),
                "chunk_index": c.chunk_index,
                "content_preview": (c.content or "")[:PREVIEW_MAX_LEN],
            }
            for c in retrieve.context_chunks
        ]

        flashcard_set = FlashcardSet(
            user_id=user_id,
            title=set_title,
            description=f"Generated from {len(source_doc_ids)} document(s)",
            folder_id=folder_id,
            document_ids=source_doc_ids,
            source_chunks=source_chunks_payload,
        )
        db.add(flashcard_set)
        await db.flush()

        for idx, card in enumerate(cards_data):
            db.add(
                Flashcard(
                    set_id=flashcard_set.id,
                    front=card.get("front", ""),
                    back=card.get("back", ""),
                    position=idx,
                )
            )

        await db.commit()
        await db.refresh(flashcard_set)

        logger.info(
            "flashcard set generated user_id=%s set_id=%s cards=%d",
            user_id, flashcard_set.id, len(cards_data),
        )
        base = FlashcardSetResponse.model_validate(flashcard_set)
        source_documents = await _resolve_source_documents(
            db, user_id, flashcard_set.document_ids or []
        )
        chunks = [
            SourceChunkSummary.model_validate(c)
            for c in (flashcard_set.source_chunks or [])
        ]
        return _enrich_set_response(base, source_documents, chunks)

    @staticmethod
    async def list_sets(db: AsyncSession, user_id: UUID) -> list[FlashcardSetSummary]:
        """Return all flashcard sets for a user (lightweight, no cards)."""
        stmt = (
            select(
                FlashcardSet,
                func.count(Flashcard.id).label("card_count"),
            )
            .outerjoin(Flashcard, Flashcard.set_id == FlashcardSet.id)
            .where(FlashcardSet.user_id == user_id)
            .group_by(FlashcardSet.id)
            .order_by(FlashcardSet.created_at.desc())
        )
        rows = (await db.execute(stmt)).all()

        return [
            FlashcardSetSummary(
                id=fset.id,
                title=fset.title,
                description=fset.description,
                folder_id=fset.folder_id,
                card_count=count,
                created_at=fset.created_at,
            )
            for fset, count in rows
        ]

    @staticmethod
    async def get_set(
        db: AsyncSession, user_id: UUID, set_id: UUID
    ) -> FlashcardSetResponse:
        """Get a single flashcard set with all cards and source attribution."""
        fset = await db.scalar(
            select(FlashcardSet).where(
                FlashcardSet.id == set_id,
                FlashcardSet.user_id == user_id,
            )
        )
        if fset is None:
            raise HTTPException(status_code=404, detail="Flashcard set not found.")
        base = FlashcardSetResponse.model_validate(fset)
        source_documents = await _resolve_source_documents(
            db, user_id, fset.document_ids or []
        )
        chunks = [
            SourceChunkSummary.model_validate(c)
            for c in (getattr(fset, "source_chunks", None) or [])
        ]
        return _enrich_set_response(base, source_documents, chunks)

    @staticmethod
    async def delete_set(db: AsyncSession, user_id: UUID, set_id: UUID) -> None:
        """Delete a flashcard set (cards cascade)."""
        fset = await db.scalar(
            select(FlashcardSet).where(
                FlashcardSet.id == set_id,
                FlashcardSet.user_id == user_id,
            )
        )
        if fset is None:
            raise HTTPException(status_code=404, detail="Flashcard set not found.")

        await db.execute(delete(FlashcardSet).where(FlashcardSet.id == set_id))
        await db.commit()
        logger.info("flashcard set deleted user_id=%s set_id=%s", user_id, set_id)
