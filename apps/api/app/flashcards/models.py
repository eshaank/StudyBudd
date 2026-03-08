"""SQLAlchemy models for flashcard sets and individual cards."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.models import Base, TimestampMixin, UUIDMixin


class FlashcardSet(Base, UUIDMixin, TimestampMixin):
    """A named collection of flashcards generated from user documents."""

    __tablename__ = "flashcard_sets"

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    folder_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("folders.id", ondelete="SET NULL"),
        nullable=True,
    )
    document_ids: Mapped[list] = mapped_column(JSONB, default=list)
    source_chunks: Mapped[list] = mapped_column(JSONB, default=list, nullable=False)

    cards: Mapped[list[Flashcard]] = relationship(
        "Flashcard",
        back_populates="flashcard_set",
        cascade="all, delete-orphan",
        order_by="Flashcard.position",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<FlashcardSet(id={self.id}, title={self.title!r})>"


class Flashcard(Base, UUIDMixin):
    """A single flashcard belonging to a FlashcardSet."""

    __tablename__ = "flashcards"

    set_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("flashcard_sets.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    front: Mapped[str] = mapped_column(Text, nullable=False)
    back: Mapped[str] = mapped_column(Text, nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0)

    flashcard_set: Mapped[FlashcardSet] = relationship(
        "FlashcardSet", back_populates="cards"
    )

    def __repr__(self) -> str:
        return f"<Flashcard(id={self.id}, front={self.front[:30]!r})>"
