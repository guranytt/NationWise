import json
import logging
from typing import List, Dict, Any, Optional
from app.config import settings
from app.services.llm_service import generate_chat_completion

logger = logging.getLogger(__name__)

async def analyze_candidate_profile(candidate_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generates a summary of a candidate based on their background via OpenRouter."""
    if not settings.OPENROUTER_API_KEY and not settings.GEMINI_API_KEY:
        return {"error": "LLM API key not configured"}
        
    prompt = f"""Analyze the following Nigerian political candidate based on the provided metrics and background.
Identify their key strengths, key weaknesses, and provide a 3-sentence summary of their political standing.

Candidate Data:
{json.dumps(candidate_data, indent=2)}

Format the response EXACTLY as a JSON object with:
- summary: string
- strengths: array of strings
- weaknesses: array of strings"""

    messages = [
        {"role": "system", "content": "You are an objective political analyst. Output only valid JSON."},
        {"role": "user", "content": prompt}
    ]

    try:
        content, _ = await generate_chat_completion(
            messages=messages,
            response_json=True,
            temperature=0.2,
            max_tokens=1000,
        )
        clean = content.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1]
            if clean.endswith("```"):
                clean = clean.rsplit("\n", 1)[0]
        return json.loads(clean)
    except Exception as e:
        logger.error(f"OpenRouter analysis error: {e}")
        return {"error": str(e)}

async def extract_promises(document_text: str, candidate_name: str) -> List[Dict[str, Any]]:
    """Extracts political promises from text via OpenRouter."""
    if not settings.OPENROUTER_API_KEY and not settings.GEMINI_API_KEY:
        return []
        
    prompt = f"""You are a political analyst for Nigerian politics. Read the following text and extract any specific promises, 
commitments, or policy pledges made by {candidate_name}.

For each promise, provide:
- promise_text: The specific pledge
- category: E.g., Infrastructure, Education, Healthcare, Economy, Security
- confidence: 0.0 to 1.0 score of how explicit this promise is

Text:
{document_text[:15000]}

Format the response as a JSON array of objects with keys: promise_text, category, confidence."""

    messages = [
        {"role": "system", "content": "You are a political analyst. Output only a JSON array of extracted promises."},
        {"role": "user", "content": prompt}
    ]

    try:
        content, _ = await generate_chat_completion(
            messages=messages,
            response_json=True,
            temperature=0.1,
            max_tokens=2000,
        )
        clean = content.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1]
            if clean.endswith("```"):
                clean = clean.rsplit("\n", 1)[0]
        data = json.loads(clean)
        if isinstance(data, dict) and "promises" in data:
            return data["promises"]
        if isinstance(data, list):
            return data
        return []
    except Exception as e:
        logger.error(f"OpenRouter promise extraction error: {e}")
        return []

