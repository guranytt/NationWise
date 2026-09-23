import json
import logging
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from google import genai
from google.genai import types
from app.config import settings
from app.models.candidate_chunk import CandidateChunk
from app.models.candidate_adventure import CandidateAdventure

logger = logging.getLogger(__name__)

client = None
if settings.GEMINI_API_KEY:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

async def generate_adventure(session: AsyncSession, candidate_id: str, candidate_name: str) -> CandidateAdventure | None:
    """Generates the structured 'adventure' from the candidate's PDF chunks."""
    if not client:
        logger.error("GEMINI_API_KEY not configured.")
        return None
        
    # Fetch all chunks for this candidate to construct the prompt
    stmt = select(CandidateChunk).where(CandidateChunk.candidate_id == candidate_id).order_by(CandidateChunk.chunk_index)
    result = await session.execute(stmt)
    chunks = result.scalars().all()
    
    if not chunks:
        logger.warning(f"No PDF chunks found for candidate {candidate_id}")
        return None
        
    # Concatenate text (be mindful of token limits, maybe just take the first N chunks or a sample)
    full_text = "\n\n".join([c.chunk_text for c in chunks])
    # Limit text to ~250k chars for safety (Gemini 2.0 Flash has 1M token context, so this is very safe)
    full_text = full_text[:300000]
    
    prompt = f"""
    You are an expert political biographer and analyst. Read the following text extracted from a document about the Nigerian political candidate {candidate_name}.
    
    Create a structured narrative "adventure" profile of this candidate. Break it down into these specific chapters/sections if the information is present:
    - Early Life & Background
    - Education & Career
    - Political Journey
    - Key Policies & Promises
    - Achievements & Track Record
    - Controversies & Red Flags
    
    You may add additional relevant sections if you find important information that doesn't fit the above.
    
    Format the response EXACTLY as a JSON object with:
    - summary: A 1-2 paragraph executive summary.
    - sections: An array of objects, each containing:
        - title: The section title
        - content: Detailed narrative content for this section
        - order: Integer indicating the logical order
        
    Document Text:
    {full_text}
    """
    
    try:
        response = await client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            )
        )
        
        parsed = json.loads(response.text)
        
        # Save to database
        adventure = CandidateAdventure(
            candidate_id=candidate_id,
            sections=parsed.get("sections", []),
            summary=parsed.get("summary", ""),
            model_used="gemini-2.0-flash"
        )
        session.add(adventure)
        await session.commit()
        await session.refresh(adventure)
        return adventure
        
    except Exception as e:
        logger.error(f"Failed to generate adventure: {e}")
        return None
