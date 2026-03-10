"""Chat service: conversation management and LLM streaming via Together AI SDK."""

from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import AsyncGenerator
from datetime import datetime
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from together import AsyncTogether

from app.chat.schemas import DEFAULT_MODEL, ChatRequest, ChatResponse, MessageResponse
from app.chat.tools import (
    SEARCH_TOOL_SCHEMA,
    SYSTEM_PROMPT,
    execute_search,
    parse_text_tool_call,
)
from app.core.config import get_settings
from app.core.supabase import get_supabase_client

logger = logging.getLogger(__name__)

MAX_HISTORY_MESSAGES = 20


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
        logger.info(
            "conversation created user_id=%s conversation_id=%s", user_id, conv["id"]
        )
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

    def _resolve_model(self, request: ChatRequest) -> str:
        settings = get_settings()
        return request.model or settings.together_model or DEFAULT_MODEL

    # ------------------------------------------------------------------
    # Non-streaming chat (simple, no tool calling)
    # ------------------------------------------------------------------

    async def process_chat(self, user_id: str, request: ChatRequest) -> ChatResponse:
        """Non-streaming chat — single-turn LLM call without tool calling."""
        conversation_id = request.conversation_id

        if not conversation_id:
            new_conv = await self.create_conversation(
                user_id, title=request.message[:50]
            )
            conversation_id = new_conv["id"]

        user_msg_data = {
            "conversation_id": conversation_id,
            "role": "user",
            "content": request.message,
        }
        supabase = get_supabase_client()
        await asyncio.to_thread(
            supabase.table("messages").insert(user_msg_data).execute
        )

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
        ai_res = await asyncio.to_thread(
            supabase.table("messages").insert(ai_msg_data).execute
        )
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

    # ------------------------------------------------------------------
    # Streaming chat with Together SDK tool calling
    # ------------------------------------------------------------------

    async def process_chat_stream(
        self,
        user_id: str,
        request: ChatRequest,
        db: AsyncSession,
    ) -> AsyncGenerator[str, None]:
        """Streaming chat using the Together AI SDK directly.

        Flow:
        1. Non-streaming first call with ``tools`` so the model can decide
           whether to call ``search_my_documents``.
        2. If the model returns ``tool_calls``, execute the RAG search and
           append the results to the message list.
        3. Streaming second call to produce the final text response (with
           document context already in the conversation).
        4. If the first call returned text directly (no tool call), stream
           that content to the client.

        Yields SSE-formatted events:
          - ``event: token\\ndata: <chunk>\\n\\n``  for each text token
          - ``event: done\\ndata: {json}\\n\\n``     once with final metadata
        """
        model_name = self._resolve_model(request)
        conversation_id = request.conversation_id
        ephemeral = request.ephemeral

        # 1. Create conversation if needed (skip for ephemeral chats)
        _supabase = None
        if not ephemeral:
            if not conversation_id:
                new_conv = await self.create_conversation(
                    user_id, title=request.message[:50]
                )
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

        # 3. Build messages array: system + history + user
        if not ephemeral and conversation_id:
            raw_history = await self._build_history(conversation_id)
            history_without_latest = raw_history[:-1] if raw_history else []
        else:
            history_without_latest = []

        messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
        messages.extend(history_without_latest)
        messages.append({"role": "user", "content": request.message})

        settings = get_settings()
        client = AsyncTogether(api_key=settings.together_api_key)

        logger.info(
            "chat stream started conversation_id=%s model=%s",
            conversation_id, model_name,
        )

        sources: list[dict] = []
        accumulated_text = ""

        try:
            # 4. First call: non-streaming, with tools
            first_response = await client.chat.completions.create(
                model=model_name,
                messages=messages,
                max_tokens=settings.together_max_tokens,
                temperature=settings.together_temperature,
                tools=[SEARCH_TOOL_SCHEMA],
                tool_choice="auto",
                stream=False,
            )

            choice = first_response.choices[0]
            tool_calls = getattr(choice.message, "tool_calls", None)

            # Some models emit tool calls as XML/text in content instead of
            # using the structured tool_calls field.  Detect and normalise.
            text_tool: dict | None = None
            if not tool_calls:
                text_tool = parse_text_tool_call(choice.message.content or "")

            if tool_calls:
                # 5a. Model used structured tool_calls — execute them
                logger.info(
                    "model requested %d structured tool call(s) conversation_id=%s",
                    len(tool_calls), conversation_id,
                )

                messages.append(
                    {
                        "role": "assistant",
                        "content": choice.message.content or "",
                        "tool_calls": [tc.model_dump() for tc in tool_calls],
                    }
                )

                for tc in tool_calls:
                    fn_name = tc.function.name
                    fn_args = json.loads(tc.function.arguments)

                    if fn_name == "search_my_documents":
                        context_text, call_sources = await execute_search(
                            db=db,
                            user_id=UUID(user_id),
                            query=fn_args.get("query", request.message),
                        )
                        sources.extend(call_sources)
                    else:
                        context_text = f"Unknown tool: {fn_name}"
                        logger.warning("Unknown tool call: %s", fn_name)

                    messages.append(
                        {
                            "tool_call_id": tc.id,
                            "role": "tool",
                            "name": fn_name,
                            "content": context_text,
                        }
                    )

                stream = await client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    max_tokens=settings.together_max_tokens,
                    temperature=settings.together_temperature,
                    stream=True,
                )
                async for chunk in stream:
                    if not chunk.choices:
                        continue
                    delta = chunk.choices[0].delta
                    if delta and hasattr(delta, "content") and delta.content:
                        accumulated_text += delta.content
                        yield f"event: token\ndata: {delta.content}\n\n"

            elif text_tool:
                # 5b. Model emitted a tool call as text — execute it
                logger.info(
                    "model emitted text-based tool call conversation_id=%s query=%r",
                    conversation_id, text_tool["arguments"].get("query"),
                )

                context_text, call_sources = await execute_search(
                    db=db,
                    user_id=UUID(user_id),
                    query=text_tool["arguments"].get("query", request.message),
                )
                sources.extend(call_sources)

                # Re-prompt with the retrieved context injected directly
                messages.append(
                    {
                        "role": "assistant",
                        "content": (
                            "I searched the user's documents. Here are the results."
                        ),
                    }
                )
                messages.append(
                    {
                        "role": "user",
                        "content": (
                            f"Here is the relevant content from my documents:\n\n"
                            f"{context_text}\n\n"
                            f"Now answer my original question: {request.message}"
                        ),
                    }
                )

                stream = await client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    max_tokens=settings.together_max_tokens,
                    temperature=settings.together_temperature,
                    stream=True,
                )
                async for chunk in stream:
                    if not chunk.choices:
                        continue
                    delta = chunk.choices[0].delta
                    if delta and hasattr(delta, "content") and delta.content:
                        accumulated_text += delta.content
                        yield f"event: token\ndata: {delta.content}\n\n"

            else:
                # 5c. No tool call at all — model responded with text directly.
                text = choice.message.content or ""
                accumulated_text = text
                yield f"event: token\ndata: {text}\n\n"

        except Exception as e:
            logger.exception("Chat stream error: %s", e)
            fallback = "Sorry, I'm having trouble generating a response right now. Please try again."
            accumulated_text = fallback
            yield f"event: token\ndata: {fallback}\n\n"

        logger.info(
            "chat stream completed conversation_id=%s ephemeral=%s response_len=%d sources=%d",
            conversation_id, ephemeral, len(accumulated_text), len(sources),
        )

        if ephemeral:
            # Ephemeral chats skip all DB writes — emit done with synthetic ID
            done_payload = json.dumps(
                {
                    "conversation_id": None,
                    "message": {
                        "id": f"ephemeral-{int(datetime.utcnow().timestamp() * 1000)}",
                        "role": "assistant",
                        "content": accumulated_text,
                        "created_at": datetime.utcnow().isoformat(),
                        "sources": sources,
                    },
                }
            )
            yield f"event: done\ndata: {done_payload}\n\n"
            return

        # 7. Save complete AI message
        ai_msg_data = {
            "conversation_id": conversation_id,
            "role": "assistant",
            "content": accumulated_text,
            "sources": sources,
        }
        ai_res = await asyncio.to_thread(
            _supabase.table("messages").insert(ai_msg_data).execute
        )
        ai_msg_record = ai_res.data[0]

        # 8. Update conversation timestamp
        await asyncio.to_thread(
            _supabase.table("conversations")
            .update({"updated_at": datetime.utcnow().isoformat()})
            .eq("id", conversation_id)
            .execute
        )

        # 9. Emit done event with final metadata + sources
        done_payload = json.dumps(
            {
                "conversation_id": conversation_id,
                "message": {
                    "id": ai_msg_record["id"],
                    "role": "assistant",
                    "content": ai_msg_record["content"],
                    "created_at": ai_msg_record["created_at"],
                    "sources": sources,
                },
            }
        )
        yield f"event: done\ndata: {done_payload}\n\n"
