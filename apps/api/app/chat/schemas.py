from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

AVAILABLE_MODELS = [
    "Qwen/Qwen3.5-397B-A17B",
    "zai-org/GLM-5",
    "moonshotai/Kimi-K2.5",
]

DEFAULT_MODEL = "Qwen/Qwen3.5-397B-A17B"


class ChatRequest(BaseModel):
    """Schema for the data sent by the frontend user."""

    message: str
    conversation_id: Optional[str] = None
    model: Optional[str] = None
    ephemeral: bool = False


class MessageResponse(BaseModel):
    """Schema for a single message object returned to the UI."""

    id: str
    role: str
    content: str
    created_at: datetime
    sources: Optional[List[Any]] = None


class ConversationResponse(BaseModel):
    """Schema for listing conversations in the sidebar."""

    id: str
    title: str
    created_at: datetime


class ConversationUpdate(BaseModel):
    """Schema for updating a conversation (e.g. rename)."""

    title: str


class SaveMessageItem(BaseModel):
    """A single message in a save-conversation request."""

    role: str
    content: str


class SaveConversationRequest(BaseModel):
    """Schema for saving an ephemeral Ask AI chat to a real conversation."""

    title: str
    messages: List[SaveMessageItem]


class ChatResponse(BaseModel):
    """Full response schema containing the AI answer."""

    conversation_id: str
    message: MessageResponse
