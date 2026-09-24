import json
import logging
from typing import List, Dict, Any, Optional
from google import genai
from google.genai import types
from app.config import settings

logger = logging.getLogger(__name__)

# Initialize client if API key is present
client = None
if settings.GEMINI_API_KEY:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

async def analyze_candidate_profile(candidate_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generates a summary of a candidate based on their scraped metrics and bio."""
    if not client:
        return {"error": "GEMINI_API_KEY not configured"}
        
    prompt = f"""
    Analyze the following Nigerian political candidate based on the provided metrics and background.
    Identify their key strengths, key weaknesses, and provide a 3-sentence summary of their political standing.
    
    Candidate Data:
    {json.dumps(candidate_data, indent=2)}
    
    Format the response as a JSON object with:
    - summary: string
    - strengths: array of strings
    - weaknesses: array of strings
    """
    
    try:
        response = await client.aio.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2,
            )
        )
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return {"error": str(e)}

async def extract_promises(document_text: str, candidate_name: str) -> List[Dict[str, Any]]:
    """Extracts political promises from a speech, manifesto, or article."""
    if not client:
        return []
        
    prompt = f"""
    You are a political analyst for Nigerian politics. Read the following text and extract any specific promises, 
    commitments, or policy pledges made by {candidate_name}.
    
    For each promise, provide:
    - promise_text: The specific pledge
    - category: E.g., Infrastructure, Education, Healthcare, Economy, Security
    - confidence: 0.0 to 1.0 score of how explicit this promise is
    
    Text:
    {document_text[:15000]} # Limit to avoid token overflow
    
    Format the response as a JSON array of objects.
    """
    
    try:
        response = await client.aio.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.1,
            )
        )
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"Gemini API error: {e}")
        return []
