import os
import time
import json
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

# Try connecting to Redis if REDIS_URL environment variable is provided
REDIS_URL = os.getenv("REDIS_URL")
_redis_client = None

if REDIS_URL:
    try:
        import importlib
        redis = importlib.import_module("redis")
        _redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
        _redis_client.ping()
        logger.info("Connected to Redis for caching & rate limiting")
    except Exception as e:
        logger.warning(f"Failed to connect to Redis at {REDIS_URL}, falling back to in-memory cache: {e}")
        _redis_client = None


# Fallback in-memory structures for local dev or when Redis is unavailable
_cache: Dict[str, Dict[str, Any]] = {}
_rate_limits: Dict[str, float] = {}

def set_otp_cache(identifier: str, hash_val: str, ttl_seconds: int = 300):
    key = f"otp:{identifier}"
    data = {
        "hash": hash_val,
        "attempts": 0,
        "expires_at": time.time() + ttl_seconds
    }
    if _redis_client:
        try:
            _redis_client.setex(key, ttl_seconds, json.dumps(data))
            return
        except Exception as e:
            logger.error(f"Redis set_otp_cache failed: {e}")
    _cache[key] = data

def get_otp_cache(identifier: str) -> dict | None:
    key = f"otp:{identifier}"
    if _redis_client:
        try:
            val = _redis_client.get(key)
            if val:
                return json.loads(val)
            return None
        except Exception as e:
            logger.error(f"Redis get_otp_cache failed: {e}")

    entry = _cache.get(key)
    if not entry:
        return None
    if time.time() > entry["expires_at"]:
        del _cache[key]
        return None
    return entry

def increment_otp_attempts(identifier: str) -> int:
    key = f"otp:{identifier}"
    if _redis_client:
        try:
            val = _redis_client.get(key)
            if val:
                data = json.loads(val)
                data["attempts"] += 1
                ttl = _redis_client.ttl(key)
                if ttl > 0:
                    _redis_client.setex(key, ttl, json.dumps(data))
                return data["attempts"]
            return 0
        except Exception as e:
            logger.error(f"Redis increment_otp_attempts failed: {e}")

    if key in _cache:
        _cache[key]["attempts"] += 1
        return _cache[key]["attempts"]
    return 0

def delete_otp_cache(identifier: str):
    key = f"otp:{identifier}"
    if _redis_client:
        try:
            _redis_client.delete(key)
            return
        except Exception as e:
            logger.error(f"Redis delete_otp_cache failed: {e}")

    if key in _cache:
        del _cache[key]

def check_rate_limit(identifier: str, cooldown_seconds: int = 60) -> bool:
    key = f"rate:send:{identifier}"
    if _redis_client:
        try:
            # Set key if not exists with PX/EX, or check TTL
            is_set = _redis_client.set(key, "1", ex=cooldown_seconds, nx=True)
            return bool(is_set)
        except Exception as e:
            logger.error(f"Redis check_rate_limit failed: {e}")

    last_sent = _rate_limits.get(key, 0)
    if time.time() - last_sent < cooldown_seconds:
        return False  # Rate limited
    _rate_limits[key] = time.time()
    return True
