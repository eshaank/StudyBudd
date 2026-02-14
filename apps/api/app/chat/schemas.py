from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class ChatRequest(BaseModel):
    """Schema for the data sent by the frontend user."""
    message: str
    conversation_id: Optional[str] = None # If None, a new conversation will be started

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

class ChatResponse(BaseModel):
    """Full response schema containing the AI answer."""
    conversation_id: str
    message: MessageResponse
    # sources: list[SourceReference] # TODO: Add source references later