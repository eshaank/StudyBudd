import logging
from typing import List

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.core.dependencies import CurrentUser, DbSession
from app.core.supabase import get_supabase_client
from .schemas import ChatRequest, ChatResponse, ConversationResponse, ConversationUpdate, MessageResponse
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
async def chat_stream(request: ChatRequest, user: CurrentUser, db: DbSession):
    """Streaming endpoint that sends tokens via Server-Sent Events.

    Uses the Pydantic AI agent which can call the ``search_my_documents`` RAG
    tool when the user asks about their uploaded files.
    """
    user_id = str(user.user_id)
    logger.info("chat stream started user_id=%s conversation_id=%s", user_id, request.conversation_id)
    return StreamingResponse(
        chat_service.process_chat_stream(user_id, request, db=db),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(user: CurrentUser):
    """Endpoint to list all conversations for the current user."""
    supabase = get_supabase_client()
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


@router.patch("/conversations/{conversation_id}")
async def update_conversation(conversation_id: str, body: ConversationUpdate, user: CurrentUser):
    """Endpoint to update a conversation (e.g. rename title)."""
    supabase = get_supabase_client()
    user_id = str(user.user_id)
    logger.debug("update_conversation user_id=%s conversation_id=%s title=%s", user_id, conversation_id, body.title)

    conv_res = (
        supabase.table("conversations")
        .select("id")
        .eq("id", conversation_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not conv_res.data:
        raise HTTPException(status_code=404, detail="Conversation not found")

    supabase.table("conversations").update({"title": body.title.strip() or "Untitled"}).eq("id", conversation_id).execute()
    return {"status": "ok"}


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, user: CurrentUser):
    """Endpoint to delete a conversation and its messages."""
    supabase = get_supabase_client()
    user_id = str(user.user_id)
    logger.debug("delete_conversation user_id=%s conversation_id=%s", user_id, conversation_id)

    # Verify ownership
    conv_res = (
        supabase.table("conversations")
        .select("id")
        .eq("id", conversation_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not conv_res.data:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Delete messages first (foreign key constraint)
    supabase.table("messages").delete().eq("conversation_id", conversation_id).execute()

    # Delete the conversation
    supabase.table("conversations").delete().eq("id", conversation_id).execute()

    return {"status": "ok"}