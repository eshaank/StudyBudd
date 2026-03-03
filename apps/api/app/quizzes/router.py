"""API router for quiz endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter

from app.core.dependencies import CurrentUser, DbSession
from app.quizzes.schemas import (
    QuizGenerateRequest,
    QuizSetResponse,
    QuizSetSummary,
)
from app.quizzes.service import QuizService

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


@router.post("/generate", response_model=QuizSetResponse)
async def generate_quiz(
    req: QuizGenerateRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> QuizSetResponse:
    """Generate a new quiz set from user documents."""
    return await QuizService.generate(
        db=db,
        user_id=current_user.user_id,
        folder_id=req.folder_id,
        document_ids=req.document_ids,
        topic=req.topic,
        num_questions=req.num_questions,
    )


@router.get("/sets", response_model=list[QuizSetSummary])
async def list_quiz_sets(
    current_user: CurrentUser,
    db: DbSession,
) -> list[QuizSetSummary]:
    """List all quiz sets for the current user."""
    return await QuizService.list_sets(db, current_user.user_id)


@router.get("/sets/{set_id}", response_model=QuizSetResponse)
async def get_quiz_set(
    set_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
) -> QuizSetResponse:
    """Get a quiz set with all its questions."""
    return await QuizService.get_set(db, current_user.user_id, set_id)


@router.delete("/sets/{set_id}", status_code=204)
async def delete_quiz_set(
    set_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
) -> None:
    """Delete a quiz set."""
    await QuizService.delete_set(db, current_user.user_id, set_id)
