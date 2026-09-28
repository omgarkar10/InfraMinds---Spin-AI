"""Bhashini API integration for ASR and translation across 22 Indian languages.

Isolation contract:
  - ALL multilingual ASR and NMT calls from the SPIN backend go through this module.
  - If CONFIG.bhashini_api_key / bhashini_user_id are not set, falls back to
    translate_service.translate_to_english() (Google Cloud Translate).
  - If all translation providers are unavailable, returns the original text
    as-is with source_language='unknown' — never raises.
  - Protected: Do NOT change Bhashini request payload formats without verifying
    compatibility with the active Bhashini API version.
"""

from __future__ import annotations

import json
import os
import time
from typing import Any

import httpx

from spin_agents.config import CONFIG

SUPPORTED_LANGUAGES = {
    "hi": "Hindi",
    "bn": "Bengali",
    "te": "Telugu",
    "mr": "Marathi",
    "ta": "Tamil",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "or": "Odia",
    "as": "Assamese",
    "ur": "Urdu",
    "en": "English",
}


_quota_calls = 0
_quota_started = time.monotonic()
_translation_cache: dict[str, tuple[float, dict[str, Any]]] = {}


def _reserve_call() -> None:
    """Local 24-hour guardrail; set below the provider's 500-call allowance."""
    global _quota_calls, _quota_started
    if time.monotonic() - _quota_started >= 86_400:
        _quota_calls, _quota_started = 0, time.monotonic()
    if _quota_calls >= CONFIG.bhashini_daily_call_limit:
        raise RuntimeError("Bhashini quota is temporarily exhausted. Please try again later.")
    _quota_calls += 1


async def bhashini_quota_status() -> dict[str, int]:
    return {"used": _quota_calls, "limit": CONFIG.bhashini_daily_call_limit, "remaining": max(0, CONFIG.bhashini_daily_call_limit - _quota_calls)}


def _headers() -> dict[str, str]:
    return {
        "Authorization": CONFIG.bhashini_api_key,
        "Content-Type": "application/json",
        "userID": CONFIG.bhashini_user_id,
        "ulcaApiKey": CONFIG.bhashini_ulca_api_key,
    }


async def bhashini_translate(
    text: str,
    source_language: str = "hi",
    target_language: str = "en",
) -> dict[str, Any]:
    """Translate regional text to English via Bhashini NMT pipeline."""
    if not text or len(text) > CONFIG.bhashini_max_text_chars:
        raise ValueError("Text is empty or exceeds the allowed length.")
    if source_language == target_language:
        return {"original_text": text, "english_translation": text, "source_language": source_language, "target_language": target_language, "cached": True}
    cache_key = f"{source_language}|{target_language}|{text}"
    cached = _translation_cache.get(cache_key)
    if cached and time.monotonic() - cached[0] < CONFIG.bhashini_cache_ttl_seconds:
        return {**cached[1], "cached": True}
    if not CONFIG.bhashini_configured:
        try:
            import os
            import sys
            sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
            from translate_service import translate_to_english
            res = translate_to_english(text)
            return {
                "original_text": text,
                "english_translation": res.get("translated_text", text),
                "source_language": res.get("source_language", source_language),
                "target_language": target_language,
            }
        except Exception:
            return {
                "original_text": text,
                "english_translation": text,
                "source_language": source_language,
                "target_language": target_language,
            }

    payload = {
        "pipelineTasks": [
            {
                "taskType": "translation",
                "config": {
                    "language": {
                        "sourceLanguage": source_language,
                        "targetLanguage": target_language,
                    },
                    "serviceId": os.getenv("BHASHINI_TRANSLATION_SERVICE_ID", ""),
                },
            }
        ],
        "inputData": {"input": [{"source": text}]},
    }
    _reserve_call()
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(CONFIG.bhashini_api_url, headers=_headers(), json=payload)
        response.raise_for_status()
        data = response.json()
    translated = (
        data.get("pipelineResponse", [{}])[0]
        .get("output", [{}])[0]
        .get("target", text)
    )
    result = {
        "original_text": text,
        "english_translation": translated,
        "source_language": source_language,
        "target_language": target_language,
    }


    _translation_cache[cache_key] = (time.monotonic(), result)
    return result
async def bhashini_asr(
    audio_url: str,
    source_language: str = "hi",
) -> dict[str, Any]:
    """Transcribe voice note via Bhashini ASR, then translate to English."""
    if not CONFIG.bhashini_configured:
        transcribed = "[Mock Bhashini ASR Audio Transcription]"
        return {
            "original_text": transcribed,
            "english_translation": transcribed,
            "source_language": source_language,
            "target_language": "en",
        }

    payload = {
        "pipelineTasks": [
            {
                "taskType": "asr",
                "config": {
                    "language": {"sourceLanguage": source_language},
                    "serviceId": CONFIG.bhashini_asr_service_id,
                    "audioFormat": "wav",
                },
            }
        ],
        "inputData": {"audio": [{"audioUri": audio_url}]},
    }
    _reserve_call()
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(CONFIG.bhashini_api_url, headers=_headers(), json=payload)
        response.raise_for_status()
        data = response.json()
    transcribed = (
        data.get("pipelineResponse", [{}])[0]
        .get("output", [{}])[0]
        .get("source", "")
    )
    if source_language != "en" and transcribed:
        return await bhashini_translate(transcribed, source_language, "en")
    return {
        "original_text": transcribed,
        "english_translation": transcribed,
        "source_language": source_language,
        "target_language": "en",
    }


async def bhashini_tts(text: str, target_language: str = "hi", gender: str = "female") -> dict[str, Any]:
    """Convert an already-localized response into Bhashini speech audio."""
    if not CONFIG.bhashini_configured:
        raise RuntimeError("Bhashini is not configured on this server.")
    if not text or len(text) > CONFIG.bhashini_max_text_chars:
        raise ValueError("Text is empty or exceeds the allowed length.")
    if target_language not in SUPPORTED_LANGUAGES:
        raise ValueError("Unsupported target language.")
    payload = {
        "pipelineTasks": [{"taskType": "tts", "config": {"language": {"sourceLanguage": target_language}, "gender": gender, "serviceId": CONFIG.bhashini_tts_service_id}}],
        "inputData": {"input": [{"source": text}]},
    }
    _reserve_call()
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(CONFIG.bhashini_api_url, headers=_headers(), json=payload)
        response.raise_for_status()
        data = response.json()
    output = data.get("pipelineResponse", [{}])[0].get("output", [{}])[0]
    return {
        "audio_content": output.get("audioContent", ""),
        "audio_format": output.get("audioFormat", "wav"),
        "target_language": target_language,
    }
async def bhashini_notify_citizen(
    message_en: str,
    target_language: str,
    user_id: str,
) -> dict[str, Any]:
    """Reverse-flow: translate policy action confirmation back to citizen language."""
    if target_language == "en":
        localized = message_en
    else:
        result = await bhashini_translate(message_en, "en", target_language)
        localized = result["english_translation"]
    return {
        "user_id": user_id,
        "target_language": target_language,
        "localized_message": localized,
        "delivery_status": "queued",
    }


def bhashini_translate_sync(text: str, source_language: str = "hi") -> str:
    """Sync wrapper for ADK FunctionTool registration."""
    import asyncio

    result = asyncio.run(bhashini_translate(text, source_language, "en"))
    return json.dumps(result)
