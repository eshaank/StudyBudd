"""Tests for chat service and endpoints."""
from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import HTTPException
from httpx import AsyncClient

from app.chat.service import ChatService

TEST_CONV_ID = "aaaaaaaa-0000-0000-0000-000000000001"
_NOW = datetime(2024, 1, 1, tzinfo=timezone.utc)


def _make_supabase_conv(conv_id: str = TEST_CONV_ID) -> dict:
    return {
        "id": conv_id,
        "user_id": "00000000-0000-0000-0000-000000000001",
        "title": "Test Chat",
        "created_at": _NOW.isoformat(),
        "updated_at": _NOW.isoformat(),
    }


def _make_supabase_message(role: str = "assistant", content: str = "Hello!") -> dict:
    return {
        "id": str(uuid4()),
        "conversation_id": TEST_CONV_ID,
        "role": role,
        "content": content,
        "created_at": _NOW.isoformat(),
        "sources": [],
    }


def _make_supabase_mock(conv_data: list | None = None, msg_data: list | None = None) -> MagicMock:
    """Return a mock Supabase client whose table().select()...execute() returns canned data."""
    supabase = MagicMock()
    conv_res = MagicMock()
    conv_res.data = conv_data if conv_data is not None else [_make_supabase_conv()]
    msg_res = MagicMock()
    msg_res.data = msg_data if msg_data is not None else []

    def _table_side_effect(table_name: str):
        tbl = MagicMock()
        tbl.select.return_value = tbl
        tbl.insert.return_value = tbl
        tbl.update.return_value = tbl
        tbl.delete.return_value = tbl
        tbl.eq.return_value = tbl
        tbl.order.return_value = tbl
        tbl.limit.return_value = tbl
        if table_name == "conversations":
            tbl.execute.return_value = conv_res
        else:
            tbl.execute.return_value = msg_res
        return tbl

    supabase.table.side_effect = _table_side_effect
    return supabase


# =============================================================================
# Unit Tests: ChatService.create_conversation
# =============================================================================


@pytest.mark.asyncio
async def test_create_conversation_returns_dict():
    """create_conversation inserts and returns the new conversation dict."""
    service = ChatService()
    mock_conv = _make_supabase_conv()

    supabase = _make_supabase_mock(conv_data=[mock_conv])

    with patch("app.chat.service.get_supabase_client", return_value=supabase):
        result = await service.create_conversation("user-123", title="My chat")

    assert result["id"] == TEST_CONV_ID


# =============================================================================
# Unit Tests: ChatService.get_history
# =============================================================================


@pytest.mark.asyncio
async def test_get_history_found():
    """get_history returns messages when conversation exists and is owned by user."""
    service = ChatService()
    msg = _make_supabase_message(role="user", content="Hello")
    supabase = _make_supabase_mock(conv_data=[_make_supabase_conv()], msg_data=[msg])

    with patch("app.chat.service.get_supabase_client", return_value=supabase):
        result = await service.get_history(TEST_CONV_ID, "00000000-0000-0000-0000-000000000001")

    assert len(result) == 1
    assert result[0]["content"] == "Hello"


@pytest.mark.asyncio
async def test_get_history_not_found_raises_404():
    """get_history raises 404 when conversation does not belong to the user."""
    service = ChatService()
    supabase = _make_supabase_mock(conv_data=[])

    with patch("app.chat.service.get_supabase_client", return_value=supabase):
        with pytest.raises(HTTPException) as exc_info:
            await service.get_history(TEST_CONV_ID, "00000000-0000-0000-0000-000000000001")

    assert exc_info.value.status_code == 404


# =============================================================================
# Router Integration Tests
# =============================================================================


@pytest.mark.asyncio
async def test_chat_post_new_conversation(client: AsyncClient):
    """POST /api/chat/ creates a new conversation and returns AI response."""
    ai_msg = _make_supabase_message(role="assistant", content="Sure!")

    mock_chat_response = MagicMock()
    mock_chat_response.conversation_id = TEST_CONV_ID
    mock_chat_response.message = MagicMock(
        id=ai_msg["id"],
        role="assistant",
        content="Sure!",
        created_at=_NOW,
        sources=[],
    )

    with patch(
        "app.chat.router.chat_service.process_chat",
        new=AsyncMock(return_value=mock_chat_response),
    ):
        response = await client.post(
            "/api/chat/",
            json={"message": "What is photosynthesis?"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["conversation_id"] == TEST_CONV_ID


@pytest.mark.asyncio
async def test_chat_post_existing_conversation(client: AsyncClient):
    """POST /api/chat/ uses an existing conversation_id when provided."""
    existing_id = str(uuid4())
    mock_chat_response = MagicMock()
    mock_chat_response.conversation_id = existing_id
    mock_chat_response.message = MagicMock(
        id=str(uuid4()),
        role="assistant",
        content="Good question.",
        created_at=_NOW,
        sources=[],
    )

    with patch(
        "app.chat.router.chat_service.process_chat",
        new=AsyncMock(return_value=mock_chat_response),
    ):
        response = await client.post(
            "/api/chat/",
            json={"message": "Follow up", "conversation_id": existing_id},
        )

    assert response.status_code == 200
    assert response.json()["conversation_id"] == existing_id


@pytest.mark.asyncio
async def test_list_conversations(client: AsyncClient):
    """GET /api/chat/conversations returns the user's conversation list."""
    conv = _make_supabase_conv()
    supabase = _make_supabase_mock(conv_data=[conv])

    with patch("app.chat.router.get_supabase_client", return_value=supabase):
        response = await client.get("/api/chat/conversations")

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert data[0]["id"] == TEST_CONV_ID


@pytest.mark.asyncio
async def test_get_conversation_history_found(client: AsyncClient):
    """GET /api/chat/conversations/{id} returns message list when found."""
    msg = _make_supabase_message()

    with patch(
        "app.chat.router.chat_service.get_history",
        new=AsyncMock(return_value=[msg]),
    ):
        response = await client.get(f"/api/chat/conversations/{TEST_CONV_ID}")

    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_get_conversation_history_not_found(client: AsyncClient):
    """GET /api/chat/conversations/{id} returns 404 when not found."""
    with patch(
        "app.chat.router.chat_service.get_history",
        new=AsyncMock(side_effect=HTTPException(status_code=404, detail="Conversation not found")),
    ):
        response = await client.get(f"/api/chat/conversations/{TEST_CONV_ID}")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_update_conversation_renames(client: AsyncClient):
    """PATCH /api/chat/conversations/{id} renames and returns ok."""
    conv = _make_supabase_conv()
    supabase = _make_supabase_mock(conv_data=[conv])

    with patch("app.chat.router.get_supabase_client", return_value=supabase):
        response = await client.patch(
            f"/api/chat/conversations/{TEST_CONV_ID}",
            json={"title": "Renamed Chat"},
        )

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_update_conversation_not_found(client: AsyncClient):
    """PATCH /api/chat/conversations/{id} returns 404 when conversation not found."""
    supabase = _make_supabase_mock(conv_data=[])

    with patch("app.chat.router.get_supabase_client", return_value=supabase):
        response = await client.patch(
            f"/api/chat/conversations/{TEST_CONV_ID}",
            json={"title": "Renamed"},
        )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_conversation_success(client: AsyncClient):
    """DELETE /api/chat/conversations/{id} deletes and returns ok."""
    conv = _make_supabase_conv()
    supabase = _make_supabase_mock(conv_data=[conv])

    with patch("app.chat.router.get_supabase_client", return_value=supabase):
        response = await client.delete(f"/api/chat/conversations/{TEST_CONV_ID}")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_delete_conversation_not_found(client: AsyncClient):
    """DELETE /api/chat/conversations/{id} returns 404 when not found."""
    supabase = _make_supabase_mock(conv_data=[])

    with patch("app.chat.router.get_supabase_client", return_value=supabase):
        response = await client.delete(f"/api/chat/conversations/{TEST_CONV_ID}")

    assert response.status_code == 404
