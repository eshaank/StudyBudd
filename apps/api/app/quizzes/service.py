"""Business logic for quiz generation and CRUD."""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.inference.client import get_llm_client
from app.inference.prompts import QUIZ_SYSTEM_PROMPT
from app.processing.service import ProcessingService
from app.quizzes.models import QuizQuestion, QuizSet
from app.quizzes.schemas import QuizSetResponse, QuizSetSummary

logger = logging.getLogger(__name__)


class QuizService:
    """Service for generating, listing, and managing quiz sets."""

    @staticmethod
    async def generate(
        db: AsyncSession,
        user_id: UUID,
        *,
        folder_id: UUID | None = None,
        document_ids: list[UUID] | None = None,
        topic: str | None = None,
        num_questions: int = 10,
    ) -> QuizSetResponse:
        """Generate a quiz set from user documents via RAG + LLM."""
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
            f"Generate exactly {num_questions} multiple-choice "
            f"questions from the following study material.\n\n"
            f"{topic_hint}\n\n"
            f"Study material:\n{retrieve.context_text}"
        )

        llm = get_llm_client()
        raw = await llm.generate_json(
            system_prompt=QUIZ_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            temperature=0.3,
        )

        questions_data = raw.get("questions", [])
        if not questions_data:
            raise HTTPException(
                status_code=502,
                detail="LLM did not return any quiz questions.",
            )

        source_doc_ids = list({str(c.document_id) for c in retrieve.context_chunks})
        title = topic or "Quiz"

        quiz_set = QuizSet(
            user_id=user_id,
            title=title,
            description=f"Generated from {len(source_doc_ids)} document(s)",
            folder_id=folder_id,
            document_ids=source_doc_ids,
        )
        db.add(quiz_set)
        await db.flush()

        for idx, q in enumerate(questions_data):
            db.add(
                QuizQuestion(
                    set_id=quiz_set.id,
                    question=q.get("question", ""),
                    options=q.get("options", []),
                    correct_option=q.get("correct_option", "A"),
                    explanation=q.get("explanation"),
                    position=idx,
                )
            )

        await db.commit()
        await db.refresh(quiz_set)

        logger.info(
            "quiz set generated user_id=%s set_id=%s questions=%d",
            user_id, quiz_set.id, len(questions_data),
        )
        return QuizSetResponse.model_validate(quiz_set)

    @staticmethod
    async def list_sets(db: AsyncSession, user_id: UUID) -> list[QuizSetSummary]:
        """Return all quiz sets for a user (lightweight, no questions)."""
        stmt = (
            select(
                QuizSet,
                func.count(QuizQuestion.id).label("question_count"),
            )
            .outerjoin(QuizQuestion, QuizQuestion.set_id == QuizSet.id)
            .where(QuizSet.user_id == user_id)
            .group_by(QuizSet.id)
            .order_by(QuizSet.created_at.desc())
        )
        rows = (await db.execute(stmt)).all()

        return [
            QuizSetSummary(
                id=qset.id,
                title=qset.title,
                description=qset.description,
                folder_id=qset.folder_id,
                question_count=count,
                created_at=qset.created_at,
            )
            for qset, count in rows
        ]

    @staticmethod
    async def get_set(db: AsyncSession, user_id: UUID, set_id: UUID) -> QuizSetResponse:
        """Get a single quiz set with all questions."""
        qset = await db.scalar(
            select(QuizSet).where(
                QuizSet.id == set_id,
                QuizSet.user_id == user_id,
            )
        )
        if qset is None:
            raise HTTPException(status_code=404, detail="Quiz set not found.")
        return QuizSetResponse.model_validate(qset)

    @staticmethod
    async def delete_set(db: AsyncSession, user_id: UUID, set_id: UUID) -> None:
        """Delete a quiz set (questions cascade)."""
        qset = await db.scalar(
            select(QuizSet).where(
                QuizSet.id == set_id,
                QuizSet.user_id == user_id,
            )
        )
        if qset is None:
            raise HTTPException(status_code=404, detail="Quiz set not found.")

        await db.execute(delete(QuizSet).where(QuizSet.id == set_id))
        await db.commit()
        logger.info("quiz set deleted user_id=%s set_id=%s", user_id, set_id)
