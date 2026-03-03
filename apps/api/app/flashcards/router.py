"""API router for flashcard endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter

from app.core.dependencies import CurrentUser, DbSession
from app.flashcards.schemas import (
    FlashcardGenerateRequest,
    FlashcardSetResponse,
    FlashcardSetSummary,
)
from app.flashcards.service import FlashcardService

router = APIRouter(prefix="/flashcards", tags=["flashcards"])


@router.post("/generate", response_model=FlashcardSetResponse)
async def generate_flashcards(
    req: FlashcardGenerateRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> FlashcardSetResponse:
    """Generate a new flashcard set from user documents."""
    return await FlashcardService.generate(
        db=db,
        user_id=current_user.user_id,
        folder_id=req.folder_id,
        document_ids=req.document_ids,
        topic=req.topic,
        title=req.title,
        num_cards=req.num_cards,
    )


@router.get("/sets", response_model=list[FlashcardSetSummary])
async def list_flashcard_sets(
    current_user: CurrentUser,
    db: DbSession,
) -> list[FlashcardSetSummary]:
    """List all flashcard sets for the current user."""
    return await FlashcardService.list_sets(db, current_user.user_id)


@router.get("/sets/{set_id}", response_model=FlashcardSetResponse)
async def get_flashcard_set(
    set_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
) -> FlashcardSetResponse:
    """Get a flashcard set with all its cards."""
    return await FlashcardService.get_set(db, current_user.user_id, set_id)


@router.delete("/sets/{set_id}", status_code=204)
async def delete_flashcard_set(
    set_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
) -> None:
    """Delete a flashcard set."""
    await FlashcardService.delete_set(db, current_user.user_id, set_id)
