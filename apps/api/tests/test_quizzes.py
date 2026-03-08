"""Tests for quiz generation and CRUD endpoints."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.processing.schemas import ChunkResponse, RetrieveResult
from app.quizzes.service import QuizService
from tests.conftest import TEST_DOC_ID, TEST_FOLDER_ID, TEST_USER_ID

FAKE_CHUNKS = [
    ChunkResponse(
        id=uuid4(),
        document_id=TEST_DOC_ID,
        chunk_index=0,
        content="The mitochondria is the powerhouse of the cell.",
        metadata={},
    ),
]

FAKE_RETRIEVE = RetrieveResult(
    context_text="[Doc ... | Chunk 0]\nThe mitochondria ...",
    context_chunks=FAKE_CHUNKS,
)

FAKE_LLM_RESPONSE = {
    "questions": [
        {
            "question": "What is the powerhouse of the cell?",
            "options": [
                {"label": "A", "text": "Mitochondria"},
                {"label": "B", "text": "Nucleus"},
                {"label": "C", "text": "Ribosome"},
                {"label": "D", "text": "Golgi apparatus"},
            ],
            "correct_option": "A",
            "explanation": "Mitochondria produce ATP.",
        },
        {
            "question": "What does DNA stand for?",
            "options": [
                {"label": "A", "text": "Deoxyribonucleic acid"},
                {"label": "B", "text": "Dinitrogen acid"},
                {"label": "C", "text": "Dioxyribose acid"},
                {"label": "D", "text": "None of the above"},
            ],
            "correct_option": "A",
            "explanation": "DNA is deoxyribonucleic acid.",
        },
        {
            "question": "Which organelle is responsible for photosynthesis?",
            "options": [
                {"label": "A", "text": "Mitochondria"},
                {"label": "B", "text": "Chloroplast"},
                {"label": "C", "text": "Nucleus"},
                {"label": "D", "text": "Vacuole"},
            ],
            "correct_option": "B",
            "explanation": "Chloroplasts convert light to energy.",
        },
    ]
}


def _mock_db() -> AsyncMock:
    db = AsyncMock()
    db.add = MagicMock()
    return db


@pytest.mark.asyncio
async def test_generate_happy_path():
    """QuizService.generate() creates a set when RAG and LLM succeed."""
    db = _mock_db()

    mock_set = MagicMock()
    mock_set.id = uuid4()
    mock_set.user_id = TEST_USER_ID
    mock_set.title = "Biology"
    mock_set.description = "Generated from 1 document(s)"
    mock_set.folder_id = TEST_FOLDER_ID
    mock_set.document_ids = [str(TEST_DOC_ID)]
    mock_set.questions = []
    mock_set.created_at = "2026-01-01T00:00:00"
    mock_set.updated_at = "2026-01-01T00:00:00"

    async def fake_refresh(obj):
        for attr, val in vars(mock_set).items():
            if not attr.startswith("_"):
                setattr(obj, attr, val)

    db.refresh = fake_refresh

    mock_llm = MagicMock()
    mock_llm.generate_json = AsyncMock(
        return_value=FAKE_LLM_RESPONSE
    )

    with (
        patch(
            "app.quizzes.service.ProcessingService.rag_retrieve_multi",
            new=AsyncMock(return_value=FAKE_RETRIEVE),
        ),
        patch(
            "app.quizzes.service.get_llm_client",
            return_value=mock_llm,
        ),
    ):
        result = await QuizService.generate(
            db=db,
            user_id=TEST_USER_ID,
            folder_id=TEST_FOLDER_ID,
            topic="Biology",
            num_questions=3,
        )

    assert result.title == "Biology"
    db.commit.assert_awaited_once()
    db.flush.assert_awaited_once()
    assert db.add.call_count >= 1


@pytest.mark.asyncio
async def test_generate_no_documents_raises_400():
    """generate() raises 400 when no indexed documents are found."""
    db = _mock_db()
    empty_retrieve = RetrieveResult(
        context_text="", context_chunks=[]
    )

    with patch(
        "app.quizzes.service.ProcessingService.rag_retrieve_multi",
        new=AsyncMock(return_value=empty_retrieve),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await QuizService.generate(
                db=db,
                user_id=TEST_USER_ID,
                topic="Nothing",
            )

    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_generate_empty_llm_response_raises_502():
    """generate() raises 502 when LLM returns empty questions array."""
    db = _mock_db()

    mock_llm = MagicMock()
    mock_llm.generate_json = AsyncMock(
        return_value={"questions": []}
    )

    with (
        patch(
            "app.quizzes.service.ProcessingService.rag_retrieve_multi",
            new=AsyncMock(return_value=FAKE_RETRIEVE),
        ),
        patch(
            "app.quizzes.service.get_llm_client",
            return_value=mock_llm,
        ),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await QuizService.generate(
                db=db,
                user_id=TEST_USER_ID,
            )

    assert exc_info.value.status_code == 502


@pytest.mark.asyncio
async def test_list_sets():
    """list_sets() returns summaries with question counts."""
    db = _mock_db()

    mock_set = MagicMock()
    mock_set.id = uuid4()
    mock_set.title = "Bio Quiz"
    mock_set.description = None
    mock_set.folder_id = None
    mock_set.created_at = "2026-01-01T00:00:00"

    mock_result = MagicMock()
    mock_result.all.return_value = [(mock_set, 10)]
    db.execute.return_value = mock_result

    result = await QuizService.list_sets(db, TEST_USER_ID)

    assert len(result) == 1
    assert result[0].question_count == 10


@pytest.mark.asyncio
async def test_get_set_not_found_raises_404():
    """get_set() raises 404 for non-existent set."""
    db = _mock_db()
    db.scalar.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await QuizService.get_set(db, TEST_USER_ID, uuid4())

    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_delete_set_not_found_raises_404():
    """delete_set() raises 404 for non-existent set."""
    db = _mock_db()
    db.scalar.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        await QuizService.delete_set(db, TEST_USER_ID, uuid4())

    assert exc_info.value.status_code == 404
