# InvoiceIQ — AI Invoice Intelligence System

A full-stack AI-powered invoice extraction system that converts invoice images and PDFs into structured JSON data using vision AI — automatically pulling out vendor info, line items, totals, payment terms, and more.

![Python](https://img.shields.io/badge/Python-3.11-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat-square&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)

---

## What It Does

Companies receive thousands of invoices in different formats, layouts, and fonts. Manually entering each one into accounting or ERP systems is slow and error-prone. InvoiceIQ automates that — upload any invoice image or PDF and get back clean, machine-readable JSON in seconds.

**Input:** Invoice image (JPG/PNG) or PDF  
**Output:** Structured JSON with all invoice fields extracted

```json
{
  "invoice_number": "#INV-2026-0042",
  "vendor_name": "PixelForge Studio",
  "client_name": "Nexus Dynamics Corp.",
  "total_amount": 15250.30,
  "currency": "USD",
  "line_items": [...],
  "confidence_score": 1.0
}
```

---

## Features

- **AI Vision Extraction** — Uses LLM vision API to read and parse any invoice format
- **PDF + Image Support** — Accepts JPG, PNG, and PDF uploads (up to 10MB)
- **Redis Caching** — MD5-keyed cache with 24hr TTL; repeat uploads return instantly (90%+ latency reduction)
- **Confidence Scoring** — LLM self-reports extraction confidence (0.0–1.0)
- **Extraction History** — Tracks last 10 extractions with vendor and total
- **JSON Export** — Download extracted data as a `.json` file
- **Drag & Drop UI** — Clean dark-themed React frontend with file preview
- **Dockerized** — Full stack runs with a single `docker-compose up`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Vite |
| Backend | Python 3.11, FastAPI, Uvicorn |
| AI / Vision | OpenRouter Vision API (LLM) |
| Caching | Redis 7 (async, MD5-keyed) |
| PDF Processing | pdf2image + Pillow |
| Infrastructure | Docker, Docker Compose, Nginx |

---

## Project Structure

```
InvoiceIQ/
├── docker-compose.yml
├── .env.example
│
├── backend/
│   ├── main.py           # FastAPI app — /extract, /health, /history
│   ├── extractor.py      # Vision API extraction + retry logic
│   ├── cache.py          # Async Redis caching layer
│   ├── pdf_converter.py  # PDF → base64 image conversion
│   ├── models.py         # Pydantic schemas (InvoiceData, LineItem)
│   ├── requirements.txt
│   └── Dockerfile
│
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   │   ├── UploadZone.jsx      # Drag-and-drop file upload
    │   │   ├── ResultCard.jsx      # Extracted data display
    │   │   ├── LoadingState.jsx    # Animated processing indicator
    │   │   └── ErrorBanner.jsx     # Error display
    │   └── api/client.js          # Axios API wrapper
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── nginx.conf
    └── Dockerfile
```

---

## Getting Started

### With Docker (recommended)

```bash
# 1. Clone the repo
git clone https://github.com/shriyays/InvoiceExtractor.git
cd InvoiceExtractor

# 2. Add your API key
cp .env.example .env
# Edit .env and add your OPENROUTER_API_KEY (free at openrouter.ai)

# 3. Start everything
docker-compose up -d

# 4. Open the app
open http://localhost:3000
```

### Without Docker (local dev)

**Backend:**
```bash
cd backend
pip install -r requirements.txt
OPENROUTER_API_KEY=your_key REDIS_URL=redis://localhost:6379 uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

> Requires Redis running locally: `brew install redis && brew services start redis`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/extract` | Upload invoice file, returns extracted JSON |
| `GET` | `/health` | Health check (backend + Redis status) |
| `GET` | `/history` | Last 10 extracted invoices |

### Example Response

```json
{
  "invoice_number": "#INV-2026-0042",
  "invoice_date": "April 3, 2026",
  "due_date": "May 3, 2026",
  "vendor_name": "PixelForge Studio",
  "vendor_address": "128 Harbour Blvd, Suite 4B, San Francisco, CA 94105",
  "vendor_email": "billing@pixelforge.io",
  "vendor_phone": "+1 (415) 882-0033",
  "client_name": "Nexus Dynamics Corp.",
  "client_address": "450 Market Street, Floor 12, New York, NY 10007",
  "line_items": [
    { "description": "Brand Identity & Logo Design", "quantity": 1, "unit_price": 4500, "total": 4500 },
    { "description": "Website UI/UX Design (10 screens)", "quantity": 10, "unit_price": 350, "total": 3500 }
  ],
  "subtotal": 14800.0,
  "tax": 1190.3,
  "discount": 740.0,
  "total_amount": 15250.3,
  "currency": "USD",
  "payment_terms": "Net 30",
  "confidence_score": 1.0,
  "cached": false,
  "latency_ms": 4021
}
```

---

## Environment Variables

```env
OPENROUTER_API_KEY=your_openrouter_api_key   # Get free at openrouter.ai
REDIS_URL=redis://localhost:6379              # Redis connection URL
```

---

## How Caching Works

Every uploaded file is hashed with MD5. Before calling the AI API, the backend checks Redis for that hash. If found, the cached result is returned immediately with `"cached": true` — skipping the API call entirely and reducing latency by 90%+.

---

## License

MIT
