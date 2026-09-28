"""
Local Adventure Generator
=========================
Processes candidate PDFs from a local folder, generates embeddings + adventure
narratives via Gemini API, and writes directly to Supabase Postgres.

Usage:
    1. Create a folder called "pdfs" next to this script
    2. Drop all candidate PDFs into it (e.g., "Bola Ahmed Tinubu.pdf")
    3. Run: python local_generate.py
    
    Or process a single candidate:
        python local_generate.py "Bola Ahmed Tinubu"
"""

import os
import sys
import json
import asyncio
import logging
import re
import uuid
from pathlib import Path
from datetime import datetime, timezone

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)

# Load .env
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent / ".env")

import fitz  # PyMuPDF
import asyncpg
from google import genai
from google.genai import types

from openai import AsyncOpenAI

# ── Config ──────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
# Use direct connection (port 5432) NOT the pooler (port 6543) — pooler drops idle connections
DB_URL = os.getenv("ALEMBIC_DATABASE_URL", "") or os.getenv("SUPABASE_DATABASE_URL", "")
# asyncpg needs postgresql:// not postgresql+asyncpg://
RAW_DB_URL = DB_URL.replace("postgresql+asyncpg://", "postgresql://")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

PDF_FOLDER = Path(__file__).parent / "pdfs"
CHUNK_SIZE = 1500
CHUNK_OVERLAP = 300

client = genai.Client(api_key=GEMINI_API_KEY)
openrouter_client = AsyncOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=OPENROUTER_API_KEY,
    default_headers={
        "HTTP-Referer": "https://nationwise.ng",
        "X-Title": "NationWise",
    }
) if OPENROUTER_API_KEY else None


# ── Helpers ─────────────────────────────────────────────────────────────────
def extract_text_from_pdf(pdf_path: Path) -> str:
    """Extract text from a local PDF file."""
    text = ""
    doc = fitz.open(str(pdf_path))
    for page in doc:
        text += page.get_text() + "\n"
    doc.close()
    return text


def chunk_text(text: str) -> list[str]:
    """Split text into overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunks.append(text[start:end])
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


def normalize_name(text: str) -> str:
    return re.sub(r'[^a-zA-Z0-9\s]', ' ', text).lower()


async def generate_embeddings(chunks: list[str]) -> list[list[float]]:
    """Generate embeddings for text chunks using Gemini."""
    all_embeddings = []
    batch_size = 10
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i:i + batch_size]
        result = await client.aio.models.embed_content(
            model="gemini-embedding-001",
            contents=batch,
            config=types.EmbedContentConfig(output_dimensionality=768),
        )
        for emb in result.embeddings:
            all_embeddings.append(emb.values)
        logger.info(f"  Embedded batch {i//batch_size + 1} ({len(batch)} chunks)")
    return all_embeddings


async def generate_adventure_text(candidate_name: str, full_text: str) -> dict | None:
    """Generate adventure JSON via OpenRouter with multiple fallback models."""
    full_text = full_text[:150000]  # Safety limit

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

    messages = [
        {"role": "system", "content": "You are an expert political biographer. Output only valid JSON."},
        {"role": "user", "content": prompt}
    ]

    models = [
        "openrouter/free",
        "google/gemma-4-31b-it:free",
        "qwen/qwen3.8-27b:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "google/gemini-2.0-flash-001",
        "openai/gpt-4o-mini",
    ]

    for model_name in models:
        try:
            logger.info(f"  Attempting generation via OpenRouter with {model_name}...")
            response = await openrouter_client.chat.completions.create(
                model=model_name,
                messages=messages,
                temperature=0.2,
                max_tokens=4000,
                response_format={"type": "json_object"},
            )
            content = response.choices[0].message.content or ""
            clean_json = content.strip()
            if clean_json.startswith("```"):
                clean_json = clean_json.split("\n", 1)[1]
                if clean_json.endswith("```"):
                    clean_json = clean_json.rsplit("\n", 1)[0]
            parsed = json.loads(clean_json)
            logger.info(f"  ✓ Successfully generated adventure with {model_name}!")
            return {**parsed, "model_used": model_name}
        except Exception as e:
            logger.warning(f"  ✗ {model_name} failed: {e}")

    logger.error("  All OpenRouter models failed")
    return None


# ── Main pipeline ───────────────────────────────────────────────────────────
async def process_candidate(pdf_path: Path, target_name: str | None = None):
    """Process a single candidate PDF end-to-end."""
    filename = pdf_path.stem  # "Bola Ahmed Tinubu"
    logger.info(f"\n{'='*60}")
    logger.info(f"Processing: {filename}")
    logger.info(f"{'='*60}")

    lookup = target_name or filename
    lookup_lower = lookup.lower().strip()

    # ── Phase 1: DB Lookup ──
    conn = await asyncpg.connect(RAW_DB_URL)
    try:
        row = await conn.fetchrow(
            "SELECT id, full_name FROM candidates WHERE LOWER(full_name) = $1",
            lookup_lower,
        )

        if not row:
            lookup_tokens = set(normalize_name(lookup).split())
            all_candidates = await conn.fetch("SELECT id, full_name FROM candidates")
            for cand in all_candidates:
                cand_tokens = set(normalize_name(cand["full_name"]).split())
                if lookup_tokens.issubset(cand_tokens) or cand_tokens.issubset(lookup_tokens):
                    row = cand
                    break
                common = lookup_tokens.intersection(cand_tokens)
                if len(common) >= 2 and not row:
                    row = cand

        if not row:
            logger.error(f"  ✗ No candidate found matching '{lookup}'. Skipping.")
            return False

        candidate_id = str(row["id"])
        candidate_name = row["full_name"]
        logger.info(f"  Matched: {candidate_name} (id={candidate_id})")

        existing = await conn.fetchrow(
            "SELECT id FROM candidate_adventures WHERE candidate_id = $1::uuid",
            candidate_id,
        )
        if existing:
            logger.info(f"  ⏭ Adventure already exists for {candidate_name}. Skipping. (Delete it first to regenerate)")
            return True
            
    finally:
        await conn.close()

    # ── Phase 2: Local AI Generation (No DB Connection active) ──
    logger.info(f"  Extracting text from PDF...")
    text = extract_text_from_pdf(pdf_path)
    if not text.strip():
        logger.error(f"  ✗ Empty text extracted. Skipping.")
        return False
    logger.info(f"  Extracted {len(text)} characters")

    chunks = chunk_text(text)
    logger.info(f"  Split into {len(chunks)} chunks")

    logger.info(f"  Generating embeddings...")
    embeddings = await generate_embeddings(chunks)
    if not embeddings or len(embeddings) != len(chunks):
        logger.error(f"  ✗ Embedding generation failed. Skipping.")
        return False

    logger.info(f"  Generating adventure narrative...")
    adventure_data = await generate_adventure_text(candidate_name, text)
    if not adventure_data:
        logger.error(f"  ✗ Adventure generation failed for {candidate_name}")
        return False

    # ── Phase 3: DB Insert ──
    conn = await asyncpg.connect(RAW_DB_URL)
    try:
        logger.info(f"  Storing {len(chunks)} chunks in database...")
        await conn.execute(
            "DELETE FROM candidate_chunks WHERE candidate_id = $1::uuid", candidate_id
        )
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            chunk_id = str(uuid.uuid4())
            emb_str = "[" + ",".join(str(v) for v in emb) + "]"
            await conn.execute(
                """
                INSERT INTO candidate_chunks (id, candidate_id, chunk_text, chunk_index, embedding, created_at)
                VALUES ($1::uuid, $2::uuid, $3, $4, $5::vector, NOW())
                """,
                chunk_id, candidate_id, chunk, i, emb_str,
            )
        logger.info(f"  ✓ Chunks stored")

        adventure_id = str(uuid.uuid4())
        pdf_url = f"{SUPABASE_URL}/storage/v1/object/public/candidate-pdfs/{pdf_path.name}"

        await conn.execute(
            """
            INSERT INTO candidate_adventures (id, candidate_id, sections, summary, pdf_url, model_used, generated_at)
            VALUES ($1::uuid, $2::uuid, $3::jsonb, $4, $5, $6, NOW())
            """,
            adventure_id,
            candidate_id,
            json.dumps(adventure_data.get("sections", [])),
            adventure_data.get("summary", ""),
            pdf_url,
            adventure_data.get("model_used", "unknown"),
        )

        await conn.execute(
            "UPDATE candidates SET pdf_storage_path = $1 WHERE id = $2::uuid",
            pdf_url, candidate_id,
        )

        logger.info(f"  ✓ Adventure stored for {candidate_name}!")
        return True
    finally:
        await conn.close()


async def main():
    # Single candidate mode
    if len(sys.argv) > 1:
        name = " ".join(sys.argv[1:])
        pdf_path = PDF_FOLDER / f"{name}.pdf"
        if not pdf_path.exists():
            for f in PDF_FOLDER.glob("*.pdf"):
                if f.stem.lower() == name.lower():
                    pdf_path = f
                    break
        if not pdf_path.exists():
            logger.error(f"PDF not found: {pdf_path}")
            logger.info(f"Available PDFs in {PDF_FOLDER}:")
            for f in PDF_FOLDER.glob("*.pdf"):
                logger.info(f"  - {f.name}")
            return
        await process_candidate(pdf_path, name)
    else:
        # Batch mode
        if not PDF_FOLDER.exists():
            PDF_FOLDER.mkdir(parents=True)
            logger.info(f"Created folder: {PDF_FOLDER}")
            logger.info(f"Drop your candidate PDFs there and re-run this script.")
            return

        pdf_files = sorted(PDF_FOLDER.glob("*.pdf"))
        if not pdf_files:
            logger.info(f"No PDFs found in {PDF_FOLDER}")
            logger.info(f"Drop candidate PDFs there (e.g., 'Bola Ahmed Tinubu.pdf') and re-run.")
            return

        logger.info(f"Found {len(pdf_files)} PDFs to process:\n")
        for f in pdf_files:
            logger.info(f"  📄 {f.name}")
        logger.info("")

        success = 0
        failed = 0
        for pdf_path in pdf_files:
            result = await process_candidate(pdf_path)
            if result is True:
                success += 1
            elif result is False:
                failed += 1

        logger.info(f"\n{'='*60}")
        logger.info(f"DONE: {success} succeeded, {failed} failed, out of {len(pdf_files)} total")
        logger.info(f"{'='*60}")


if __name__ == "__main__":
    asyncio.run(main())
