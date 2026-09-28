import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.services.embedding_service import search_similar_chunks
from app.services.llm_service import generate_chat_completion

logger = logging.getLogger(__name__)

async def chat_with_candidate(session: AsyncSession, candidate_id: str, candidate_name: str, question: str, history: Optional[List[Dict[str, str]]] = None) -> str:
    """Answers a question based on candidate's PDF chunks (RAG) via OpenRouter."""
    if not settings.OPENROUTER_API_KEY and not settings.GEMINI_API_KEY:
        return "AI chat is currently disabled."

    # 1. Retrieve context
    top_chunks = await search_similar_chunks(session, candidate_id, question, top_k=6)
    if not top_chunks:
        return f"I couldn't find any relevant information about that in {candidate_name}'s profile."

    context = "\n\n".join([c.chunk_text for c in top_chunks])

    system_prompt = f"""You are an objective political AI assistant for 'NationWise'. You are answering questions about Nigerian political candidate {candidate_name}.
Use ONLY the provided context to answer the question. If the answer is not in the context, clearly say you don't have enough information based on the candidate's documents.
Be concise, objective, and cite specific policies or statements where possible."""

    user_prompt = f"""Context:
{context}

Question: {question}"""

    messages = [{"role": "system", "content": system_prompt}]
    if history:
        for msg in history[-4:]:
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
    messages.append({"role": "user", "content": user_prompt})

    try:
        content, _ = await generate_chat_completion(
            messages=messages,
            temperature=0.3,
            max_tokens=1000,
        )
        return content
    except Exception as e:
        logger.error(f"Chat generation error: {e}")
        return "I encountered an error trying to process your request."

async def compare_candidates(session: AsyncSession, candidate_ids: List[str], candidate_names: List[str], question: str) -> str:
    """Compares candidates based on a specific question via OpenRouter."""
    if not settings.OPENROUTER_API_KEY and not settings.GEMINI_API_KEY:
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
    
    prompt = f"""You are an objective political AI assistant for 'NationWise'. Compare the candidates based on the user's topic.
Use ONLY the provided context. If a candidate's stance is missing, mention that.
Be structured, objective, and use bullet points for readability.

{combined_context}

Comparison Topic: {question}"""

    messages = [
        {"role": "system", "content": "You are an objective political comparison assistant. Output structured markdown."},
        {"role": "user", "content": prompt}
    ]

    try:
        content, _ = await generate_chat_completion(
            messages=messages,
            temperature=0.3,
            max_tokens=1500,
        )
        return content
    except Exception as e:
        logger.error(f"Comparison generation error: {e}")
        return "I encountered an error trying to process your request."

