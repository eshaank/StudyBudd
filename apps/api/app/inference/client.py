"""Together AI LLM client for chat inference."""

import httpx
from app.core.config import get_settings
from .prompts import SYSTEM_PROMPT

TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions"


class LLMClient:
    """Client for Together AI chat completions API."""

    def __init__(self):
        settings = get_settings()
        self.api_key = settings.together_api_key
        self.model = settings.together_model
        self.max_tokens = settings.together_max_tokens
        self.temperature = settings.together_temperature

        if not self.api_key:
            raise ValueError(
                "TOGETHER_API_KEY is not set. "
                "Please add it to your .env file."
            )

    async def chat(
        self,
        user_message: str,
        conversation_history: list[dict] | None = None,
        system_prompt: str | None = None,
    ) -> str:
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
        messages = []

        # 1. System prompt
        messages.append({
            "role": "system",
            "content": system_prompt or SYSTEM_PROMPT,
        })

        # 2. Conversation history (if any)
        if conversation_history:
            messages.extend(conversation_history)

        # 3. Current user message
        messages.append({
            "role": "user",
            "content": user_message,
        })

        # 4. Call Together AI
        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                TOGETHER_API_URL,
                json=payload,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
            )
            response.raise_for_status()

        data = response.json()
        return data["choices"][0]["message"]["content"]


# Singleton instance
_llm_client: LLMClient | None = None


def get_llm_client() -> LLMClient:
    """Get or create the LLM client singleton."""
    global _llm_client
    if _llm_client is None:
        _llm_client = LLMClient()
    return _llm_client