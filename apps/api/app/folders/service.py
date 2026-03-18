"""Folder CRUD and document-to-folder assignment."""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.documents.models import Document, Folder

logger = logging.getLogger(__name__)


class FolderService:
    """Organizes documents into user-defined folders."""

    @staticmethod
    async def create(db: AsyncSession, user_id: UUID, name: str) -> Folder:
        """Create a new folder for a user."""
        folder = Folder(user_id=user_id, name=name.strip())
        db.add(folder)
        await db.commit()
        await db.refresh(folder)
        logger.info("folder created user_id=%s folder_id=%s name=%r", user_id, folder.id, folder.name)
        return folder

    @staticmethod
    async def list_by_user(db: AsyncSession, user_id: UUID) -> list[Folder]:
        result = await db.execute(
            select(Folder)
            .where(Folder.user_id == user_id)
            .order_by(Folder.name.asc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_by_id(db: AsyncSession, folder_id: UUID, user_id: UUID) -> Folder | None:
        result = await db.execute(
            select(Folder).where(
                Folder.id == folder_id,
                Folder.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def update(db: AsyncSession, folder: Folder, name: str) -> Folder:
        folder.name = name.strip()
        await db.commit()
        await db.refresh(folder)
        logger.info("folder renamed folder_id=%s name=%r", folder.id, folder.name)
        return folder

    @staticmethod
    async def delete(db: AsyncSession, folder: Folder) -> None:
        folder_id = folder.id
        await db.delete(folder)
        await db.commit()
        logger.info("folder deleted folder_id=%s", folder_id)

    @staticmethod
    async def assign_document(
        db: AsyncSession,
        document: Document,
        folder_id: UUID | None,
        user_id: UUID,
    ) -> Document:
        """Move a document into a folder (or unfile it by passing folder_id=None).

        Verifies that the target folder, if provided, belongs to the same user.
        """
        if folder_id is not None:
            folder = await FolderService.get_by_id(db, folder_id, user_id)
            if folder is None:
                raise HTTPException(status_code=404, detail="Folder not found.")

        document.folder_id = folder_id
        await db.commit()
        await db.refresh(document)
        logger.info(
            "document assigned document_id=%s folder_id=%s",
            document.id,
            folder_id,
        )
        return document

    @staticmethod
    async def list_documents_in_folder(
        db: AsyncSession,
        folder_id: UUID,
        user_id: UUID,
    ) -> list[Document]:
        result = await db.execute(
            select(Document)
            .where(Document.user_id == user_id, Document.folder_id == folder_id)
            .order_by(Document.created_at.desc())
        )
        return list(result.scalars().all())
