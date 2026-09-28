import logging
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI
from app.config import settings

logger = logging.getLogger(__name__)

_client: Optional[AsyncOpenAI] = None

def get_openrouter_client() -> Optional[AsyncOpenAI]:
    global _client
    if _client is None and settings.OPENROUTER_API_KEY:
        _client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENROUTER_API_KEY,
            default_headers={
                "HTTP-Referer": "https://nationwise.ng",
                "X-Title": "NationWise",
            }
        )
    return _client

async def generate_chat_completion(
    messages: List[Dict[str, str]],
    models: Optional[List[str]] = None,
    response_json: bool = False,
    temperature: float = 0.2,
    max_tokens: int = 4000,
) -> tuple[str, str]:
    """
    Calls OpenRouter with an ordered list of fallback models.
    Returns (response_text, model_used).
    """
    client = get_openrouter_client()
    if not client:
        raise ValueError("OPENROUTER_API_KEY not configured")

    if not models:
        models = [
            "openrouter/free",
            "google/gemma-4-31b-it:free",
            "qwen/qwen3.8-27b:free",
            "nvidia/nemotron-3-super-120b-a12b:free",
            "google/gemini-2.0-flash-001",
            "openai/gpt-4o-mini",
            "deepseek/deepseek-chat",
        ]

    last_error = None
    for model_name in models:
        try:
            logger.info(f"Generating completion via OpenRouter with model: {model_name}")
            extra_body = {}
            if response_json:
                response_format = {"type": "json_object"}
            else:
                response_format = None

            kwargs = {
                "model": model_name,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            if response_format:
                kwargs["response_format"] = response_format

            response = await client.chat.completions.create(**kwargs)
            choice = response.choices[0]
            content = choice.message.content or ""
            logger.info(f"Successfully generated completion with {model_name}")
            return content, model_name

        except Exception as e:
            last_error = e
            logger.warning(f"OpenRouter model '{model_name}' failed: {e}. Trying next fallback...")

    raise Exception(f"All OpenRouter models failed. Last error: {last_error}")
