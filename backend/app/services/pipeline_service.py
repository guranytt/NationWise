import logging
import asyncio
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
    
    Expected file_path format: "<candidate_uuid>.pdf" or "<candidate_uuid>/<filename>.pdf"
    The candidate UUID is extracted from the first segment of the path.
    """
    logger.info(f"Webhook triggered: processing PDF at path '{file_path}'")
    
    # 1. Extract candidate UUID from the file path
    # Supports: "abc123.pdf" or "abc123/profile.pdf"
    path_parts = file_path.replace("\\", "/").split("/")
    raw_uuid = path_parts[0]
    
    # Strip extension if filename was used directly as the uuid
    if raw_uuid.endswith(".pdf"):
        raw_uuid = raw_uuid[:-4]

    try:
        from uuid import UUID
        candidate_id = str(UUID(raw_uuid))
    except ValueError:
        logger.error(f"Could not parse a valid candidate UUID from file path: '{file_path}'. Expected format: '<uuid>.pdf'")
        return

    logger.info(f"Resolved candidate_id: {candidate_id}")

    async with AsyncSessionLocal() as db:
        # 2. Verify candidate exists
        stmt = select(Candidate).where(Candidate.id == candidate_id)
        result = await db.execute(stmt)
        candidate = result.scalar_one_or_none()
        
        if not candidate:
            logger.error(f"No candidate found with id={candidate_id}")
            return

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
