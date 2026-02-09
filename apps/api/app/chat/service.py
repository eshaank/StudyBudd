import os
from supabase import Client, create_client
from .schemas import ChatRequest, ChatResponse, MessageResponse
from fastapi import HTTPException
from datetime import datetime
from dotenv import load_dotenv

# Load env
load_dotenv()

# --- Supabase Setup ---
url = os.environ.get("SUPABASE_URL")
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

# --- LLM Client (lazy init) ---
_llm = None

def _get_llm():
    global _llm
    if _llm is None:
        from app.inference.client import get_llm_client
        _llm = get_llm_client()
    return _llm

# Max history messages to include for context (to stay within token limits)
MAX_HISTORY_MESSAGES = 20


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

    def _build_history(self, conversation_id: str) -> list[dict]:
        """
        Fetch recent messages and convert to the format expected by the LLM:
        [{"role": "user"|"assistant", "content": "..."}]
        """
        res = supabase.table("messages")\
            .select("role, content")\
            .eq("conversation_id", conversation_id)\
            .order("created_at")\
            .limit(MAX_HISTORY_MESSAGES)\
            .execute()

        return [
            {"role": msg["role"], "content": msg["content"]}
            for msg in res.data
        ]

    async def process_chat(self, user_id: str, request: ChatRequest) -> ChatResponse:
        """
        Main logic pipeline:
        1. Create conversation if needed.
        2. Save user message.
        3. Fetch conversation history for context.
        4. Call Together AI for a response.
        5. Save AI message.
        """
        conversation_id = request.conversation_id

        # 1. If no conversation_id is provided, start a new one
        if not conversation_id:
            new_conv = await self.create_conversation(
                user_id, title=request.message[:50]
            )
            conversation_id = new_conv['id']

        # 2. Save User message
        user_msg_data = {
            "conversation_id": conversation_id,
            "role": "user",
            "content": request.message
        }
        supabase.table("messages").insert(user_msg_data).execute()

        # 3. Build conversation history (all saved messages so far, including the one we just inserted)
        history = self._build_history(conversation_id)

        # 4. Call Together AI
        #    We pass history WITHOUT the latest user msg, because the client appends it.
        #    History already includes the user message we just saved, so pop it off.
        history_without_latest = history[:-1] if history else []

        try:
            llm = _get_llm()
            ai_response_text = await llm.chat(
                user_message=request.message,
                conversation_history=history_without_latest,
            )
        except Exception as e:
            print(f"LLM Error: {e}")
            ai_response_text = "Sorry, I'm having trouble generating a response right now. Please try again."

        sources = []

        # 5. Save AI message
        ai_msg_data = {
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": ai_response_text,
            "sources": sources
        }
        ai_res = supabase.table("messages").insert(ai_msg_data).execute()
        ai_msg_record = ai_res.data[0]

        # 6. Update conversation timestamp
        supabase.table("conversations")\
            .update({"updated_at": datetime.utcnow().isoformat()})\
            .eq("id", conversation_id)\
            .execute()

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
