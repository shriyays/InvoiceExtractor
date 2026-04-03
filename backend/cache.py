import redis.asyncio as redis
import json
import os
from typing import Optional

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
CACHE_PREFIX = "invoiceiq:cache:"
HISTORY_KEY = "invoiceiq:history"

_redis_client: Optional[redis.Redis] = None


async def get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    return _redis_client


async def get_cached(key: str) -> Optional[dict]:
    r = await get_redis()
    data = await r.get(f"{CACHE_PREFIX}{key}")
    if data:
        return json.loads(data)
    return None


async def set_cached(key: str, data: dict, ttl: int = 86400) -> None:
    r = await get_redis()
    await r.setex(f"{CACHE_PREFIX}{key}", ttl, json.dumps(data))


async def add_to_history(data: dict) -> None:
    r = await get_redis()
    await r.lpush(HISTORY_KEY, json.dumps(data))
    await r.ltrim(HISTORY_KEY, 0, 9)


async def get_history() -> list[dict]:
    r = await get_redis()
    items = await r.lrange(HISTORY_KEY, 0, 9)
    return [json.loads(item) for item in items]


async def ping() -> bool:
    try:
        r = await get_redis()
        return await r.ping()
    except Exception:
        return False
