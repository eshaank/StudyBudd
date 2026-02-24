"""Tests for folder service and endpoints."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID, uuid4

import pytest
from fastapi import HTTPException
from httpx import AsyncClient

from app.folders.service import FolderService
from tests.conftest import (
    TEST_DOC_ID,
    TEST_FOLDER_ID,
    TEST_USER_ID,
    make_mock_document,
    make_mock_folder,
)

OTHER_FOLDER_ID = UUID("00000000-0000-0000-0000-000000000099")


# =============================================================================
# Unit Tests: FolderService
# =============================================================================


@pytest.mark.asyncio
async def test_create_folder_strips_whitespace():
    """create() trims whitespace from the folder name before persisting."""
    db = AsyncMock()
    db.add = MagicMock()
    db.refresh = AsyncMock(side_effect=lambda obj: None)

    # Capture the Folder passed to db.add
    added: list = []
    db.add.side_effect = lambda obj: added.append(obj)

    with patch("app.folders.service.Folder") as MockFolder:
        mock_folder_instance = make_mock_folder(name="  My Folder  ")
        MockFolder.return_value = mock_folder_instance

        result = await FolderService.create(db, TEST_USER_ID, "  My Folder  ")

    # Folder was constructed with stripped name
    MockFolder.assert_called_once_with(user_id=TEST_USER_ID, name="My Folder")
    db.add.assert_called_once()
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_list_by_user_returns_ordered_list():
    """list_by_user() executes a query and returns the scalars."""
    db = AsyncMock()
    folder1 = make_mock_folder(name="Alpha")
    folder2 = make_mock_folder(folder_id=OTHER_FOLDER_ID, name="Beta")

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [folder1, folder2]
    db.execute.return_value = mock_result

    result = await FolderService.list_by_user(db, TEST_USER_ID)

    db.execute.assert_awaited_once()
    assert result == [folder1, folder2]


@pytest.mark.asyncio
async def test_get_by_id_found():
    """get_by_id() returns the folder when it exists and is owned by the user."""
    db = AsyncMock()
    folder = make_mock_folder()

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = folder
    db.execute.return_value = mock_result

    result = await FolderService.get_by_id(db, TEST_FOLDER_ID, TEST_USER_ID)

    assert result is folder


@pytest.mark.asyncio
async def test_get_by_id_not_found():
    """get_by_id() returns None when folder doesn't exist or isn't owned."""
    db = AsyncMock()

    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    db.execute.return_value = mock_result

    result = await FolderService.get_by_id(db, TEST_FOLDER_ID, TEST_USER_ID)

    assert result is None


@pytest.mark.asyncio
async def test_update_folder_renames_and_strips():
    """update() sets stripped name, commits, and refreshes."""
    db = AsyncMock()
    folder = make_mock_folder(name="Old Name")

    result = await FolderService.update(db, folder, "  New Name  ")

    assert folder.name == "New Name"
    db.commit.assert_awaited_once()
    db.refresh.assert_awaited_once_with(folder)


@pytest.mark.asyncio
async def test_delete_folder_commits():
    """delete() removes the folder and commits."""
    db = AsyncMock()
    folder = make_mock_folder()

    await FolderService.delete(db, folder)

    db.delete.assert_awaited_once_with(folder)
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_assign_document_to_folder():
    """assign_document() sets folder_id and commits when folder is valid."""
    db = AsyncMock()
    doc = make_mock_document()
    target_folder = make_mock_folder()

    with patch.object(
        FolderService,
        "get_by_id",
        new=AsyncMock(return_value=target_folder),
    ):
        result = await FolderService.assign_document(db, doc, TEST_FOLDER_ID, TEST_USER_ID)

    assert doc.folder_id == TEST_FOLDER_ID
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_assign_document_unfile():
    """assign_document() with folder_id=None unfiles the document."""
    db = AsyncMock()
    doc = make_mock_document(folder_id=TEST_FOLDER_ID)

    result = await FolderService.assign_document(db, doc, None, TEST_USER_ID)

    assert doc.folder_id is None
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_assign_document_wrong_folder_raises_404():
    """assign_document() raises 404 when the target folder doesn't belong to the user."""
    db = AsyncMock()
    doc = make_mock_document()

    with patch.object(FolderService, "get_by_id", new=AsyncMock(return_value=None)):
        with pytest.raises(HTTPException) as exc_info:
            await FolderService.assign_document(db, doc, OTHER_FOLDER_ID, TEST_USER_ID)

    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_list_documents_in_folder():
    """list_documents_in_folder() executes and returns scalar list."""
    db = AsyncMock()
    doc = make_mock_document()

    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = [doc]
    db.execute.return_value = mock_result

    result = await FolderService.list_documents_in_folder(db, TEST_FOLDER_ID, TEST_USER_ID)

    db.execute.assert_awaited_once()
    assert result == [doc]


# =============================================================================
# Router Integration Tests
# =============================================================================


@pytest.mark.asyncio
async def test_create_folder_endpoint(client: AsyncClient):
    """POST /api/folders returns 201 with the created folder."""
    folder = make_mock_folder(name="New Folder")

    with patch(
        "app.folders.router.FolderService.create",
        new=AsyncMock(return_value=folder),
    ):
        response = await client.post("/api/folders", json={"name": "New Folder"})

    assert response.status_code == 201
    assert response.json()["name"] == "New Folder"


@pytest.mark.asyncio
async def test_list_folders_endpoint(client: AsyncClient):
    """GET /api/folders returns folder list and total."""
    folder = make_mock_folder()

    with patch(
        "app.folders.router.FolderService.list_by_user",
        new=AsyncMock(return_value=[folder]),
    ):
        response = await client.get("/api/folders")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert len(data["folders"]) == 1


@pytest.mark.asyncio
async def test_rename_folder_endpoint(client: AsyncClient):
    """PATCH /api/folders/{id} renames and returns updated folder."""
    folder = make_mock_folder()
    renamed = make_mock_folder(name="Renamed")

    with (
        patch(
            "app.folders.router.FolderService.get_by_id",
            new=AsyncMock(return_value=folder),
        ),
        patch(
            "app.folders.router.FolderService.update",
            new=AsyncMock(return_value=renamed),
        ),
    ):
        response = await client.patch(
            f"/api/folders/{TEST_FOLDER_ID}",
            json={"name": "Renamed"},
        )

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_rename_folder_not_found(client: AsyncClient):
    """PATCH /api/folders/{id} returns 404 when folder is not found."""
    with patch(
        "app.folders.router.FolderService.get_by_id",
        new=AsyncMock(return_value=None),
    ):
        response = await client.patch(
            f"/api/folders/{TEST_FOLDER_ID}",
            json={"name": "Renamed"},
        )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_folder_endpoint(client: AsyncClient):
    """DELETE /api/folders/{id} returns 204 on success."""
    folder = make_mock_folder()

    with (
        patch(
            "app.folders.router.FolderService.get_by_id",
            new=AsyncMock(return_value=folder),
        ),
        patch(
            "app.folders.router.FolderService.delete",
            new=AsyncMock(return_value=None),
        ),
    ):
        response = await client.delete(f"/api/folders/{TEST_FOLDER_ID}")

    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_folder_not_found(client: AsyncClient):
    """DELETE /api/folders/{id} returns 404 when folder is not found."""
    with patch(
        "app.folders.router.FolderService.get_by_id",
        new=AsyncMock(return_value=None),
    ):
        response = await client.delete(f"/api/folders/{TEST_FOLDER_ID}")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_folder_documents_endpoint(client: AsyncClient):
    """GET /api/folders/{id}/documents returns documents in folder."""
    folder = make_mock_folder()
    doc = make_mock_document()

    with (
        patch(
            "app.folders.router.FolderService.get_by_id",
            new=AsyncMock(return_value=folder),
        ),
        patch(
            "app.folders.router.FolderService.list_documents_in_folder",
            new=AsyncMock(return_value=[doc]),
        ),
    ):
        response = await client.get(f"/api/folders/{TEST_FOLDER_ID}/documents")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1


@pytest.mark.asyncio
async def test_list_folder_documents_folder_not_found(client: AsyncClient):
    """GET /api/folders/{id}/documents returns 404 when folder is not found."""
    with patch(
        "app.folders.router.FolderService.get_by_id",
        new=AsyncMock(return_value=None),
    ):
        response = await client.get(f"/api/folders/{TEST_FOLDER_ID}/documents")

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_assign_document_to_folder_endpoint(client: AsyncClient):
    """PATCH /api/folders/{id}/documents/{doc_id} assigns doc to folder."""
    doc = make_mock_document(folder_id=TEST_FOLDER_ID)

    with (
        patch(
            "app.folders.router.DocumentService.get_by_id",
            new=AsyncMock(return_value=doc),
        ),
        patch(
            "app.folders.router.FolderService.assign_document",
            new=AsyncMock(return_value=doc),
        ),
    ):
        response = await client.patch(
            f"/api/folders/{TEST_FOLDER_ID}/documents/{TEST_DOC_ID}"
        )

    assert response.status_code == 200


@pytest.mark.asyncio
async def test_assign_document_to_folder_doc_not_found(client: AsyncClient):
    """PATCH /api/folders/{id}/documents/{doc_id} returns 404 when doc not found."""
    with patch(
        "app.folders.router.DocumentService.get_by_id",
        new=AsyncMock(return_value=None),
    ):
        response = await client.patch(
            f"/api/folders/{TEST_FOLDER_ID}/documents/{TEST_DOC_ID}"
        )

    assert response.status_code == 404
