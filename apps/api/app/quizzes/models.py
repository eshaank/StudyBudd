"""SQLAlchemy models for quiz sets and questions."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.models import Base, TimestampMixin, UUIDMixin


class QuizSet(Base, UUIDMixin, TimestampMixin):
    """A named quiz generated from user documents."""

    __tablename__ = "quiz_sets"

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

    questions: Mapped[list[QuizQuestion]] = relationship(
        "QuizQuestion",
        back_populates="quiz_set",
        cascade="all, delete-orphan",
        order_by="QuizQuestion.position",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<QuizSet(id={self.id}, title={self.title!r})>"


class QuizQuestion(Base, UUIDMixin):
    """A single multiple-choice question belonging to a QuizSet."""

    __tablename__ = "quiz_questions"

    set_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("quiz_sets.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[list] = mapped_column(JSONB, nullable=False)
    correct_option: Mapped[str] = mapped_column(String(10), nullable=False)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0)

    quiz_set: Mapped[QuizSet] = relationship("QuizSet", back_populates="questions")

    def __repr__(self) -> str:
        return f"<QuizQuestion(id={self.id}, question={self.question[:30]!r})>"
