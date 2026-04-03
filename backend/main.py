import hashlib
import time
import os

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from models import InvoiceData
from extractor import extract_invoice_data
from cache import get_cached, set_cached, add_to_history, get_history, ping
from pdf_converter import pdf_to_base64_image, image_to_base64

app = FastAPI(title="InvoiceIQ API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@app.post("/extract", response_model=InvoiceData)
async def extract(file: UploadFile = File(...)):
    content_type = file.content_type or ""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{content_type}'. Accepted: jpg, jpeg, png, pdf.",
        )

    contents = await file.read()

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 10 MB limit.")

    cache_key = hashlib.md5(contents).hexdigest()

    cached_result = await get_cached(cache_key)
    if cached_result:
        cached_result["cached"] = True
        return InvoiceData(**cached_result)

    start_time = time.time()

    if content_type == "application/pdf":
        image_b64 = pdf_to_base64_image(contents)
        media_type = "image/png"
    else:
        image_b64 = image_to_base64(contents)
        # Normalise jpg → jpeg for Anthropic API
        media_type = "image/jpeg" if content_type in ("image/jpg", "image/jpeg") else content_type

    result = await extract_invoice_data(image_b64, media_type)
    result.latency_ms = int((time.time() - start_time) * 1000)
    result.cached = False

    result_dict = result.model_dump()
    await set_cached(cache_key, result_dict)
    await add_to_history(result_dict)

    return result


@app.get("/health")
async def health():
    redis_ok = await ping()
    return {
        "status": "ok",
        "redis": "connected" if redis_ok else "disconnected",
    }


@app.get("/history")
async def history():
    return await get_history()
