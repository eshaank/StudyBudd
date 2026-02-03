import os
from supabase import Client, create_client
from .schemas import ChatRequest, ChatResponse, MessageResponse
from fastapi import HTTPException
from datetime import datetime
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# --- 🔍 修复点：增强 Key 的查找逻辑 ---
url = os.environ.get("SUPABASE_URL")
# 尝试按顺序查找所有可能的 Key 变量名
key = (
    os.environ.get("SUPABASE_SERVICE_KEY") or 
    os.environ.get("SUPABASE_KEY") or 
    os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
)

if not url or not key:
    print("❌ Error: Supabase URL or KEY is missing in chat/service.py")
else:
    print("✅ Chat Service: Supabase connected.")

supabase: Client = create_client(url, key)
# -------------------------------------

class ChatService:
    """
    Service class handling core chat logic and database interactions.
    """

    async def create_conversation(self, user_id: str, title: str = "New Chat"):
        """Creates a new conversation entry in the database."""
        data = {
            "user_id": user_id,
            "title": title
        }
        res = supabase.table("conversations").insert(data).execute()
        return res.data[0]

    async def get_history(self, conversation_id: str, user_id: str):
        """Fetches message history for a specific conversation."""
        res = supabase.table("messages")\
            .select("*")\
            .eq("conversation_id", conversation_id)\
            .order("created_at")\
            .execute()
        return res.data

    async def process_chat(self, user_id: str, request: ChatRequest) -> ChatResponse:
        """
        Main logic pipeline:
        1. Create conversation if needed.
        2. Save user message.
        3. Generate AI response (Mock for now).
        4. Save AI message.
        """
        conversation_id = request.conversation_id

        # 1. If no conversation_id is provided, start a new one
        if not conversation_id:
            new_conv = await self.create_conversation(user_id, title=request.message[:30] + "...")
            conversation_id = new_conv['id']

        # 2. Save User message
        user_msg_data = {
            "conversation_id": conversation_id,
            "role": "user",
            "content": request.message
        }
        supabase.table("messages").insert(user_msg_data).execute()

        # ---------------------------------------------------------
        # TODO: RAG & AI INTEGRATION (PLACEHOLDER)
        # ---------------------------------------------------------
        ai_response_text = f"Mock Response: I received your message: '{request.message}'."
        sources = [] 
        # ---------------------------------------------------------

        # 3. Save AI message
        ai_msg_data = {
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": ai_response_text,
            "sources": sources
        }
        ai_res = supabase.table("messages").insert(ai_msg_data).execute()
        ai_msg_record = ai_res.data[0]

        return ChatResponse(
            conversation_id=conversation_id,
            message=MessageResponse(
                id=ai_msg_record['id'],
                role="assistant",
                content=ai_msg_record['content'],
                created_at=datetime.fromisoformat(ai_msg_record['created_at']),
                sources=sources
            )
        )