"""Bhashini API integration for ASR and translation across 22 Indian languages."""

from __future__ import annotations

import json
import os
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


def _headers() -> dict[str, str]:
    return {
        "Authorization": CONFIG.bhashini_api_key,
        "Content-Type": "application/json",
        "userID": CONFIG.bhashini_user_id,
    }


async def bhashini_translate(
    text: str,
    source_language: str = "hi",
    target_language: str = "en",
) -> dict[str, Any]:
    """Translate regional text to English via Bhashini NMT pipeline."""
    if not CONFIG.bhashini_api_key or not CONFIG.bhashini_user_id:
        return {
            "original_text": text,
            "english_translation": f"[Mock Bhashini Translation ({source_language}->{target_language})] {text}",
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
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(CONFIG.bhashini_api_url, headers=_headers(), json=payload)
        response.raise_for_status()
        data = response.json()
    translated = (
        data.get("pipelineResponse", [{}])[0]
        .get("output", [{}])[0]
        .get("target", text)
    )
    return {
        "original_text": text,
        "english_translation": translated,
        "source_language": source_language,
        "target_language": target_language,
    }


async def bhashini_asr(
    audio_url: str,
    source_language: str = "hi",
) -> dict[str, Any]:
    """Transcribe voice note via Bhashini ASR, then translate to English."""
    if not CONFIG.bhashini_api_key or not CONFIG.bhashini_user_id:
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
                    "serviceId": os.getenv("BHASHINI_ASR_SERVICE_ID", ""),
                    "audioFormat": "wav",
                },
            }
        ],
        "inputData": {"audio": [{"audioUri": audio_url}]},
    }
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
