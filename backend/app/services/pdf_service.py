import fitz  # PyMuPDF
import io
import logging
import asyncio
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger(__name__)

# Initialize Supabase client
supabase: Client | None = None
if settings.SUPABASE_DATABASE_URL and hasattr(settings, "SUPABASE_URL") and hasattr(settings, "SUPABASE_SERVICE_KEY"):
    if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY:
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

async def upload_pdf_to_supabase(file_bytes: bytes, filename: str) -> str | None:
    """Uploads PDF to Supabase storage and returns the public URL."""
    if not supabase:
        logger.warning("Supabase client not initialized. Cannot upload PDF.")
        return None
    
    try:
        # Assuming bucket name is 'candidate-pdfs'
        bucket = "candidate-pdfs"
        response = supabase.storage.from_(bucket).upload(
            file=file_bytes,
            path=filename,
            file_options={"content-type": "application/pdf"}
        )
        # return the path or public URL
        public_url = supabase.storage.from_(bucket).get_public_url(filename)
        return public_url
    except Exception as e:
        logger.error(f"Failed to upload PDF to Supabase: {e}")
        return None

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extracts text from a PDF file using PyMuPDF."""
    text = ""
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            text += page.get_text() + "\n"
        doc.close()
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {e}")
    return text

def chunk_text(text: str, chunk_size: int = 1500, overlap: int = 300) -> list[str]:
    """Splits text into overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks
