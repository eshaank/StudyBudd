"""Together AI LLM client for chat inference."""

import logging
from typing import AsyncGenerator

from together import AsyncTogether

from app.core.config import get_settings
from .prompts import SYSTEM_PROMPT

logger = logging.getLogger(__name__)


class LLMClient:
    """Client for Together AI chat completions API."""

    def __init__(self):
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
        """
        Send a message to Together AI and get a response.

        Args:
            user_message: The latest user message.
            conversation_history: Previous messages in
                [{"role": "user"|"assistant", "content": "..."}] format.
            system_prompt: Optional override for the system prompt.

        Returns:
            The assistant's response text.
        """
        messages = [{"role": "system", "content": system_prompt or SYSTEM_PROMPT}]

        if conversation_history:
            messages.extend(conversation_history)

        messages.append({"role": "user", "content": user_message})

        logger.debug("LLM request started messages_count=%d", len(messages))
        stream = await self.client.chat.completions.create(
            model="Qwen/Qwen3-235B-A22B-Instruct-2507-tput",
            messages=messages,
            max_tokens=self.max_tokens,
            temperature=self.temperature,
            stream=True,
        )

        token_count = 0
        async for chunk in stream:
            # Handle chunks that may not have choices or content
            if not chunk.choices or len(chunk.choices) == 0:
                continue

            delta_obj = chunk.choices[0].delta
            if delta_obj and hasattr(delta_obj, "content") and delta_obj.content:
                token_count += 1
                yield delta_obj.content
        logger.debug("LLM stream completed tokens=%d", token_count)


# Singleton instance
_llm_client: LLMClient | None = None


def get_llm_client() -> LLMClient:
    """Get or create the LLM client singleton."""
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient()
        logger.info("LLM client singleton created")
    return _llm_client
