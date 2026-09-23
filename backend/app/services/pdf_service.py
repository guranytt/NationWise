import fitz  # PyMuPDF
import logging
from supabase import create_client, Client
from app.config import settings

logger = logging.getLogger(__name__)

# Initialize Supabase client (singleton)
_supabase_client: Client | None = None

def get_supabase_client() -> Client | None:
    global _supabase_client
    if _supabase_client is None:
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_KEY:
            _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
    return _supabase_client

def download_pdf_from_supabase(file_path: str) -> bytes | None:
    """Downloads a PDF from Supabase Storage and returns the raw bytes."""
    client = get_supabase_client()
    if not client:
        logger.warning("Supabase client not initialized. Cannot download PDF.")
        return None
    try:
        bucket = "candidate-pdfs"
        response = client.storage.from_(bucket).download(file_path)
        return response
    except Exception as e:
        logger.error(f"Failed to download PDF '{file_path}' from Supabase: {e}")
        return None

async def upload_pdf_to_supabase(file_bytes: bytes, filename: str) -> str | None:
    """Uploads PDF to Supabase storage and returns the public URL."""
    client = get_supabase_client()
    if not client:
        logger.warning("Supabase client not initialized. Cannot upload PDF.")
        return None
    try:
        bucket = "candidate-pdfs"
        client.storage.from_(bucket).upload(
            file=file_bytes,
            path=filename,
            file_options={"content-type": "application/pdf", "upsert": "true"}
        )
        public_url = client.storage.from_(bucket).get_public_url(filename)
        return public_url
    except Exception as e:
        logger.error(f"Failed to upload PDF to Supabase: {e}")
        return None

def get_public_url(file_path: str) -> str:
    """Gets the public URL for a file already in Supabase Storage."""
    client = get_supabase_client()
    if not client:
        return ""
    return client.storage.from_("candidate-pdfs").get_public_url(file_path)

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
