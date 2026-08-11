"""
LILO Voice Assistant — OpenAI LLM Service

Factory for creating an OpenAILLMService configured to use OpenAI
as the backend. This uses the original OpenAI models (e.g., gpt-4o-mini).

Requires:
    - OPENAI_API_KEY environment variable
    - pip install "pipecat-ai[openai]"
"""

from pipecat.services.openai.llm import OpenAILLMService

from config.settings import (
    OPENAI_API_KEY,
)


def create_llm_service() -> OpenAILLMService:
    """
    Creates and returns an OpenAI LLM service pointed at the official API.

    Configuration:
    - model: gpt-4o-mini (fast, affordable)
    - Streaming enabled by default via Pipecat
    """
    llm = OpenAILLMService(
        api_key=OPENAI_API_KEY,
        # base_url is removed so it automatically routes to OpenAI's native API
        settings=OpenAILLMService.Settings(
            model="gpt-4o-mini",
        ),
    )

    return llm