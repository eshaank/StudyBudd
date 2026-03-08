"""Together AI LLM client for chat inference and structured generation."""

import json
import logging
from collections.abc import AsyncGenerator
from typing import Any

from together import AsyncTogether

from app.core.config import get_settings

from .prompts import SYSTEM_PROMPT

logger = logging.getLogger(__name__)

_JSON_GENERATION_MIN_TOKENS = 4096


class LLMClient:
    """Client for Together AI chat completions API."""

    def __init__(self) -> None:
        settings = get_settings()
        self.model = settings.together_model
        self.max_tokens = settings.together_max_tokens
        self.temperature = settings.together_temperature

        if not settings.together_api_key:
            raise ValueError(
                "TOGETHER_API_KEY is not set. "
                "Please add it to your .env file."
            )

        self.client = AsyncTogether(api_key=settings.together_api_key)
        logger.debug("LLM client initialized model=%s", self.model)

    async def chat(
        self,
        user_message: str,
        conversation_history: list[dict] | None = None,
        system_prompt: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """Stream chat completion tokens.

        Args:
            user_message: The latest user message.
            conversation_history: Previous messages as
                ``[{"role": ..., "content": ...}]``.
            system_prompt: Optional override for the default system prompt.

        Yields:
            Individual text tokens from the model.
        """
        messages = [{"role": "system", "content": system_prompt or SYSTEM_PROMPT}]

        if conversation_history:
            messages.extend(conversation_history)

        messages.append({"role": "user", "content": user_message})

        logger.debug("LLM request started messages_count=%d", len(messages))
        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            stream=True,
        )

        token_count = 0
        async for chunk in stream:
            if not chunk.choices or len(chunk.choices) == 0:
                continue

            delta_obj = chunk.choices[0].delta
            if delta_obj and hasattr(delta_obj, "content") and delta_obj.content:
                token_count += 1
                yield delta_obj.content
        logger.debug("LLM stream completed tokens=%d", token_count)

    async def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        *,
        max_tokens: int | None = None,
        temperature: float | None = None,
        max_retries: int = 2,
    ) -> dict[str, Any]:
        """Non-streaming call that returns parsed JSON.

        Uses ``response_format={"type": "json_object"}`` so the model is
        constrained to produce valid JSON.  If the response is truncated
        (finish_reason == "length"), it retries with more tokens before
        attempting a best-effort JSON repair.

        Args:
            system_prompt: System-level instruction (should mention JSON output).
            user_prompt: User-level content (context, topic, etc.).
            max_tokens: Override default max_tokens for this call.
            temperature: Override default temperature for this call.
            max_retries: How many times to retry on truncation.

        Returns:
            Parsed JSON dict from the model response.

        Raises:
            ValueError: If the model response is not valid JSON after retries.
        """
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        tokens = max(max_tokens or self.max_tokens, _JSON_GENERATION_MIN_TOKENS)
        temp = temperature if temperature is not None else self.temperature
        last_raw: str | None = None

        for attempt in range(1, max_retries + 2):
            logger.debug(
                "LLM JSON generation attempt=%d model=%s max_tokens=%d",
                attempt, self.model, tokens,
            )
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=tokens,
                temperature=temp,
                response_format={"type": "json_object"},
                stream=False,
            )

            last_raw = response.choices[0].message.content
            finish_reason = response.choices[0].finish_reason
            logger.debug(
                "LLM JSON generation completed length=%d finish_reason=%s",
                len(last_raw or ""), finish_reason,
            )

            try:
                return json.loads(last_raw)
            except (json.JSONDecodeError, TypeError):
                pass

            if finish_reason == "length" and attempt <= max_retries:
                tokens = int(tokens * 1.5)
                logger.warning(
                    "LLM JSON truncated (finish_reason=length), retrying with max_tokens=%d",
                    tokens,
                )
                continue

            repaired = _try_repair_json(last_raw)
            if repaired is not None:
                logger.warning("LLM JSON repaired after truncation")
                return repaired

            break

        logger.error("LLM returned invalid JSON: %s", last_raw[:300] if last_raw else None)
        raise ValueError(
            f"Model did not return valid JSON after {max_retries + 1} attempts. "
            f"Last response ({len(last_raw or '')} chars) was truncated."
        )


def _try_repair_json(raw: str | None) -> dict[str, Any] | None:
    """Best-effort repair of truncated JSON from the LLM.

    Handles the common case where the model output is cut off mid-array:
    closes any open brackets/braces so the outermost object can be parsed,
    then trims the last incomplete array element.
    """
    if not raw:
        return None

    text = raw.rstrip()
    open_braces = text.count("{") - text.count("}")
    open_brackets = text.count("[") - text.count("]")

    last_comma = text.rfind(",")
    if last_comma > 0:
        text = text[:last_comma]

    text += "]" * max(open_brackets, 0)
    text += "}" * max(open_braces, 0)

    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        return None


_llm_client: LLMClient | None = None


def get_llm_client() -> LLMClient:
    """Get or create the LLM client singleton."""
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient()
        logger.info("LLM client singleton created")
    return _llm_client
