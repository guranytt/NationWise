import logging
import asyncio
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

async def process_pdf_from_storage(file_path: str):
    """
    Full pipeline triggered by a Supabase Storage webhook.
    
    Naming convention: Use the candidate's name as the filename.
    Examples:
        "Bola Tinubu.pdf"
        "Peter Obi.pdf"
    
    The filename (minus .pdf) is matched against candidate full_name (case-insensitive).
    Also still supports UUID-based filenames as a fallback.
    """
    logger.info(f"Webhook triggered: processing PDF at path '{file_path}'")
    
    # 1. Extract candidate name from the file path
    # Get just the filename (handles subfolders like "folder/name.pdf")
    path_parts = file_path.replace("\\", "/").split("/")
    filename = path_parts[-1]
    
    # Strip .pdf extension
    if filename.lower().endswith(".pdf"):
        candidate_lookup = filename[:-4].strip()
    else:
        candidate_lookup = filename.strip()

    if not candidate_lookup:
        logger.error(f"Empty candidate name from file path: '{file_path}'")
        return

    logger.info(f"Looking up candidate by name: '{candidate_lookup}'")

    async with AsyncSessionLocal() as db:
        # 2. Try to find candidate by name (case-insensitive)
        stmt = select(Candidate).where(
            func.lower(Candidate.full_name) == candidate_lookup.lower()
        )
        result = await db.execute(stmt)
        candidate = result.scalar_one_or_none()
        
        # Fallback: try as UUID
        if not candidate:
            try:
                from uuid import UUID
                candidate_uuid = str(UUID(candidate_lookup))
                stmt = select(Candidate).where(Candidate.id == candidate_uuid)
                result = await db.execute(stmt)
                candidate = result.scalar_one_or_none()
            except ValueError:
                pass
        
        if not candidate:
            logger.error(f"No candidate found matching '{candidate_lookup}'. Make sure the PDF filename matches the candidate's full name exactly.")
            return

        candidate_id = str(candidate.id)
        logger.info(f"Matched candidate: '{candidate.full_name}' (id={candidate_id})")

        # 3. Delete any existing chunks + adventure so we regenerate fresh
        await db.execute(
            CandidateChunk.__table__.delete().where(CandidateChunk.candidate_id == candidate_id)
        )
        await db.execute(
            CandidateAdventure.__table__.delete().where(CandidateAdventure.candidate_id == candidate_id)
        )
        await db.commit()
        logger.info(f"Cleared old adventure data for candidate '{candidate.full_name}'")

        # 4. Download the PDF from Supabase Storage
        pdf_bytes = download_pdf_from_supabase(file_path)
        if not pdf_bytes:
            logger.error(f"Failed to download PDF for candidate {candidate_id}")
            return

        # 5. Extract text and chunk
        text = extract_text_from_pdf(pdf_bytes)
        if not text.strip():
            logger.error(f"Extracted empty text from PDF for candidate {candidate_id}")
            return
        
        chunks = chunk_text(text)
        logger.info(f"Split PDF into {len(chunks)} chunks for candidate '{candidate.full_name}'")

        # 6. Generate embeddings and store
        embeddings = await generate_embeddings(chunks)
        await store_embeddings(db, candidate_id, chunks, embeddings)

        # 7. Generate and store adventure narrative
        adventure = await generate_adventure(db, candidate_id, candidate.full_name)
        if adventure:
            # Set the public URL for the PDF
            adventure.pdf_url = get_public_url(file_path)
            # Also update the candidate record
            candidate.pdf_storage_path = adventure.pdf_url
            await db.commit()
            logger.info(f"Adventure generated successfully for '{candidate.full_name}'!")
        else:
            logger.error(f"Adventure generation failed for candidate {candidate_id}")
