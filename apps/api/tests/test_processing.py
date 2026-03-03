"""Tests for document processing service (chunking, embeddings, RAG)."""
from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException

from app.processing.service import (
    EMBEDDING_DIM,
    ProcessingService,
    chunk_text,
    embed,
)
from tests.conftest import TEST_DOC_ID, TEST_USER_ID

# =============================================================================
# Unit Tests: chunk_text
# =============================================================================


def test_chunk_text_empty_string():
    """Empty input returns an empty list."""
    assert chunk_text("") == []


def test_chunk_text_whitespace_only():
    """Whitespace-only input returns an empty list."""
    assert chunk_text("   \n\t  ") == []


def test_chunk_text_short_text_single_chunk():
    """Text shorter than max_chars produces exactly one chunk."""
    text = "Hello world"
    result = chunk_text(text, max_chars=900)
    assert result == ["Hello world"]


def test_chunk_text_exact_max_chars():
    """Text exactly max_chars long produces a single chunk."""
    text = "a" * 900
    result = chunk_text(text, max_chars=900)
    assert len(result) == 1
    assert result[0] == text


def test_chunk_text_long_text_produces_overlap():
    """Long text produces multiple chunks, each starting within the overlap of the previous."""
    text = "word " * 400  # ~2000 chars
    result = chunk_text(text, max_chars=900, overlap=150)

    assert len(result) > 1
    for chunk in result:
        assert len(chunk) <= 900

    # The second chunk should start before position (900 - 150 = 750) into the original
    # by verifying the beginning of chunk[1] appears somewhere in chunk[0]
    overlap_start = result[1][:30]
    assert overlap_start in result[0]


def test_chunk_text_normalises_whitespace():
    """Extra whitespace (newlines, tabs, multiple spaces) is collapsed."""
    text = "hello  \n\n  world"
    result = chunk_text(text)
    assert result == ["hello world"]


def test_chunk_text_custom_params():
    """Custom max_chars and overlap are respected."""
    text = "abcdefghij" * 10  # 100 chars
    result = chunk_text(text, max_chars=20, overlap=5)

    assert all(len(c) <= 20 for c in result)
    assert len(result) > 1


# =============================================================================
# Unit Tests: embed()
# =============================================================================


@pytest.mark.asyncio
async def test_embed_no_api_key_uses_fallback():
    """With no TOGETHER_API_KEY, embed() returns deterministic hash vectors."""
    with patch("app.processing.service.get_settings") as mock_settings:
        mock_settings.return_value.together_api_key = None
        result = await embed(["hello world", "test text"])

    assert len(result) == 2
    assert len(result[0]) == EMBEDDING_DIM
    assert len(result[1]) == EMBEDDING_DIM
    # Deterministic: calling again returns same value
    with patch("app.processing.service.get_settings") as mock_settings:
        mock_settings.return_value.together_api_key = None
        result2 = await embed(["hello world"])
    assert result2[0] == result[0]


@pytest.mark.asyncio
async def test_embed_api_success():
    """With an API key, embed() returns vectors from the API response."""
    fake_vectors = [[0.1] * EMBEDDING_DIM]

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "data": [{"embedding": fake_vectors[0]}]
    }

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.post = AsyncMock(return_value=mock_response)

    with (
        patch("app.processing.service.get_settings") as mock_settings,
        patch("app.processing.service.httpx.AsyncClient", return_value=mock_client),
    ):
        mock_settings.return_value.together_api_key = "fake-key"
        mock_settings.return_value.together_embed_model = "BAAI/bge-base-en-v1.5"
        result = await embed(["test text"])

    assert result == fake_vectors


@pytest.mark.asyncio
async def test_embed_api_error_raises_502():
    """A 4xx response from the embedding API raises HTTPException(502)."""
    mock_response = MagicMock()
    mock_response.status_code = 429
    mock_response.text = "Rate limited"

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.post = AsyncMock(return_value=mock_response)

    with (
        patch("app.processing.service.get_settings") as mock_settings,
        patch("app.processing.service.httpx.AsyncClient", return_value=mock_client),
    ):
        mock_settings.return_value.together_api_key = "fake-key"
        mock_settings.return_value.together_embed_model = "BAAI/bge-base-en-v1.5"
        with pytest.raises(HTTPException) as exc_info:
            await embed(["text"])

    assert exc_info.value.status_code == 502


@pytest.mark.asyncio
async def test_embed_dimension_mismatch_raises_500():
    """Wrong embedding dimension in API response raises HTTPException(500)."""
    wrong_dim_vector = [0.1] * (EMBEDDING_DIM + 100)

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "data": [{"embedding": wrong_dim_vector}]
    }

    mock_client = AsyncMock()
    mock_client.__aenter__ = AsyncMock(return_value=mock_client)
    mock_client.__aexit__ = AsyncMock(return_value=False)
    mock_client.post = AsyncMock(return_value=mock_response)

    with (
        patch("app.processing.service.get_settings") as mock_settings,
        patch("app.processing.service.httpx.AsyncClient", return_value=mock_client),
    ):
        mock_settings.return_value.together_api_key = "fake-key"
        mock_settings.return_value.together_embed_model = "BAAI/bge-base-en-v1.5"
        with pytest.raises(HTTPException) as exc_info:
            await embed(["text"])

    assert exc_info.value.status_code == 500


# =============================================================================
# Unit Tests: ProcessingService.process_document
# =============================================================================


def _make_db_for_processing(doc_status: str = "ready") -> AsyncMock:
    """Return a mock AsyncSession suitable for process_document tests."""
    db = AsyncMock()

    # session.add() is synchronous in SQLAlchemy
    db.add = MagicMock()

    # scalar() returns None (no existing processing_document)
    db.scalar.return_value = None

    # execute() for update/delete statements
    db.execute.return_value = MagicMock()

    return db


@pytest.mark.asyncio
async def test_process_document_happy_path():
    """process_document() chunks, embeds, stores chunks, and returns ready status."""
    db = _make_db_for_processing()
    fake_vectors = [[0.1] * EMBEDDING_DIM] * 3  # 3 chunks

    with patch(
        "app.processing.service.embed",
        new=AsyncMock(return_value=fake_vectors),
    ):
        result = await ProcessingService.process_document(
            db=db,
            document_id=TEST_DOC_ID,
            title="Test Doc",
            text="word " * 300,  # enough text for 3 chunks at 900 chars
        )

    assert result.status == "ready"
    assert result.chunks_count > 0
    assert result.error is None
    db.commit.assert_awaited()


@pytest.mark.asyncio
async def test_process_document_empty_text_returns_error():
    """process_document() with empty text sets status='error' and returns error schema."""
    db = _make_db_for_processing()

    result = await ProcessingService.process_document(
        db=db,
        document_id=TEST_DOC_ID,
        title="Empty Doc",
        text="",
    )

    assert result.status == "error"
    assert result.chunks_count == 0
    assert result.error == "No text to process."
    db.commit.assert_awaited()


@pytest.mark.asyncio
async def test_process_document_embed_failure_re_raises():
    """process_document() propagates HTTPException from embed() after marking error."""
    db = _make_db_for_processing()

    with patch(
        "app.processing.service.embed",
        new=AsyncMock(side_effect=HTTPException(status_code=502, detail="Embedding failed.")),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await ProcessingService.process_document(
                db=db,
                document_id=TEST_DOC_ID,
                title="Doc",
                text="word " * 300,
            )

    assert exc_info.value.status_code == 502
    # DB should have been updated to error status
    db.commit.assert_awaited()


# =============================================================================
# Unit Tests: ProcessingService.rag_retrieve_multi
# =============================================================================


def _make_row(doc_id: UUID, chunk_idx: int = 0) -> dict:
    """Build a fake DB row dict as returned by rag_retrieve_multi query."""
    return {
        "id": uuid4(),
        "document_id": doc_id,
        "chunk_index": chunk_idx,
        "content": f"chunk content {chunk_idx}",
        "metadata": {},
        "embedding": [0.0] * EMBEDDING_DIM,
        "created_at": "2024-01-01T00:00:00",
    }


@pytest.mark.asyncio
async def test_rag_retrieve_multi_no_ready_docs():
    """rag_retrieve_multi() returns empty RetrieveResult when no docs are ready."""
    db = AsyncMock()

    # First execute (resolve doc IDs) returns empty
    doc_id_result = MagicMock()
    doc_id_result.all.return_value = []
    db.execute.return_value = doc_id_result

    result = await ProcessingService.rag_retrieve_multi(
        db=db,
        user_id=TEST_USER_ID,
        question="What is DNA?",
    )

    assert result.context_text == ""
    assert result.context_chunks == []


@pytest.mark.asyncio
async def test_rag_retrieve_multi_with_results():
    """rag_retrieve_multi() returns chunks when ready documents exist."""
    db = AsyncMock()
    fake_vec = [0.1] * EMBEDDING_DIM

    # First call: resolve doc IDs
    doc_id_result = MagicMock()
    doc_id_result.all.return_value = [(TEST_DOC_ID,)]

    # Second call: chunk similarity search
    row = _make_row(TEST_DOC_ID, chunk_idx=0)
    chunk_result = MagicMock()
    chunk_result.mappings.return_value.all.return_value = [row]

    # _resolve_vec_schema is patched so only 2 execute calls happen
    db.execute.side_effect = [doc_id_result, chunk_result]

    with (
        patch("app.processing.service.embed", new=AsyncMock(return_value=[fake_vec])),
        patch("app.processing.service._resolve_vec_schema", new=AsyncMock(return_value="extensions")),
    ):
        result = await ProcessingService.rag_retrieve_multi(
            db=db,
            user_id=TEST_USER_ID,
            question="What is DNA?",
        )

    assert len(result.context_chunks) == 1
    assert result.context_chunks[0].document_id == TEST_DOC_ID
    assert "chunk content 0" in result.context_text


@pytest.mark.asyncio
async def test_rag_retrieve_multi_with_folder_ids():
    """rag_retrieve_multi() filters by folder_ids when provided."""
    db = AsyncMock()
    fake_vec = [0.1] * EMBEDDING_DIM
    folder_id = UUID("00000000-0000-0000-0000-000000000003")

    doc_id_result = MagicMock()
    doc_id_result.all.return_value = [(TEST_DOC_ID,)]

    row = _make_row(TEST_DOC_ID)
    chunk_result = MagicMock()
    chunk_result.mappings.return_value.all.return_value = [row]

    db.execute.side_effect = [doc_id_result, chunk_result]

    with (
        patch("app.processing.service.embed", new=AsyncMock(return_value=[fake_vec])),
        patch("app.processing.service._resolve_vec_schema", new=AsyncMock(return_value="extensions")),
    ):
        result = await ProcessingService.rag_retrieve_multi(
            db=db,
            user_id=TEST_USER_ID,
            question="Osmosis",
            folder_ids=[folder_id],
        )

    # Two execute calls: one for ID resolution, one for similarity query
    assert db.execute.call_count == 2
    assert len(result.context_chunks) == 1


@pytest.mark.asyncio
async def test_rag_retrieve_multi_with_document_ids():
    """rag_retrieve_multi() filters by document_ids when provided."""
    db = AsyncMock()
    fake_vec = [0.1] * EMBEDDING_DIM

    doc_id_result = MagicMock()
    doc_id_result.all.return_value = [(TEST_DOC_ID,)]

    row = _make_row(TEST_DOC_ID)
    chunk_result = MagicMock()
    chunk_result.mappings.return_value.all.return_value = [row]

    db.execute.side_effect = [doc_id_result, chunk_result]

    with (
        patch("app.processing.service.embed", new=AsyncMock(return_value=[fake_vec])),
        patch("app.processing.service._resolve_vec_schema", new=AsyncMock(return_value="extensions")),
    ):
        result = await ProcessingService.rag_retrieve_multi(
            db=db,
            user_id=TEST_USER_ID,
            question="Mitosis",
            document_ids=[TEST_DOC_ID],
        )

    assert db.execute.call_count == 2
    assert len(result.context_chunks) == 1
