"""RAG tool definition and execution for the StudyBudd chat flow.

Provides the ``search_my_documents`` tool schema (OpenAI-compatible format)
and an ``execute_search`` helper that runs multi-document vector retrieval
and returns context text + source attribution metadata.
"""

from __future__ import annotations

import json
import logging
import re
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.processing.service import ProcessingService

logger = logging.getLogger(__name__)

# Regex patterns for text-based tool calls that some models emit instead of
# structured tool_calls.  Covers:
#   <tool_call>search_my_documents<arg_key>query</arg_key><arg_value>…</arg_value></tool_call>
#   <tool_call>{"name": "search_my_documents", "arguments": {"query": "…"}}</tool_call>
_XML_TOOL_RE = re.compile(
    r"<tool_call>\s*search_my_documents\s*"
    r"(?:<arg_key>\s*query\s*</arg_key>\s*<arg_value>\s*(.+?)\s*</arg_value>)"
    r"\s*</tool_call>",
    re.DOTALL,
)
_JSON_TOOL_RE = re.compile(r"<tool_call>\s*(\{.*?\})\s*</tool_call>", re.DOTALL)
_GENERIC_TOOL_RE = re.compile(
    r"(?:\[TOOL_CALL\]|<function=search_my_documents>)\s*(\{.*?\})",
    re.DOTALL,
)


def parse_text_tool_call(text: str) -> dict | None:
    """Try to extract a ``search_my_documents`` call from raw model text.

    Returns ``{"name": "search_my_documents", "arguments": {"query": "…"}}``
    or *None* if no tool call was detected.
    """
    if not text:
        return None

    # Pattern 1: XML tags with <arg_key>/<arg_value>
    m = _XML_TOOL_RE.search(text)
    if m:
        query = m.group(1).strip()
        if query:
            logger.info("Parsed XML-style text tool call, query=%r", query)
            return {"name": "search_my_documents", "arguments": {"query": query}}

    # Pattern 2: JSON inside <tool_call>…</tool_call>
    m = _JSON_TOOL_RE.search(text)
    if m:
        try:
            payload = json.loads(m.group(1))
            name = payload.get("name", "search_my_documents")
            args = payload.get("arguments") or payload.get("parameters") or {}
            if isinstance(args, str):
                args = json.loads(args)
            if name == "search_my_documents" and args.get("query"):
                logger.info("Parsed JSON-in-XML text tool call, query=%r", args["query"])
                return {"name": name, "arguments": args}
        except (json.JSONDecodeError, TypeError):
            pass

    # Pattern 3: [TOOL_CALL] or <function=…> with JSON body
    m = _GENERIC_TOOL_RE.search(text)
    if m:
        try:
            payload = json.loads(m.group(1))
            query = payload.get("query")
            if query:
                logger.info("Parsed generic text tool call, query=%r", query)
                return {"name": "search_my_documents", "arguments": {"query": query}}
        except (json.JSONDecodeError, TypeError):
            pass

    return None

SYSTEM_PROMPT = """You are StudyBudd, a friendly and knowledgeable AI study assistant.

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

SEARCH_TOOL_SCHEMA: dict = {
    "type": "function",
    "function": {
        "name": "search_my_documents",
        "description": (
            "Search the user's uploaded documents for content relevant to the "
            "given query. Call this whenever the user asks about something that "
            "might be in their notes, files, readings, or uploaded study "
            'materials. Use a concise, focused query such as a topic, concept, '
            'or question (e.g. "French Revolution causes", '
            '"Newton\'s laws of motion").'
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "A clear, focused search query describing what to look for.",
                },
            },
            "required": ["query"],
            "additionalProperties": False,
        },
    },
}


async def execute_search(
    db: AsyncSession,
    user_id: UUID,
    query: str,
    folder_ids: list[UUID] | None = None,
    top_k: int = 6,
) -> tuple[str, list[dict]]:
    """Run RAG retrieval and return ``(context_text, sources)``.

    *sources* is a list of dicts with ``document_id``, ``chunk_index``, and
    ``preview`` — the same shape the frontend already expects.
    """
    logger.info("RAG search user_id=%s query=%r", user_id, query)

    retrieve = await ProcessingService.rag_retrieve_multi(
        db=db,
        user_id=user_id,
        question=query,
        top_k=top_k,
        folder_ids=folder_ids,
    )

    if not retrieve.context_chunks:
        logger.info("RAG search returned 0 chunks for query=%r", query)
        return (
            "No relevant content found in the user's documents for this query. "
            "Answer from general knowledge if appropriate.",
            [],
        )

    sources: list[dict] = []
    seen_doc_ids: set[str] = set()
    for chunk in retrieve.context_chunks:
        doc_id_str = str(chunk.document_id)
        if doc_id_str not in seen_doc_ids:
            sources.append(
                {
                    "document_id": doc_id_str,
                    "chunk_index": chunk.chunk_index,
                    "preview": chunk.content[:120],
                }
            )
            seen_doc_ids.add(doc_id_str)

    logger.info("RAG search returned %d chunks for query=%r", len(retrieve.context_chunks), query)
    return retrieve.context_text, sources
