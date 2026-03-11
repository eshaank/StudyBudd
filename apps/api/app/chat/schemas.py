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
    message: str
    conversation_id: Optional[str] = None
    model: Optional[str] = None
    ephemeral: bool = False


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime
    sources: Optional[List[Any]] = None


class ConversationResponse(BaseModel):
    id: str
    title: str
    created_at: datetime


class ConversationUpdate(BaseModel):
    title: str


class SaveMessageItem(BaseModel):
    role: str
    content: str


class SaveConversationRequest(BaseModel):
    title: str
    messages: List[SaveMessageItem]


class ChatResponse(BaseModel):
    conversation_id: str
    message: MessageResponse
