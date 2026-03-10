"""Pydantic schemas for quiz endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class QuizGenerateRequest(BaseModel):
    """Request body for generating a new quiz set."""

    title: str | None = Field(None, max_length=255)
    folder_id: UUID | None = None
    document_ids: list[UUID] | None = None
    topic: str | None = Field(None, max_length=500)
    num_questions: int = Field(10, ge=3, le=30)


class QuizOptionResponse(BaseModel):
    label: str
    text: str


class QuizQuestionResponse(BaseModel):
    """A single quiz question."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    question: str
    options: list[Any]
    correct_option: str
    explanation: str | None
    position: int


class QuizSetResponse(BaseModel):
    """Full quiz set with all questions."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    title: str
    description: str | None
    folder_id: UUID | None
    document_ids: list
    questions: list[QuizQuestionResponse]
    created_at: datetime
    updated_at: datetime


class QuizSetSummary(BaseModel):
    """Lightweight summary for listing quiz sets (no questions)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str | None
    folder_id: UUID | None
    question_count: int
    created_at: datetime
