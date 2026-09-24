import logging
import asyncio
import traceback
import urllib.parse
import re
from sqlalchemy import func
from sqlalchemy.future import select
from app.database import AsyncSessionLocal
from app.models.candidate import Candidate
from app.models.candidate_adventure import CandidateAdventure
from app.models.candidate_chunk import CandidateChunk
from app.services.pdf_service import download_pdf_from_supabase, extract_text_from_pdf, chunk_text, get_public_url
from app.services.embedding_service import generate_embeddings, store_embeddings
from app.services.adventure_service import generate_adventure

logger = logging.getLogger(__name__)

def normalize_name(text: str) -> str:
    """Removes special characters and lowercases."""
    return re.sub(r'[^a-zA-Z0-9\s]', ' ', text).lower()

async def find_candidate(db, raw_lookup: str) -> Candidate | None:
    """Finds candidate by full name, partial name, or UUID."""
    # 1. Exact case-insensitive match
    stmt = select(Candidate).where(func.lower(Candidate.full_name) == raw_lookup.lower())
    res = await db.execute(stmt)
    candidate = res.scalar_one_or_none()
    if candidate:
        return candidate

    # 2. Try as UUID
    try:
        from uuid import UUID
        candidate_uuid = str(UUID(raw_lookup))
        stmt = select(Candidate).where(Candidate.id == candidate_uuid)
        res = await db.execute(stmt)
        candidate = res.scalar_one_or_none()
        if candidate:
            return candidate
    except ValueError:
        pass

    # 3. Flexible token matching (e.g. "Bola Tinubu" -> "Bola Ahmed Tinubu", "Peter Obi" -> "Peter Gregory Obi")
    lookup_norm = normalize_name(raw_lookup)
    lookup_tokens = set(lookup_norm.split())

    if lookup_tokens:
        stmt = select(Candidate)
        res = await db.execute(stmt)
        all_candidates = res.scalars().all()

        best_match = None
        best_score = 0

        for cand in all_candidates:
            cand_norm = normalize_name(cand.full_name)
            cand_tokens = set(cand_norm.split())

            # If all words in the uploaded filename exist in the candidate's name
            if lookup_tokens.issubset(cand_tokens):
                return cand

            # Alternatively, if all words in candidate name exist in uploaded filename
            if cand_tokens.issubset(lookup_tokens):
                return cand

            # Intersection score
            common = lookup_tokens.intersection(cand_tokens)
            if len(common) > best_score and len(common) >= 2:
                best_score = len(common)
                best_match = cand

        if best_match:
            return best_match

    return None

async def process_pdf_from_storage(file_path: str):
    """
    Full pipeline triggered by a Supabase Storage webhook.
    
    Naming convention: Use candidate's name as the filename (e.g., "Bola Ahmed Tinubu.pdf" or "Bola Tinubu.pdf").
    Supports URL-encoded paths (e.g., "Bola%20Ahmed%20Tinubu.pdf").
    """
    try:
        logger.info(f"Webhook triggered: processing PDF at raw path '{file_path}'")
        
        # Decode any URL encoding (%20 -> space)
        decoded_path = urllib.parse.unquote(file_path)
        logger.info(f"Decoded storage path: '{decoded_path}'")
        
        path_parts = decoded_path.replace("\\", "/").split("/")
        filename = path_parts[-1]
        
        # Strip .pdf extension
        if filename.lower().endswith(".pdf"):
            candidate_lookup = filename[:-4].strip()
        else:
            candidate_lookup = filename.strip()

        if not candidate_lookup:
            logger.error(f"Empty candidate name from file path: '{file_path}'")
            return

        logger.info(f"Looking up candidate for string: '{candidate_lookup}'")

        async with AsyncSessionLocal() as db:
            candidate = await find_candidate(db, candidate_lookup)
            
            if not candidate:
                logger.error(
                    f"No candidate found matching '{candidate_lookup}'. "
                    f"Please ensure candidate name is in the database or PDF is named after candidate."
                )
                return

            candidate_id = str(candidate.id)
            logger.info(f"Matched candidate: '{candidate.full_name}' (id={candidate_id})")

            # 1. Clear old chunks and adventure
            await db.execute(
                CandidateChunk.__table__.delete().where(CandidateChunk.candidate_id == candidate_id)
            )
            await db.execute(
                CandidateAdventure.__table__.delete().where(CandidateAdventure.candidate_id == candidate_id)
            )
            await db.commit()
            logger.info(f"Cleared old adventure data for candidate '{candidate.full_name}'")

            # 2. Download the PDF from Supabase Storage
            # Try both decoded path and raw path
            pdf_bytes = download_pdf_from_supabase(file_path)
            if not pdf_bytes and decoded_path != file_path:
                pdf_bytes = download_pdf_from_supabase(decoded_path)

            if not pdf_bytes:
                logger.error(f"Failed to download PDF '{file_path}' for candidate {candidate_id}")
                return

            # 3. Extract text
            text = extract_text_from_pdf(pdf_bytes)
            if not text.strip():
                logger.error(f"Extracted empty text from PDF for candidate '{candidate.full_name}'")
                return
            
            chunks = chunk_text(text)
            logger.info(f"Split PDF into {len(chunks)} chunks for candidate '{candidate.full_name}'")

            # 4. Generate embeddings and store
            embeddings = await generate_embeddings(chunks)
            if not embeddings:
                logger.error(f"Failed to generate embeddings for '{candidate.full_name}'")
                return

            await store_embeddings(db, candidate_id, chunks, embeddings)

            # 5. Generate and store adventure narrative
            adventure = await generate_adventure(db, candidate_id, candidate.full_name)
            if adventure:
                adventure.pdf_url = get_public_url(file_path)
                candidate.pdf_storage_path = adventure.pdf_url
                await db.commit()
                logger.info(f"Adventure generated successfully for '{candidate.full_name}'!")
            else:
                logger.error(f"Adventure generation failed for candidate '{candidate.full_name}'")

    except Exception as e:
        logger.error(f"Unhandled exception in process_pdf_from_storage: {e}\n{traceback.format_exc()}")
