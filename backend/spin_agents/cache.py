import time
from typing import Dict, Any

# Simple in-memory cache to replace Redis for local SQLite prototype
_cache: Dict[str, Dict[str, Any]] = {}

def set_otp_cache(identifier: str, hash_val: str, ttl_seconds: int = 300):
    _cache[f"otp:{identifier}"] = {
        "hash": hash_val,
        "attempts": 0,
        "expires_at": time.time() + ttl_seconds
    }

def get_otp_cache(identifier: str) -> dict | None:
    key = f"otp:{identifier}"
    entry = _cache.get(key)
    if not entry:
        return None
    if time.time() > entry["expires_at"]:
        del _cache[key]
        return None
    return entry

def increment_otp_attempts(identifier: str) -> int:
    key = f"otp:{identifier}"
    if key in _cache:
        _cache[key]["attempts"] += 1
        return _cache[key]["attempts"]
    return 0

def delete_otp_cache(identifier: str):
    key = f"otp:{identifier}"
    if key in _cache:
        del _cache[key]

# Basic rate limiting simulation
_rate_limits: Dict[str, float] = {}

def check_rate_limit(identifier: str, cooldown_seconds: int = 60) -> bool:
    key = f"rate:send:{identifier}"
    last_sent = _rate_limits.get(key, 0)
    if time.time() - last_sent < cooldown_seconds:
        return False # Rate limited
    _rate_limits[key] = time.time()
    return True
