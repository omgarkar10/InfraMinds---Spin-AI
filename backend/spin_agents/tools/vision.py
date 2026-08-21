"""Vertex AI Vision for citizen-uploaded infrastructure imagery."""

from __future__ import annotations

import json
import os
from typing import Any

from spin_agents.config import CONFIG


def analyze_infrastructure_image(
    media_url: str,
    domain_hint: str = "Unknown",
) -> dict[str, Any]:
    """Process citizen photo via Vertex AI Vision / Gemini multimodal."""
    if not CONFIG.gcp_project:
        return _mock_vision_result(domain_hint)

    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel, Part

        vertexai.init(project=CONFIG.gcp_project, location=CONFIG.gcp_location)
        model = GenerativeModel(CONFIG.gemini_model)
        prompt = (
            "Analyze this infrastructure image. Return JSON only with keys: "
            "domain (Water/Road/Power), severity (1-10 integer), "
            "anomaly_detected (boolean), description (string)."
        )
        image_part = Part.from_uri(media_url, mime_type="image/jpeg")
        response = model.generate_content([prompt, image_part])
        text = response.text.strip()
        if text.startswith("```"):
            text = text.split("```")[1].replace("json", "").strip()
        return json.loads(text)
    except Exception as exc:  # pragma: no cover
        return {
            "domain": domain_hint,
            "severity": 5,
            "anomaly_detected": False,
            "image_verified": False,
            "error": str(exc),
        }


def _mock_vision_result(domain_hint: str) -> dict[str, Any]:
    domain = domain_hint if domain_hint in {"Water", "Road", "Power"} else "Road"
    return {
        "domain": domain,
        "severity": 7,
        "anomaly_detected": True,
        "image_verified": True,
        "description": f"Visible {domain.lower()} infrastructure damage detected",
        "source": "mock",
    }
