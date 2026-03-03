"""Pydantic AI chat agent with RAG tool for StudyBudd.

The agent is backed by Together AI (via OpenAI-compatible API) and has one
tool — ``search_my_documents`` — that the model can call when it infers the
user is asking about content in their uploaded files.  The tool runs
multi-document vector similarity retrieval and returns the relevant chunks as
context text.  The model then uses that context to generate its final reply.

Usage::

    deps = ChatDeps(user_id=user_id, db=db)
    async with study_agent.run_stream(message, deps=deps, message_history=history) as result:
        async for chunk in result.stream_text(delta=True):
            ...  # stream tokens as SSE
    sources = deps.sources  # populated by tool calls
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from uuid import UUID

from pydantic_ai import Agent, RunContext
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openai import OpenAIProvider
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.processing.service import ProcessingService

logger = logging.getLogger(__name__)

AGENT_SYSTEM_PROMPT = """You are StudyBudd, a friendly and knowledgeable AI study assistant.

Your role:
- Help students understand concepts, answer questions, and explain topics clearly.
- When relevant, break down complex ideas into simpler parts.
- Provide examples and analogies to aid understanding.
- Be encouraging and supportive in your tone.

Guidelines:
- Be concise but thorough. Avoid unnecessary filler.
- If you are unsure about something, say so honestly.
- Use markdown formatting (headings, lists, code blocks) when it improves readability.

Document search:
- You have access to the user's uploaded study materials via the `search_my_documents` tool.
- Call this tool whenever the user asks about content that might be in their notes, files,
  readings, or study materials — e.g. "what did I write about X", "summarize my notes on Y",
  or any question that sounds like it relates to their personal documents.
- Use a clear, focused search query (e.g. a topic, question, or key phrase).
- If the tool returns no relevant content, answer from general knowledge and say so.
- When referencing retrieved content, mention that it came from the user's documents.
"""


@dataclass
class ChatDeps:
    """Runtime dependencies injected into agent tool calls.

    Attributes:
        user_id: The authenticated user's ID.
        db: Async SQLAlchemy session for RAG retrieval queries.
        folder_ids: Optional list of folder IDs to scope retrieval. When None,
            all of the user's ready documents are searched.
        sources: Populated by the search tool; contains source chunk info
            (document_id, chunk_index, content preview) for display in the UI.
    """

    user_id: UUID
    db: AsyncSession
    folder_ids: list[UUID] | None = None
    sources: list[dict] = field(default_factory=list)


def _build_agent() -> Agent[ChatDeps, str]:
    """Build and return the Pydantic AI agent connected to Together AI."""
    settings = get_settings()
    model = OpenAIModel(
        settings.together_model,
        provider=OpenAIProvider(
            base_url="https://api.together.xyz/v1",
            api_key=settings.together_api_key,
        ),
    )
    agent: Agent[ChatDeps, str] = Agent(
        model,
        deps_type=ChatDeps,
        system_prompt=AGENT_SYSTEM_PROMPT,
    )

    @agent.tool
    async def search_my_documents(ctx: RunContext[ChatDeps], query: str) -> str:
        """Search the user's uploaded documents for content relevant to the given query.

        Call this whenever the user asks about something that might be in their notes,
        files, readings, or uploaded study materials.  Use a concise, focused query
        such as a topic, concept, or question (e.g. "French Revolution causes",
        "Newton's laws of motion").

        Args:
            query: A clear, focused search query describing what to look for.

        Returns:
            Relevant excerpts from the user's documents, or a message indicating
            no relevant content was found.
        """
        logger.info(
            "RAG tool called user_id=%s folder_ids=%s query=%r",
            ctx.deps.user_id,
            ctx.deps.folder_ids,
            query,
        )
        retrieve = await ProcessingService.rag_retrieve_multi(
            db=ctx.deps.db,
            user_id=ctx.deps.user_id,
            question=query,
            top_k=6,
            folder_ids=ctx.deps.folder_ids,
        )

        if not retrieve.context_chunks:
            return (
                "No relevant content found in the user's documents for this query. "
                "Answer from general knowledge if appropriate."
            )

        # Store source info on deps for inclusion in the SSE done payload
        seen_doc_ids: set[str] = {s["document_id"] for s in ctx.deps.sources}
        for chunk in retrieve.context_chunks:
            doc_id_str = str(chunk.document_id)
            if doc_id_str not in seen_doc_ids:
                ctx.deps.sources.append(
                    {
                        "document_id": doc_id_str,
                        "chunk_index": chunk.chunk_index,
                        "preview": chunk.content[:120],
                    }
                )
                seen_doc_ids.add(doc_id_str)

        logger.info(
            "RAG tool returned %d chunks for query=%r",
            len(retrieve.context_chunks),
            query,
        )
        return retrieve.context_text

    return agent


# Lazy singleton
_agent: Agent[ChatDeps, str] | None = None


def get_study_agent() -> Agent[ChatDeps, str]:
    """Return the shared StudyBudd agent (lazily initialised)."""
    global _agent
    if _agent is None:
        _agent = _build_agent()
        logger.info("StudyBudd Pydantic AI agent initialised")
    return _agent
