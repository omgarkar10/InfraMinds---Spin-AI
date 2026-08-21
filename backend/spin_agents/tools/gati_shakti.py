"""PM Gati Shakti National Master Plan GIS layer correlation."""

from __future__ import annotations

import os
from typing import Any

import httpx

from spin_agents.config import CONFIG

DOMAIN_LAYER_MAP = {
    "Water": "water_supply_network",
    "Road": "national_highways",
    "Power": "transmission_lines",
    "Rail": "railway_corridors",
    "Telecom": "fiber_optic_backbone",
}


async def query_gati_shakti_layers(
    latitude: float,
    longitude: float,
    domain: str,
    radius_km: float = 5.0,
) -> dict[str, Any]:
    """Check for overlapping or delayed public works at coordinates."""
    layer = DOMAIN_LAYER_MAP.get(domain, "infrastructure_projects")
    params = {
        "lat": latitude,
        "lng": longitude,
        "radius_km": radius_km,
        "layer": layer,
    }
    headers = {"Authorization": f"Bearer {CONFIG.gati_shakti_api_key}"}

    if not CONFIG.gati_shakti_api_key:
        return _mock_gati_shakti_response(latitude, longitude, domain)

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(CONFIG.gati_shakti_api_url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()

    projects = data.get("features", [])
    delayed = [p for p in projects if p.get("properties", {}).get("status") == "delayed"]
    return {
        "latitude": latitude,
        "longitude": longitude,
        "domain": domain,
        "layer_queried": layer,
        "existing_projects": len(projects),
        "delayed_projects": len(delayed),
        "overlap_detected": len(projects) > 0,
        "priority_gap": len(delayed) > 0 and domain in {"Water", "Road", "Power"},
        "projects": [
            {
                "name": p.get("properties", {}).get("project_name", "Unknown"),
                "status": p.get("properties", {}).get("status", "unknown"),
                "sanctioned_amount_cr": p.get("properties", {}).get("budget_cr", 0),
            }
            for p in projects[:5]
        ],
    }


def query_gati_shakti_sync(latitude: float, longitude: float, domain: str) -> str:
    """Sync wrapper for ADK FunctionTool."""
    import asyncio
    import json

    result = asyncio.run(query_gati_shakti_layers(latitude, longitude, domain))
    return json.dumps(result)


def _mock_gati_shakti_response(lat: float, lng: float, domain: str) -> dict[str, Any]:
    """Demo data when API key is unavailable (hackathon / local dev)."""
    seed = int(abs(lat * 100 + lng * 100)) % 3
    scenarios = [
        {"existing": 0, "delayed": 0},
        {"existing": 2, "delayed": 1},
        {"existing": 1, "delayed": 0},
    ]
    s = scenarios[seed]
    return {
        "latitude": lat,
        "longitude": lng,
        "domain": domain,
        "layer_queried": DOMAIN_LAYER_MAP.get(domain, "infrastructure_projects"),
        "existing_projects": s["existing"],
        "delayed_projects": s["delayed"],
        "overlap_detected": s["existing"] > 0,
        "priority_gap": s["delayed"] > 0,
        "projects": [
            {
                "name": f"{domain} Corridor Phase {i + 1}",
                "status": "delayed" if i < s["delayed"] else "ongoing",
                "sanctioned_amount_cr": 45.0 + i * 12,
            }
            for i in range(s["existing"])
        ],
        "source": "mock",
    }
