import json
import logging
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.config import settings
from app.models.candidate_chunk import CandidateChunk
from app.models.candidate_adventure import CandidateAdventure
from app.services.llm_service import generate_chat_completion

logger = logging.getLogger(__name__)

async def generate_adventure(session: AsyncSession, candidate_id: str, candidate_name: str) -> CandidateAdventure | None:
    """Generates the structured 'adventure' from the candidate's PDF chunks via OpenRouter."""
    if not settings.OPENROUTER_API_KEY and not settings.GEMINI_API_KEY:
        logger.error("Neither OPENROUTER_API_KEY nor GEMINI_API_KEY configured.")
        return None
        
    # Fetch all chunks for this candidate to construct the prompt
    stmt = select(CandidateChunk).where(CandidateChunk.candidate_id == candidate_id).order_by(CandidateChunk.chunk_index)
    result = await session.execute(stmt)
    chunks = result.scalars().all()
    
    if not chunks:
        logger.warning(f"No PDF chunks found for candidate {candidate_id}")
        return None
        
    full_text = "\n\n".join([c.chunk_text for c in chunks])
    full_text = full_text[:150000]
    
    prompt = f"""You are an expert political biographer and analyst. Read the following text extracted from an official document about the Nigerian political candidate {candidate_name}.

Create a structured narrative "adventure" profile of this candidate. Break it down into these specific chapters/sections if the information is present:
- Early Life & Background
- Education & Career
- Political Journey
- Key Policies & Promises
- Achievements & Track Record
- Controversies & Red Flags

Format the response EXACTLY as a valid JSON object with the following schema:
{{
  "summary": "A 1-2 paragraph executive summary.",
  "sections": [
    {{
      "title": "Section Title",
      "content": "Detailed narrative content for this section.",
      "order": 1
    }}
  ]
}}

Document Text:
{full_text}"""

    try:
        messages = [
            {"role": "system", "content": "You are an expert political biographer. Output only valid JSON."},
            {"role": "user", "content": prompt}
        ]

        models = [
            "google/gemini-2.0-flash-001",
            "openai/gpt-4o-mini",
            "meta-llama/llama-3.3-70b-instruct",
            "deepseek/deepseek-chat",
        ]

        content, model_used = await generate_chat_completion(
            messages=messages,
            models=models,
            response_json=True,
            temperature=0.2,
            max_tokens=4000,
        )

        # Clean markdown wrappers if model enclosed JSON in ```json ... ```
        clean_json = content.strip()
        if clean_json.startswith("```"):
            clean_json = clean_json.split("\n", 1)[1]
            if clean_json.endswith("```"):
                clean_json = clean_json.rsplit("\n", 1)[0]
        
        parsed = json.loads(clean_json)
        
        # Save to database
        adventure = CandidateAdventure(
            candidate_id=candidate_id,
            sections=parsed.get("sections", []),
            summary=parsed.get("summary", ""),
            model_used=model_used
        )
        session.add(adventure)
        await session.commit()
        await session.refresh(adventure)
        logger.info(f"Adventure saved successfully for {candidate_name} using {model_used}")
        return adventure
        
    except Exception as e:
        logger.error(f"Failed to generate adventure via OpenRouter: {e}")
        return None

