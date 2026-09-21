"""Google Maps / Nominatim geocoding wrapper for the SPIN backend.

Isolation contract:
  - ALL geocoding calls from the backend go through this module.
  - In production, uses Google Maps Geocoding API (if key is set).
  - In development/offline, falls back to Nominatim (OSM) reverse geocoding.
  - NEVER raises — always returns a dict with a 'source' field indicating
    which provider was used, and an 'error' field if geocoding failed.

Protected: Do NOT change the response schema without updating API_CONTRACTS.md.
"""
from __future__ import annotations

from typing import Any

import httpx

from spin_agents.config import CONFIG


async def reverse_geocode(lat: float, lng: float) -> dict[str, Any]:
    """Convert (lat, lng) to a structured address dict.

    Returns:
        {
            "lat": float,
            "lng": float,
            "address": str,
            "district": str,
            "state": str,
            "country": str,
            "pin_code": str,
            "source": "google_maps" | "nominatim" | "error",
            "error": str | None,
        }
    """
    if CONFIG.google_maps_api_key:
        return await _google_reverse_geocode(lat, lng)
    return await _nominatim_reverse_geocode(lat, lng)


async def _google_reverse_geocode(lat: float, lng: float) -> dict[str, Any]:
    """Google Maps Geocoding API reverse lookup."""
    url = "https://maps.googleapis.com/maps/api/geocode/json"
    params = {"latlng": f"{lat},{lng}", "key": CONFIG.google_maps_api_key}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            results = data.get("results", [])
            if not results:
                return _empty_result(lat, lng, source="google_maps")
            components = {
                c["types"][0]: c["long_name"]
                for c in results[0].get("address_components", [])
                if c.get("types")
            }
            return {
                "lat": lat,
                "lng": lng,
                "address": results[0].get("formatted_address", ""),
                "district": components.get("administrative_area_level_3")
                    or components.get("locality", ""),
                "state": components.get("administrative_area_level_1", ""),
                "country": components.get("country", ""),
                "pin_code": components.get("postal_code", ""),
                "source": "google_maps",
                "error": None,
            }
    except Exception as e:
        return _error_result(lat, lng, str(e), source="google_maps")


async def _nominatim_reverse_geocode(lat: float, lng: float) -> dict[str, Any]:
    """OpenStreetMap Nominatim reverse geocoding fallback."""
    url = "https://nominatim.openstreetmap.org/reverse"
    params = {"format": "json", "lat": lat, "lon": lng}
    headers = {"User-Agent": "SPIN-Backend/1.0"}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            addr = data.get("address", {})
            return {
                "lat": lat,
                "lng": lng,
                "address": data.get("display_name", ""),
                "district": addr.get("city") or addr.get("town") or addr.get("county", ""),
                "state": addr.get("state", ""),
                "country": addr.get("country", ""),
                "pin_code": addr.get("postcode", ""),
                "source": "nominatim",
                "error": None,
            }
    except Exception as e:
        return _error_result(lat, lng, str(e), source="nominatim")


def _empty_result(lat: float, lng: float, source: str) -> dict[str, Any]:
    return {"lat": lat, "lng": lng, "address": "", "district": "", "state": "",
            "country": "", "pin_code": "", "source": source, "error": None}


def _error_result(lat: float, lng: float, error: str, source: str) -> dict[str, Any]:
    return {"lat": lat, "lng": lng, "address": "", "district": "", "state": "",
            "country": "", "pin_code": "", "source": source, "error": error}
