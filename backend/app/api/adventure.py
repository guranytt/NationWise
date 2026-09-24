import os
import hmac
import hashlib
import logging
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional, Any, Dict

from app.api.deps import get_db
from app.models.candidate import Candidate
from app.models.candidate_adventure import CandidateAdventure
from app.services.pdf_service import upload_pdf_to_supabase, extract_text_from_pdf, chunk_text, get_public_url
from app.services.embedding_service import generate_embeddings, store_embeddings
from app.services.adventure_service import generate_adventure
from app.services.pipeline_service import process_pdf_from_storage
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/adventure", tags=["Adventure"])

class AdventureSection(BaseModel):
    title: str
    content: str
    order: int

class AdventureResponse(BaseModel):
    summary: str
    sections: List[AdventureSection]
    pdf_url: Optional[str]

@router.post("/upload/{candidate_id}")
async def upload_candidate_pdf(candidate_id: UUID, file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    # 1. Verify candidate exists
    stmt = select(Candidate).where(Candidate.id == candidate_id)
    result = await db.execute(stmt)
    candidate = result.scalar_one_or_none()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    # 2. Read file bytes
    file_bytes = await file.read()
    
    # 3. Upload to Supabase
    filename = f"{candidate.id}/{file.filename}"
    pdf_url = await upload_pdf_to_supabase(file_bytes, filename)
    
    # Update candidate with PDF url
    candidate.pdf_storage_path = pdf_url
    await db.commit()
    
    # 4. Extract text & Chunk
    text = extract_text_from_pdf(file_bytes)
    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        
    chunks = chunk_text(text)
    
    # 5. Generate embeddings and store
    embeddings = await generate_embeddings(chunks)
    await store_embeddings(db, str(candidate_id), chunks, embeddings)
    
    # 6. Generate adventure narrative
    adventure = await generate_adventure(db, str(candidate_id), candidate.full_name)
    if adventure and pdf_url:
        adventure.pdf_url = pdf_url
        await db.commit()
        
    return {"status": "success", "message": f"Processed {len(chunks)} chunks and generated adventure."}

@router.get("/{candidate_id}", response_model=AdventureResponse)
async def get_candidate_adventure(candidate_id: UUID, db: AsyncSession = Depends(get_db)):
    stmt = select(CandidateAdventure).where(CandidateAdventure.candidate_id == candidate_id)
    result = await db.execute(stmt)
    adventure = result.scalar_one_or_none()
    
    if not adventure:
        raise HTTPException(status_code=404, detail="Adventure not found for this candidate")
        
    return {
        "summary": adventure.summary,
        "sections": adventure.sections,
        "pdf_url": adventure.pdf_url
    }

class ChatRequest(BaseModel):
    message: str
    
class CompareRequest(BaseModel):
    candidate_ids: List[UUID]
    question: str

from app.services.chat_service import chat_with_candidate, compare_candidates

@router.post("/chat/{candidate_id}")
async def candidate_chat(candidate_id: UUID, req: ChatRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(Candidate).where(Candidate.id == candidate_id)
    result = await db.execute(stmt)
    candidate = result.scalar_one_or_none()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
        
    response = await chat_with_candidate(db, str(candidate_id), candidate.full_name, req.message)
    return {"response": response}

@router.post("/compare")
async def candidates_compare(req: CompareRequest, db: AsyncSession = Depends(get_db)):
    if len(req.candidate_ids) < 2:
        raise HTTPException(status_code=400, detail="Provide at least 2 candidates to compare")
        
    names = []
    ids_str = []
    for cid in req.candidate_ids:
        stmt = select(Candidate).where(Candidate.id == cid)
        result = await db.execute(stmt)
        c = result.scalar_one_or_none()
        if c:
            names.append(c.full_name)
            ids_str.append(str(c.id))
            
    if len(names) < 2:
        raise HTTPException(status_code=404, detail="One or more candidates not found")
        
    response = await compare_candidates(db, ids_str, names, req.question)
    return {"response": response}


# ─────────────────────────────────────────────────────────────
# Supabase Storage Webhook — fires automatically when you
# upload a PDF via the Supabase file picker.
# 
# File naming convention:  <candidate_uuid>.pdf
# e.g.  "a3f2e1d0-…-4abc.pdf"   →  candidate is auto-resolved.
# ─────────────────────────────────────────────────────────────
@router.post("/webhook/storage", include_in_schema=True)
async def supabase_storage_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
):
    """
    Receives Supabase Storage webhook events.
    Triggered automatically on INSERT (new file upload) into the candidate-pdfs bucket.
    """
    try:
        body_bytes = await request.body()
        if not body_bytes:
            logger.warning("Empty webhook payload received.")
            return {"status": "ignored", "detail": "Empty body"}
        import json
        payload: Dict[str, Any] = json.loads(body_bytes.decode("utf-8"))
    except Exception as e:
        logger.error(f"Failed to parse webhook JSON body: {e}")
        return {"status": "error", "detail": f"Invalid JSON: {e}"}

    logger.info(f"Storage webhook received: {payload}")

    # Supabase sends the event type and record in the payload
    event_type = payload.get("type", "")
    record = payload.get("record", {})

    # We only care about INSERT events (new file uploaded)
    if event_type not in ("INSERT", ""):
        logger.info(f"Ignoring webhook event type: {event_type}")
        return {"status": "ignored"}

    # Extract the bucket and file path
    bucket_id = record.get("bucket_id", "")
    file_name = record.get("name", "")

    if bucket_id != "candidate-pdfs" or not file_name:
        # Also try top-level payload structure some Supabase versions use
        bucket_id = payload.get("bucket_id", bucket_id)
        file_name = payload.get("name", file_name)

    if not file_name:
        logger.warning(f"Could not extract file name from webhook payload: {payload}")
        return {"status": "error", "detail": "Could not parse file path from payload"}

    logger.info(f"New PDF uploaded: bucket='{bucket_id}', path='{file_name}'")

    # Run the full PDF processing pipeline in the background so we respond immediately
    background_tasks.add_task(process_pdf_from_storage, file_name)

    return {"status": "accepted", "message": f"Processing '{file_name}' in background..."}
