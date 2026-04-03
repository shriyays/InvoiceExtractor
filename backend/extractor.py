import json
import os
import re
from typing import Optional
from models import InvoiceData, LineItem

from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)

MODEL = "nvidia/nemotron-nano-12b-v2-vl:free"

PROMPT = (
    "You are an expert invoice data extraction system. Extract all invoice data from the "
    "provided image with maximum accuracy. Return ONLY a valid JSON object — no markdown, "
    "no explanation, no code fences. The JSON must have exactly these fields: "
    "invoice_number, invoice_date, due_date, vendor_name, vendor_address, vendor_email, "
    "vendor_phone, client_name, client_address, "
    "line_items (array of objects with description, quantity, unit_price, total), "
    "subtotal, tax, discount, total_amount, currency, payment_terms, notes, confidence_score. "
    "Use null for any field you cannot find. "
    "confidence_score should be 0.0 to 1.0 reflecting your extraction confidence."
)

STRICT_PROMPT = (
    "Look at this invoice image carefully. Return ONLY raw JSON, nothing else — no backticks, "
    "no markdown, no explanation. JSON fields: invoice_number, invoice_date, due_date, "
    "vendor_name, vendor_address, vendor_email, vendor_phone, client_name, client_address, "
    "line_items (array: description, quantity, unit_price, total), subtotal, tax, discount, "
    "total_amount, currency, payment_terms, notes, confidence_score. Null for missing fields."
)


def _extract_json(text: str) -> dict:
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    match = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except json.JSONDecodeError:
            pass

    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse JSON from LLM response. Preview: {text[:300]}")


def _call_openrouter(image_b64: str, media_type: str, prompt: str) -> str:
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{media_type};base64,{image_b64}"
                        },
                    },
                    {
                        "type": "text",
                        "text": prompt,
                    },
                ],
            }
        ],
        max_tokens=4096,
    )
    return response.choices[0].message.content


def _to_float(val) -> Optional[float]:
    if val is None:
        return None
    try:
        return float(str(val).replace(",", "").replace("$", "").strip())
    except (TypeError, ValueError):
        return None


async def extract_invoice_data(image_b64: str, media_type: str = "image/png") -> InvoiceData:
    data = None
    try:
        raw_text = _call_openrouter(image_b64, media_type, PROMPT)
        data = _extract_json(raw_text)
    except Exception as first_err:
        try:
            raw_text = _call_openrouter(image_b64, media_type, STRICT_PROMPT)
            data = _extract_json(raw_text)
        except Exception as second_err:
            raise ValueError(
                f"Invoice extraction failed after retry. "
                f"First error: {first_err}. Second error: {second_err}"
            )

    raw_items = data.get("line_items") or []
    line_items: list[LineItem] = []
    for item in raw_items:
        if isinstance(item, dict):
            line_items.append(
                LineItem(
                    description=str(item.get("description") or ""),
                    quantity=_to_float(item.get("quantity")),
                    unit_price=_to_float(item.get("unit_price")),
                    total=_to_float(item.get("total")),
                )
            )

    confidence = _to_float(data.get("confidence_score")) or 0.0
    confidence = max(0.0, min(1.0, confidence))

    return InvoiceData(
        invoice_number=data.get("invoice_number"),
        invoice_date=data.get("invoice_date"),
        due_date=data.get("due_date"),
        vendor_name=data.get("vendor_name"),
        vendor_address=data.get("vendor_address"),
        vendor_email=data.get("vendor_email"),
        vendor_phone=data.get("vendor_phone"),
        client_name=data.get("client_name"),
        client_address=data.get("client_address"),
        line_items=line_items,
        subtotal=_to_float(data.get("subtotal")),
        tax=_to_float(data.get("tax")),
        discount=_to_float(data.get("discount")),
        total_amount=_to_float(data.get("total_amount")),
        currency=data.get("currency"),
        payment_terms=data.get("payment_terms"),
        notes=data.get("notes"),
        confidence_score=confidence,
        cached=False,
        latency_ms=0,
    )
