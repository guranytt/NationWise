import logging
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from google import genai
from app.config import settings
from app.services.embedding_service import search_similar_chunks

logger = logging.getLogger(__name__)

client = None
if settings.GEMINI_API_KEY:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

async def chat_with_candidate(session: AsyncSession, candidate_id: str, candidate_name: str, question: str, history: List[Dict[str, str]] = None) -> str:
    """Answers a question based on candidate's PDF chunks (RAG)."""
    if not client:
        return "AI chat is currently disabled."

    # 1. Retrieve context
    top_chunks = await search_similar_chunks(session, candidate_id, question, top_k=6)
    if not top_chunks:
        return f"I couldn't find any relevant information about that in {candidate_name}'s profile."

    context = "\n\n".join([c.chunk_text for c in top_chunks])

    # 2. Build prompt
    prompt = f"""
    You are an objective political AI assistant for 'NationWise'. You are answering questions about {candidate_name}.
    Use ONLY the following context to answer the user's question. If the answer is not in the context, say you don't have enough information on that topic based on the available documents.
    Be concise, objective, and cite specific policies or statements where possible.

    --- CONTEXT ---
    {context}
    --- END CONTEXT ---

    User Question: {question}
    """

    try:
        response = await client.aio.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )
        return response.text
    except Exception as e:
        logger.error(f"Chat generation error: {e}")
        return "I encountered an error trying to process your request."

async def compare_candidates(session: AsyncSession, candidate_ids: List[str], candidate_names: List[str], question: str) -> str:
    """Compares candidates based on a specific question."""
    if not client:
        return "AI comparison is currently disabled."
        
    contexts = []
    for cid, cname in zip(candidate_ids, candidate_names):
        top_chunks = await search_similar_chunks(session, cid, question, top_k=4)
        if top_chunks:
            chunk_text = "\n\n".join([c.chunk_text for c in top_chunks])
            contexts.append(f"--- Information for {cname} ---\n{chunk_text}")
            
    if not contexts:
        return "I couldn't find relevant information for the candidates to compare."
        
    combined_context = "\n\n".join(contexts)
    
    prompt = f"""
    You are an objective political AI assistant for 'NationWise'. Compare the candidates based on the user's topic.
    Use ONLY the provided context. If a candidate's stance is missing, mention that.
    Be structured, objective, and use bullet points for readability.

    {combined_context}

    Comparison Topic: {question}
    """

    try:
        response = await client.aio.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )
        return response.text
    except Exception as e:
        logger.error(f"Comparison generation error: {e}")
        return "I encountered an error trying to process your request."
