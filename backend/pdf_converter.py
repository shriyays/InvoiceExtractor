import base64
import io


def pdf_to_base64_image(file_bytes: bytes) -> str:
    """Convert the first page of a PDF to a base64-encoded PNG string."""
    try:
        from pdf2image import convert_from_bytes
    except ImportError:
        raise RuntimeError("pdf2image is not installed. Ensure poppler-utils is available.")

    images = convert_from_bytes(file_bytes, first_page=1, last_page=1, dpi=200)
    if not images:
        raise ValueError("Could not extract any pages from the PDF.")

    img = images[0]
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode("utf-8")


def image_to_base64(file_bytes: bytes) -> str:
    """Encode raw image bytes as a base64 string."""
    return base64.b64encode(file_bytes).decode("utf-8")
