"""Bhashini ULCA pipeline endpoints; all secrets remain on the backend.

Exposes:
  POST /api/bhashini/detect-and-translate  — Auto-detect language (TLD) then NMT translate to English.
  POST /api/bhashini/translate             — NMT translate with a known source language.
  POST /api/bhashini/tts                   — Text-to-Speech in target Indian language.
  GET  /api/bhashini/status               — Quota + configuration health-check.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from spin_agents.config import CONFIG

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/bhashini", tags=["bhashini"])

# ── Bhashini language code map (ISO 639-1 → Bhashini pipeline code) ─────────
BHASHINI_LANG_MAP = {
    "hi": "hi", "bn": "bn", "te": "te", "mr": "mr", "ta": "ta",
    "gu": "gu", "kn": "kn", "ml": "ml", "pa": "pa", "or": "or",
    "as": "as", "ur": "ur", "en": "en", "mai": "mai", "mni": "mni",
    "sat": "sat", "kok": "kok", "doi": "doi", "sa": "sa",
    "brx": "brx", "ks": "ks", "ne": "ne", "sd": "sd",
}

LANGUAGE_NAMES = {
    "hi": "Hindi", "bn": "Bengali", "te": "Telugu", "mr": "Marathi",
    "ta": "Tamil", "gu": "Gujarati", "kn": "Kannada", "ml": "Malayalam",
    "pa": "Punjabi", "or": "Odia", "as": "Assamese", "ur": "Urdu",
    "en": "English", "mai": "Maithili", "mni": "Manipuri", "sat": "Santali",
    "kok": "Konkani", "doi": "Dogri", "sa": "Sanskrit", "brx": "Bodo",
    "ks": "Kashmiri", "ne": "Nepali", "sd": "Sindhi",
}


def _headers() -> dict[str, str]:
    return {
        "Authorization": CONFIG.bhashini_api_key,
        "Content-Type": "application/json",
        "userID": CONFIG.bhashini_user_id,
        "ulcaApiKey": CONFIG.bhashini_ulca_api_key,
    }


# ── Request / Response models ────────────────────────────────────────────────

class DetectAndTranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    target_language: str = Field(default="en")

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    source_language: str = Field(default="hi")
    target_language: str = Field(default="en")

class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)
    target_language: str = Field(default="hi")
    gender: str = Field(default="female")


# ── Helpers ──────────────────────────────────────────────────────────────────

async def _call_bhashini(payload: dict[str, Any]) -> dict[str, Any]:
    """Make a single call to Bhashini inference pipeline."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(CONFIG.bhashini_api_url, headers=_headers(), json=payload)
        response.raise_for_status()
        return response.json()


async def _detect_language(text: str) -> str:
    """Call Bhashini TLD (Text Language Detection) pipeline to detect language."""
    payload = {
        "pipelineTasks": [
            {
                "taskType": "txt-lang-detection",
                "config": {
                    "language": {"sourceLanguage": ""},
                }
            }
        ],
        "inputData": {"input": [{"source": text}]},
    }
    try:
        data = await _call_bhashini(payload)
        detected = (
            data.get("pipelineResponse", [{}])[0]
            .get("output", [{}])[0]
            .get("langPrediction", [{}])[0]
            .get("langCode", "hi")
        )
        return detected if detected in BHASHINI_LANG_MAP else "hi"
    except Exception as exc:
        logger.warning("Bhashini TLD failed, defaulting to 'hi': %s", exc)
        # Smart Unicode-based fallback detection
        return _unicode_detect(text)


def _unicode_detect(text: str) -> str:
    """Fallback script-based language detection using Unicode ranges."""
    RANGES = {
        "hi": (0x0900, 0x097F),  # Devanagari (Hindi/Marathi)
        "bn": (0x0980, 0x09FF),  # Bengali
        "pa": (0x0A00, 0x0A7F),  # Gurmukhi (Punjabi)
        "gu": (0x0A80, 0x0AFF),  # Gujarati
        "or": (0x0B00, 0x0B7F),  # Odia
        "ta": (0x0B80, 0x0BFF),  # Tamil
        "te": (0x0C00, 0x0C7F),  # Telugu
        "kn": (0x0C80, 0x0CFF),  # Kannada
        "ml": (0x0D00, 0x0D7F),  # Malayalam
        "ur": (0x0600, 0x06FF),  # Arabic/Urdu
    }
    counts: dict[str, int] = {}
    for char in text:
        cp = ord(char)
        for lang, (start, end) in RANGES.items():
            if start <= cp <= end:
                counts[lang] = counts.get(lang, 0) + 1
    return max(counts, key=lambda k: counts[k]) if counts else "en"


async def _nmt_translate(text: str, source_lang: str, target_lang: str) -> str:
    """Call Bhashini NMT (Neural Machine Translation) pipeline."""
    payload = {
        "pipelineTasks": [
            {
                "taskType": "translation",
                "config": {
                    "language": {
                        "sourceLanguage": source_lang,
                        "targetLanguage": target_lang,
                    },
                    "serviceId": CONFIG.bhashini_translation_service_id or "",
                },
            }
        ],
        "inputData": {"input": [{"source": text}]},
    }
    data = await _call_bhashini(payload)
    translated = (
        data.get("pipelineResponse", [{}])[0]
        .get("output", [{}])[0]
        .get("target", text)
    )
    return translated


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/detect-and-translate")
async def detect_and_translate(body: DetectAndTranslateRequest) -> dict[str, Any]:
    """
    AUTO-DETECT language using Bhashini TLD, then NMT translate to target language.
    This is the primary endpoint used by the citizen intake form.
    The frontend does NOT need to specify a source language — Bhashini figures it out.
    """
    if not CONFIG.bhashini_configured:
        return {
            "original_text": body.text,
            "translated_text": body.text,
            "detected_language_code": "en",
            "detected_language_name": "English",
            "target_language": body.target_language,
            "provider": "mock_unconfigured",
        }

    # Step 1: Auto-detect language
    detected_lang = await _detect_language(body.text)
    detected_name = LANGUAGE_NAMES.get(detected_lang, detected_lang.upper())

    # Step 2: If already in target language, skip translation
    if detected_lang == body.target_language:
        return {
            "original_text": body.text,
            "translated_text": body.text,
            "detected_language_code": detected_lang,
            "detected_language_name": detected_name,
            "target_language": body.target_language,
            "provider": "bhashini_tld_no_translate_needed",
        }

    # Step 3: Translate using NMT
    try:
        translated = await _nmt_translate(body.text, detected_lang, body.target_language)
    except Exception as exc:
        logger.error("Bhashini NMT failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"Bhashini NMT translation failed: {exc}")

    return {
        "original_text": body.text,
        "translated_text": translated,
        "detected_language_code": detected_lang,
        "detected_language_name": detected_name,
        "target_language": body.target_language,
        "provider": "bhashini_tld_nmt",
    }


@router.post("/translate")
async def translate(body: TranslateRequest) -> dict[str, Any]:
    """NMT translate with a known source language (no TLD step)."""
    if not CONFIG.bhashini_configured:
        return {
            "original_text": body.text,
            "translated_text": body.text,
            "source_language": body.source_language,
            "target_language": body.target_language,
            "provider": "mock_unconfigured",
        }

    if body.source_language == body.target_language:
        return {
            "original_text": body.text,
            "translated_text": body.text,
            "source_language": body.source_language,
            "target_language": body.target_language,
            "provider": "no_op",
        }

    try:
        translated = await _nmt_translate(body.text, body.source_language, body.target_language)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return {
        "original_text": body.text,
        "translated_text": translated,
        "source_language": body.source_language,
        "target_language": body.target_language,
        "provider": "bhashini_nmt",
    }


@router.post("/tts")
async def text_to_speech(body: TTSRequest) -> dict[str, Any]:
    """Convert text to speech audio in target Indian language via Bhashini TTS."""
    if not CONFIG.bhashini_configured:
        raise HTTPException(status_code=503, detail="Bhashini is not configured on this server.")

    payload = {
        "pipelineTasks": [
            {
                "taskType": "tts",
                "config": {
                    "language": {"sourceLanguage": body.target_language},
                    "gender": body.gender,
                    "serviceId": CONFIG.bhashini_tts_service_id or "",
                },
            }
        ],
        "inputData": {"input": [{"source": body.text}]},
    }
    try:
        data = await _call_bhashini(payload)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    output = data.get("pipelineResponse", [{}])[0].get("output", [{}])[0]
    return {
        "audio_content": output.get("audioContent", ""),
        "audio_format": output.get("audioFormat", "wav"),
        "target_language": body.target_language,
        "provider": "bhashini_tts",
    }


@router.get("/status")
async def bhashini_status() -> dict[str, Any]:
    """Health-check endpoint: returns Bhashini configuration status."""
    from spin_agents.tools.bhashini import bhashini_quota_status
    quota = await bhashini_quota_status()
    return {
        "configured": CONFIG.bhashini_configured,
        "api_url": CONFIG.bhashini_api_url,
        "quota": quota,
        "services": {
            "tld": "auto (no service ID needed)",
            "nmt": CONFIG.bhashini_translation_service_id or "auto",
            "asr": CONFIG.bhashini_asr_service_id or "auto",
            "tts": CONFIG.bhashini_tts_service_id or "auto",
        },
    }
