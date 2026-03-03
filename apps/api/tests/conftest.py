"""Shared fixtures for StudyBudd API tests."""
import pytest
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import UUID, uuid4

from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.dependencies import get_current_user, get_db, AuthenticatedUser

TEST_USER_ID = UUID("00000000-0000-0000-0000-000000000001")
TEST_DOC_ID = UUID("00000000-0000-0000-0000-000000000002")
TEST_FOLDER_ID = UUID("00000000-0000-0000-0000-000000000003")

_NOW = datetime(2024, 1, 1, tzinfo=timezone.utc)


@pytest.fixture
def mock_user() -> AuthenticatedUser:
    return AuthenticatedUser(user_id=TEST_USER_ID, email="test@test.com")


@pytest.fixture
def mock_db() -> AsyncMock:
    db = AsyncMock()
    # session.add() is synchronous in SQLAlchemy — override so it doesn't
    # return an unawaited coroutine when called in production code.
    db.add = MagicMock()
    return db


@pytest.fixture
async def client(mock_user: AuthenticatedUser, mock_db: AsyncMock) -> AsyncClient:
    app.dependency_overrides[get_current_user] = lambda: mock_user
    app.dependency_overrides[get_db] = lambda: mock_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


def make_mock_document(
    doc_id: UUID = TEST_DOC_ID,
    user_id: UUID = TEST_USER_ID,
    file_type: str = "pdf",
    mime_type: str = "application/pdf",
    folder_id: UUID | None = None,
) -> MagicMock:
    """Return a MagicMock that satisfies DocumentResponse.model_validate."""
    doc = MagicMock()
    doc.id = doc_id
    doc.user_id = user_id
    doc.folder_id = folder_id
    doc.filename = "abc123.pdf"
    doc.original_filename = "test.pdf"
    doc.file_type = file_type
    doc.mime_type = mime_type
    doc.file_size = 1024
    doc.storage_path = f"user/{user_id}/abc123.pdf"
    doc.created_at = _NOW
    doc.updated_at = _NOW
    return doc


def make_mock_folder(
    folder_id: UUID = TEST_FOLDER_ID,
    user_id: UUID = TEST_USER_ID,
    name: str = "My Folder",
) -> MagicMock:
    """Return a MagicMock that satisfies FolderResponse.model_validate."""
    folder = MagicMock()
    folder.id = folder_id
    folder.user_id = user_id
    folder.name = name
    folder.created_at = _NOW
    folder.updated_at = _NOW
    return folder
