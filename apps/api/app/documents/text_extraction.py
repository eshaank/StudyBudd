"""Extract text from uploaded documents for RAG processing."""

import csv
import io
from typing import TYPE_CHECKING
from pypdf import PdfReader

from app.core.supabase import download_file
from app.documents.models import Document

if TYPE_CHECKING:
    pass


def extract_text_from_document(document: Document) -> str:
    """Extract text from a document (text, CSV, or PDF file).

    Args:
        document: Document entity with storage_path, file_type, mime_type.

    Returns:
        Extracted text as a string.

    Raises:
        ValueError: If file_type is not supported for text extraction.
    """
    if document.file_type not in ("text", "csv", "pdf"):
        raise ValueError(
            f"Only text and CSV documents can be processed for RAG; got file_type={document.file_type!r}"
        )

    if document.file_type == "pdf":
        content = download_file(document.storage_path)
        reader = PdfReader(io.BytesIO(content))

        pages: list[str] = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text.strip())

        return "\n\n".join(pages).strip()

    content = download_file(document.storage_path)
    raw = content.decode("utf-8-sig")

    if document.file_type == "text":
        return raw.strip()

    if document.file_type == "csv":
        reader = csv.reader(io.StringIO(raw))
        parts: list[str] = []
        for row in reader:
            parts.extend(cell.strip() for cell in row if cell.strip())
        return " ".join(parts).strip()

    return ""
