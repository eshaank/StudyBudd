"""Chat service: conversation management and LLM streaming via Pydantic AI agent."""

from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import AsyncGenerator
from datetime import datetime
from uuid import UUID

from fastapi import HTTPException
from pydantic_ai.messages import ModelRequest, ModelResponse, TextPart, UserPromptPart
from sqlalchemy.ext.asyncio import AsyncSession

from app.chat.agent import ChatDeps, get_study_agent
from app.chat.schemas import ChatRequest, ChatResponse, MessageResponse
from app.core.supabase import get_supabase_client

logger = logging.getLogger(__name__)

MAX_HISTORY_MESSAGES = 20


def _history_to_model_messages(history: list[dict]) -> list[ModelRequest | ModelResponse]:
    """Convert Supabase message rows to Pydantic AI message history format."""
    messages: list[ModelRequest | ModelResponse] = []
    for msg in history:
        role = msg.get("role", "")
        content = msg.get("content", "")
        if role == "user":
            messages.append(ModelRequest(parts=[UserPromptPart(content)]))
        elif role == "assistant":
            messages.append(ModelResponse(parts=[TextPart(content)]))
    return messages


class ChatService:
    """Service class handling core chat logic and database interactions."""

    async def create_conversation(self, user_id: str, title: str = "New Chat") -> dict:
        """Create a new conversation entry in the database."""
        data = {"user_id": user_id, "title": title}
        supabase = get_supabase_client()
        res = await asyncio.to_thread(
            supabase.table("conversations").insert(data).execute
        )
        conv = res.data[0]
        logger.info("conversation created user_id=%s conversation_id=%s", user_id, conv["id"])
        return conv

    async def get_history(self, conversation_id: str, user_id: str) -> list[dict]:
        """Fetch message history for a conversation, verifying ownership."""
        supabase = get_supabase_client()
        conv_res = await asyncio.to_thread(
            supabase.table("conversations")
            .select("id")
            .eq("id", conversation_id)
            .eq("user_id", user_id)
            .execute
        )
        if not conv_res.data:
            raise HTTPException(status_code=404, detail="Conversation not found")

        res = await asyncio.to_thread(
            supabase.table("messages")
            .select("*")
            .eq("conversation_id", conversation_id)
            .order("created_at")
            .execute
        )
        return res.data

    async def _build_history(self, conversation_id: str) -> list[dict]:
        """Fetch recent messages as plain dicts (role + content)."""
        supabase = get_supabase_client()
        res = await asyncio.to_thread(
            supabase.table("messages")
            .select("role, content")
            .eq("conversation_id", conversation_id)
            .order("created_at")
            .limit(MAX_HISTORY_MESSAGES)
            .execute
        )
        return [{"role": m["role"], "content": m["content"]} for m in res.data]

    async def process_chat(self, user_id: str, request: ChatRequest) -> ChatResponse:
        """Non-streaming chat — delegates to the streaming path and collects tokens."""
        conversation_id = request.conversation_id

        if not conversation_id:
            new_conv = await self.create_conversation(user_id, title=request.message[:50])
            conversation_id = new_conv["id"]

        user_msg_data = {
            "conversation_id": conversation_id,
            "role": "user",
            "content": request.message,
        }
        supabase = get_supabase_client()
        await asyncio.to_thread(supabase.table("messages").insert(user_msg_data).execute)

        history = await self._build_history(conversation_id)
        history_without_latest = history[:-1] if history else []

        from app.inference.client import get_llm_client
        llm = get_llm_client()
        chunks: list[str] = []
        try:
            async for token in llm.chat(
                user_message=request.message,
                conversation_history=history_without_latest,
            ):
                chunks.append(token)
            ai_response_text = "".join(chunks)
        except Exception as e:
            logger.exception("LLM Error: %s", e)
            ai_response_text = "Sorry, I'm having trouble generating a response right now. Please try again."

        ai_msg_data = {
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": ai_response_text,
            "sources": [],
        }
        ai_res = await asyncio.to_thread(supabase.table("messages").insert(ai_msg_data).execute)
        ai_msg_record = ai_res.data[0]

        await asyncio.to_thread(
            supabase.table("conversations")
            .update({"updated_at": datetime.utcnow().isoformat()})
            .eq("id", conversation_id)
            .execute
        )

        return ChatResponse(
            conversation_id=conversation_id,
            message=MessageResponse(
                id=ai_msg_record["id"],
                role="assistant",
                content=ai_msg_record["content"],
                created_at=datetime.fromisoformat(ai_msg_record["created_at"]),
                sources=[],
            ),
        )

    async def process_chat_stream(
        self,
        user_id: str,
        request: ChatRequest,
        db: AsyncSession,
    ) -> AsyncGenerator[str, None]:
        """Streaming chat via the Pydantic AI agent (with RAG tool).

        Yields SSE-formatted events:
          - ``event: token\\ndata: <chunk>\\n\\n``  for each text token
          - ``event: done\\ndata: {json}\\n\\n``     once with final metadata + sources
        """
        conversation_id = request.conversation_id

        # 1. Create conversation if needed
        if not conversation_id:
            new_conv = await self.create_conversation(user_id, title=request.message[:50])
            conversation_id = new_conv["id"]

        # 2. Save user message
        _supabase = get_supabase_client()
        await asyncio.to_thread(
            _supabase.table("messages")
            .insert(
                {
                    "conversation_id": conversation_id,
                    "role": "user",
                    "content": request.message,
                }
            )
            .execute
        )

        # 3. Build history for the agent (excluding the message we just saved)
        raw_history = await self._build_history(conversation_id)
        history_without_latest = raw_history[:-1] if raw_history else []
        message_history = _history_to_model_messages(history_without_latest)

        # 4. Build agent deps
        deps = ChatDeps(
            user_id=UUID(user_id),
            db=db,
            folder_ids=None,  # search all docs by default
        )

        # 5. Stream via Pydantic AI agent
        accumulated_text = ""
        agent = get_study_agent()
        logger.debug("agent stream started conversation_id=%s user_id=%s", conversation_id, user_id)

        try:
            async with agent.run_stream(
                request.message,
                deps=deps,
                message_history=message_history,
            ) as result:
                async for chunk in result.stream_text(delta=True):
                    accumulated_text += chunk
                    yield f"event: token\ndata: {chunk}\n\n"
        except Exception as e:
            logger.exception("Agent stream error: %s", e)
            fallback = "Sorry, I'm having trouble generating a response right now. Please try again."
            accumulated_text = fallback
            yield f"event: token\ndata: {fallback}\n\n"

        logger.debug(
            "agent stream completed conversation_id=%s response_len=%d sources=%d",
            conversation_id,
            len(accumulated_text),
            len(deps.sources),
        )

        # 6. Save complete AI message (with sources if the RAG tool was called)
        ai_msg_data = {
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": accumulated_text,
            "sources": deps.sources,
        }
        ai_res = await asyncio.to_thread(
            _supabase.table("messages").insert(ai_msg_data).execute
        )
        ai_msg_record = ai_res.data[0]

        # 7. Update conversation timestamp
        await asyncio.to_thread(
            _supabase.table("conversations")
            .update({"updated_at": datetime.utcnow().isoformat()})
            .eq("id", conversation_id)
            .execute
        )

        # 8. Emit done event with final metadata + sources
        done_payload = json.dumps(
            {
                "conversation_id": conversation_id,
                "message": {
                    "id": ai_msg_record["id"],
                    "role": "assistant",
                    "content": ai_msg_record["content"],
                    "created_at": ai_msg_record["created_at"],
                    "sources": deps.sources,
                },
            }
        )
        yield f"event: done\ndata: {done_payload}\n\n"
