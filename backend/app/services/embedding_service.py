import logging
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from google import genai
from app.config import settings
from app.models.candidate_chunk import CandidateChunk

logger = logging.getLogger(__name__)

client = None
if settings.GEMINI_API_KEY:
    client = genai.Client(api_key=settings.GEMINI_API_KEY)

async def generate_embeddings(chunks: List[str]) -> List[List[float]]:
    """Generates embeddings for a list of text chunks using Gemini."""
    if not client:
        logger.warning("GEMINI_API_KEY not configured, cannot generate embeddings.")
        return []
    
    embeddings = []
    try:
        # In genai, we use embed_content
        for chunk in chunks:
            response = await client.aio.models.embed_content(
                model="text-embedding-004",
                contents=chunk
            )
            embeddings.append(response.embeddings[0].values)
    except Exception as e:
        logger.error(f"Gemini API error generating embeddings: {e}")
    return embeddings

async def store_embeddings(session: AsyncSession, candidate_id: str, chunks: List[str], embeddings: List[List[float]]):
    """Stores text chunks and their embeddings in the database."""
    if len(chunks) != len(embeddings):
        logger.error("Mismatch between number of chunks and embeddings.")
        return
        
    for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
        new_chunk = CandidateChunk(
            candidate_id=candidate_id,
            chunk_text=chunk,
            chunk_index=i,
            embedding=emb
        )
        session.add(new_chunk)
    await session.commit()

async def search_similar_chunks(session: AsyncSession, candidate_id: str, query: str, top_k: int = 5) -> List[CandidateChunk]:
    """Searches for similar chunks for a specific candidate using vector similarity."""
    if not client:
        return []
        
    try:
        # Embed the query
        response = await client.aio.models.embed_content(
            model="text-embedding-004",
            contents=query
        )
        query_embedding = response.embeddings[0].values
        
        # We use pgvector's cosine distance operator `<=>`
        from sqlalchemy import select
        stmt = select(CandidateChunk).where(CandidateChunk.candidate_id == candidate_id).order_by(
            CandidateChunk.embedding.cosine_distance(query_embedding)
        ).limit(top_k)
        
        result = await session.execute(stmt)
        return result.scalars().all()
    except Exception as e:
        logger.error(f"Error during vector search: {e}")
        return []
