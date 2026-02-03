from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List, Optional
from .schemas import ChatRequest, ChatResponse, ConversationResponse, MessageResponse
from .service import ChatService

# Initialize Router
router = APIRouter(prefix="/chat", tags=["chat"])
chat_service = ChatService()

# Dependency to get User ID
# TODO: Replace with actual JWT Auth dependency in the future
async def get_current_user_id(x_user_id: Optional[str] = Header(None)):
    """
    Temporary dependency to extract user ID from headers.
    In production, this should parse the Bearer Token.
    """
    if not x_user_id:
        # You can hardcode a UUID here for testing if you don't want to send headers
        # return "test-user-uuid" 
        raise HTTPException(status_code=401, detail="User ID required for chat")
    return x_user_id

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest, user_id: str = Depends(get_current_user_id)):
    """Endpoint to send a message and get an AI response."""
    try:
        response = await chat_service.process_chat(user_id, request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations", response_model=List[ConversationResponse])
async def list_conversations(user_id: str = Depends(get_current_user_id)):
    """Endpoint to list all conversations for the current user."""
    # Importing supabase here temporarily to keep service simple
    from .service import supabase
    res = supabase.table("conversations").select("*").eq("user_id", user_id).order("updated_at", desc=True).execute()
    return res.data

@router.get("/conversations/{conversation_id}", response_model=List[MessageResponse])
async def get_conversation_history(conversation_id: str, user_id: str = Depends(get_current_user_id)):
    """Endpoint to get full message history of a specific conversation."""
    history = await chat_service.get_history(conversation_id, user_id)
    return history