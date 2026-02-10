import logging
from typing import List

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.core.dependencies import CurrentUser
from .schemas import ChatRequest, ChatResponse, ConversationResponse, MessageResponse
from .service import ChatService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])
chat_service = ChatService()


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, user: CurrentUser):
    """Endpoint to send a message and get an AI response (non-streaming)."""
    user_id = str(user.user_id)
    logger.debug("chat request user_id=%s conversation_id=%s", user_id, request.conversation_id)
    try:
        response = await chat_service.process_chat(user_id, request)
        return response
    except Exception as e:
        logger.exception("chat failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream")
async def chat_stream(request: ChatRequest, user: CurrentUser):
    """Streaming endpoint that sends tokens via Server-Sent Events."""
    user_id = str(user.user_id)
    logger.info("chat stream started user_id=%s conversation_id=%s", user_id, request.conversation_id)
    return StreamingResponse(
        chat_service.process_chat_stream(user_id, request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(user: CurrentUser):
    """Endpoint to list all conversations for the current user."""
    from .service import supabase

    user_id = str(user.user_id)
    logger.debug("list_conversations user_id=%s", user_id)
    res = supabase.table("conversations").select("*").eq("user_id", user_id).order("updated_at", desc=True).execute()
    return res.data


@router.get("/conversations/{conversation_id}", response_model=List[MessageResponse])
async def get_conversation_history(conversation_id: str, user: CurrentUser):
    """Endpoint to get full message history of a specific conversation."""
    user_id = str(user.user_id)
    logger.debug("get_conversation_history user_id=%s conversation_id=%s", user_id, conversation_id)
    history = await chat_service.get_history(conversation_id, user_id)
    return history