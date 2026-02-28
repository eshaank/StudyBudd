"""Tests for document upload and management endpoints."""
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException, UploadFile
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.documents.service import DocumentService
from tests.conftest import (
    TEST_DOC_ID,
    TEST_FOLDER_ID,
    TEST_USER_ID,
    make_mock_document,
    make_mock_folder,
)


# =============================================================================
# Unit Tests: DocumentService.validate_file_type
# =============================================================================


def test_validate_file_type_valid_pdf():
    """Valid PDF MIME type returns 'pdf' category."""
    file = MagicMock(spec=UploadFile)
    file.content_type = "application/pdf"
    assert DocumentService.validate_file_type(file) == "pdf"


def test_validate_file_type_valid_csv():
    """Valid CSV MIME type returns 'csv' category."""
    file = MagicMock(spec=UploadFile)
    file.content_type = "text/csv"
    assert DocumentService.validate_file_type(file) == "csv"


def test_validate_file_type_valid_image():
    """Valid PNG MIME type returns 'image' category."""
    file = MagicMock(spec=UploadFile)
    file.content_type = "image/png"
    assert DocumentService.validate_file_type(file) == "image"


def test_validate_file_type_invalid_raises_400():
    """Unsupported MIME type raises HTTPException with status 400."""
    file = MagicMock(spec=UploadFile)
    file.content_type = "application/zip"
    with pytest.raises(HTTPException) as exc_info:
        DocumentService.validate_file_type(file)
    assert exc_info.value.status_code == 400


def test_validate_file_type_no_content_type_raises_400():
    """Missing content type raises HTTPException with status 400."""
    file = MagicMock(spec=UploadFile)
    file.content_type = None
    with pytest.raises(HTTPException) as exc_info:
        DocumentService.validate_file_type(file)
    assert exc_info.value.status_code == 400


# =============================================================================
# Router Integration Tests
# =============================================================================


async def test_upload_pdf_returns_unsupported_processing(client: AsyncClient):
    """Uploading a PDF returns processing_status='unsupported'."""
    mock_doc = make_mock_document(file_type="pdf")
    with patch(
        "app.documents.router.DocumentService.upload",
        new=AsyncMock(return_value=mock_doc),
    ):
        response = await client.post(
            "/api/documents/upload",
            files={"file": ("test.pdf", b"%PDF-1.4 fake", "application/pdf")},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["processing_status"] == "unsupported"
    assert data["message"] == "Document uploaded successfully"


async def test_upload_text_file_triggers_rag(client: AsyncClient):
    """Uploading a text file triggers RAG processing and returns result."""
    mock_doc = make_mock_document(file_type="text", mime_type="text/plain")

    mock_result = MagicMock()
    mock_result.status = "ready"
    mock_result.chunks_count = 3
    mock_result.error = None

    with (
        patch(
            "app.documents.router.DocumentService.upload",
            new=AsyncMock(return_value=mock_doc),
        ),
        patch(
            "app.documents.router.ProcessingService.process_document",
            new=AsyncMock(return_value=mock_result),
        ),
        patch(
            "app.documents.router.extract_text_from_document",
            return_value="sample text",
        ),
    ):
        response = await client.post(
            "/api/documents/upload",
            files={"file": ("test.txt", b"sample text content", "text/plain")},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["processing_status"] == "ready"
    assert data["chunks_count"] == 3


async def test_upload_invalid_mime_type_returns_400(client: AsyncClient):
    """Uploading a ZIP file returns 400 Bad Request."""
    response = await client.post(
        "/api/documents/upload",
        files={"file": ("test.zip", b"PK fake zip", "application/zip")},
    )
    assert response.status_code == 400


async def test_list_documents_returns_empty(client: AsyncClient):
    """GET /api/documents returns empty list when user has no documents."""
    with patch(
        "app.documents.router.DocumentService.list_by_user",
        new=AsyncMock(return_value=[]),
    ):
        response = await client.get("/api/documents")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["documents"] == []


async def test_get_document_not_found_returns_404(client: AsyncClient):
    """GET /api/documents/{id} returns 404 when document is not found."""
    some_id = uuid4()
    with patch(
        "app.documents.router.DocumentService.get_by_id",
        new=AsyncMock(return_value=None),
    ):
        response = await client.get(f"/api/documents/{some_id}")

    assert response.status_code == 404


async def test_get_document_found_returns_200(client: AsyncClient):
    """GET /api/documents/{id} returns 200 with document data when found."""
    doc = make_mock_document()
    with patch(
        "app.documents.router.DocumentService.get_by_id",
        new=AsyncMock(return_value=doc),
    ):
        response = await client.get(f"/api/documents/{TEST_DOC_ID}")

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(TEST_DOC_ID)
    assert data["file_type"] == "pdf"


async def test_assign_document_folder_success(client: AsyncClient):
    """PATCH /api/documents/{id}/folder assigns folder and returns updated doc."""
    doc = make_mock_document(folder_id=TEST_FOLDER_ID)

    with (
        patch(
            "app.documents.router.DocumentService.get_by_id",
            new=AsyncMock(return_value=doc),
        ),
        patch(
            "app.documents.router.FolderService.assign_document",
            new=AsyncMock(return_value=doc),
        ),
    ):
        response = await client.patch(
            f"/api/documents/{TEST_DOC_ID}/folder",
            json={"folder_id": str(TEST_FOLDER_ID)},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(TEST_DOC_ID)


async def test_assign_document_folder_doc_not_found(client: AsyncClient):
    """PATCH /api/documents/{id}/folder returns 404 when document not found."""
    with patch(
        "app.documents.router.DocumentService.get_by_id",
        new=AsyncMock(return_value=None),
    ):
        response = await client.patch(
            f"/api/documents/{TEST_DOC_ID}/folder",
            json={"folder_id": str(TEST_FOLDER_ID)},
        )

    assert response.status_code == 404


async def test_delete_document_success(client: AsyncClient):
    """DELETE /api/documents/{id} returns 204 on success."""
    doc = make_mock_document()

    with (
        patch(
            "app.documents.router.DocumentService.get_by_id",
            new=AsyncMock(return_value=doc),
        ),
        patch(
            "app.documents.router.DocumentService.delete",
            new=AsyncMock(return_value=None),
        ),
    ):
        response = await client.delete(f"/api/documents/{TEST_DOC_ID}")

    assert response.status_code == 204


async def test_delete_document_not_found_returns_404(client: AsyncClient):
    """DELETE /api/documents/{id} returns 404 when document does not exist."""
    with patch(
        "app.documents.router.DocumentService.get_by_id",
        new=AsyncMock(return_value=None),
    ):
        response = await client.delete(f"/api/documents/{TEST_DOC_ID}")

    assert response.status_code == 404


async def test_list_documents_with_folder_filter(client: AsyncClient):
    """GET /api/documents?folder_id=... passes folder_id to the service."""
    doc = make_mock_document(folder_id=TEST_FOLDER_ID)

    with patch(
        "app.documents.router.DocumentService.list_by_user",
        new=AsyncMock(return_value=[doc]),
    ) as mock_list:
        response = await client.get(f"/api/documents?folder_id={TEST_FOLDER_ID}")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    # Verify folder_id was forwarded
    mock_list.assert_awaited_once()
    call_kwargs = mock_list.call_args
    assert call_kwargs.kwargs.get("folder_id") == TEST_FOLDER_ID or (
        len(call_kwargs.args) >= 3 and call_kwargs.args[2] == TEST_FOLDER_ID
    )


# =============================================================================
# Unit Tests: DocumentService (service layer)
# =============================================================================


async def test_document_service_list_by_user_no_filter():
    """list_by_user() with no folder filter queries all user documents."""
    db = AsyncMock()
    doc = make_mock_document()

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [doc]
    db.execute.return_value = mock_result

    result = await DocumentService.list_by_user(db, TEST_USER_ID)

    db.execute.assert_awaited_once()
    assert result == [doc]


async def test_document_service_list_by_user_with_folder():
    """list_by_user() with folder_id adds a WHERE clause filter."""
    db = AsyncMock()
    doc = make_mock_document(folder_id=TEST_FOLDER_ID)

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [doc]
    db.execute.return_value = mock_result

    result = await DocumentService.list_by_user(db, TEST_USER_ID, folder_id=TEST_FOLDER_ID)

    db.execute.assert_awaited_once()
    assert result == [doc]


async def test_document_service_get_by_id_found():
    """get_by_id() returns the document when it exists and belongs to the user."""
    db = AsyncMock()
    doc = make_mock_document()

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = doc
    db.execute.return_value = mock_result

    result = await DocumentService.get_by_id(db, TEST_DOC_ID, TEST_USER_ID)

    assert result is doc


async def test_document_service_get_by_id_not_found():
    """get_by_id() returns None when the document does not exist."""
    db = AsyncMock()

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    db.execute.return_value = mock_result

    result = await DocumentService.get_by_id(db, TEST_DOC_ID, TEST_USER_ID)

    assert result is None


async def test_document_service_delete_cleans_up():
    """delete() removes RAG data, calls storage deletion, and deletes from DB."""
    db = AsyncMock()
    doc = make_mock_document()
    doc.storage_path = f"user/{TEST_USER_ID}/abc123.pdf"

    with patch("app.documents.service.delete_file", return_value=True) as mock_del_file:
        await DocumentService.delete(db, doc)

    mock_del_file.assert_called_once_with(doc.storage_path)
    db.delete.assert_awaited_once_with(doc)
    db.commit.assert_awaited_once()


async def test_document_service_delete_logs_warning_on_storage_failure():
    """delete() continues even when storage deletion fails (logs warning)."""
    db = AsyncMock()
    doc = make_mock_document()

    with patch("app.documents.service.delete_file", return_value=False):
        # Should not raise
        await DocumentService.delete(db, doc)

    db.delete.assert_awaited_once_with(doc)
    db.commit.assert_awaited_once()
