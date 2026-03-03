"""SQLAlchemy models for the documents module."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

# =============================================================================
# Base Classes and Mixins
# =============================================================================


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""

    pass


class TimestampMixin:
    """Mixin for adding created_at and updated_at timestamps."""

    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        server_default=func.now(),
        onupdate=func.now(),
    )


class UUIDMixin:
    """Mixin for adding UUID primary key."""

    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4,
    )


# =============================================================================
# Folder Entity
# =============================================================================


class Folder(Base, UUIDMixin, TimestampMixin):
    """Entity for organizing documents into user-defined folders/tasks.

    Attributes:
        id: Unique identifier (UUID).
        user_id: ID of the user who owns this folder.
        name: Display name of the folder (e.g. "History Essay", "Math 101").
        documents: Documents assigned to this folder.
    """

    __tablename__ = "folders"

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)

    documents: Mapped[list[Document]] = relationship(
        "Document",
        back_populates="folder",
        foreign_keys="[Document.folder_id]",
    )

    def __repr__(self) -> str:
        return f"<Folder(id={self.id}, name={self.name!r}, user_id={self.user_id})>"


# =============================================================================
# Document Entity
# =============================================================================


class Document(Base, UUIDMixin, TimestampMixin):
    """Entity for storing uploaded document metadata.

    Attributes:
        id: Unique identifier (UUID).
        user_id: ID of the user who owns the document.
        folder_id: Optional folder this document belongs to (NULL = unfiled).
        filename: Generated unique filename in storage.
        original_filename: Original filename uploaded by user.
        file_type: Type category ("pdf" or "image").
        mime_type: MIME type of the file.
        file_size: Size in bytes.
        storage_path: Path in Supabase Storage.
        created_at: Timestamp when document was created.
        updated_at: Timestamp when document was last updated.
    """

    __tablename__ = "documents"

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), index=True, nullable=False
    )
    folder_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("folders.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    filename: Mapped[str] = mapped_column(String(255))
    original_filename: Mapped[str] = mapped_column(String(255))
    file_type: Mapped[str] = mapped_column(String(50))
    mime_type: Mapped[str] = mapped_column(String(100))
    file_size: Mapped[int]
    storage_path: Mapped[str] = mapped_column(String(500))

    folder: Mapped[Folder | None] = relationship(
        "Folder",
        back_populates="documents",
        foreign_keys=[folder_id],
    )
    shares: Mapped[list["DocumentShare"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        """Return string representation."""
        return f"<Document(id={self.id}, filename={self.filename}, user_id={self.user_id})>"


class DocumentShare(Base, UUIDMixin, TimestampMixin):
    """Share link metadata for a document."""

    __tablename__ = "document_shares"

    document_id: Mapped[UUID] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"),
        index=True,
    )
    owner_user_id: Mapped[UUID] = mapped_column(index=True)
    share_token: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    is_revoked: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        server_default=text("false"),
    )

    document: Mapped[Document] = relationship(back_populates="shares", lazy="joined")
    recipients: Mapped[list["DocumentShareRecipient"]] = relationship(
        back_populates="share",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class DocumentShareRecipient(Base, UUIDMixin):
    """Allowed recipient email for a share link."""

    __tablename__ = "document_share_recipients"
    __table_args__ = (
        UniqueConstraint(
            "share_id",
            "recipient_email",
            name="uq_document_share_recipients_share_email",
        ),
    )

    share_id: Mapped[UUID] = mapped_column(
        ForeignKey("document_shares.id", ondelete="CASCADE"),
        index=True,
    )
    recipient_email: Mapped[str] = mapped_column(String(320), index=True)

    share: Mapped[DocumentShare] = relationship(
        back_populates="recipients",
        lazy="joined",
    )
