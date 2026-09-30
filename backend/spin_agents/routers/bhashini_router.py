"""Bhashini ULCA pipeline endpoints; all secrets remain on the backend.

Exposes:
  POST /api/bhashini/detect-and-translate
  POST /api/bhashini/translate
  POST /api/bhashini/tts
  POST /api/bhashini/asr-translate
  GET  /api/bhashini/status

Bhashini 2-step flow:
  1. Call ULCA pipeline config endpoint to get real serviceIds per language/task.
  2. Call Dhruva inference endpoint with those serviceIds.

Inference headers: Authorization only.
ULCA config headers: userID + ulcaApiKey.
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

BHASHINI_PIPELINE_CONFIG_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline"
BHASHINI_INFERENCE_URL = "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"

BHASHINI_LANG_MAP = {
    "hi": "hi", "bn": "bn", "te": "te", "mr": "mr", "ta": "ta",
    "gu": "gu", "kn": "kn", "ml": "ml", "pa": "pa", "or": "or",
    "as": "as", "ur": "ur", "en": "en", "mai": "mai", "mni": "mni",
    "sat": "sat", "kok": "kok", "doi": "doi", "sa": "sa",
    "brx": "brx", "ks": "ks", "ne": "ne", "sd": "sd",
    "raj": "raj", "si": "si",
}

LANGUAGE_NAMES = {
    "hi": "Hindi", "bn": "Bengali", "te": "Telugu", "mr": "Marathi",
    "ta": "Tamil", "gu": "Gujarati", "kn": "Kannada", "ml": "Malayalam",
    "pa": "Punjabi", "or": "Odia", "as": "Assamese", "ur": "Urdu",
    "en": "English", "mai": "Maithili", "mni": "Manipuri", "sat": "Santali",
    "kok": "Konkani", "doi": "Dogri", "sa": "Sanskrit", "brx": "Bodo",
    "ks": "Kashmiri", "ne": "Nepali", "sd": "Sindhi",
    "raj": "Rajasthani", "si": "Sinhala",
}


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

class ASRTranslateRequest(BaseModel):
    audio_content: str = Field(..., description="Base64 encoded audio data")
    source_language: str = Field(default="hi")
    target_language: str = Field(default="en")
    audio_format: str = Field(default="wav", description="Audio format: wav, flac, mp3, webm")
    sample_rate: int = Field(default=16000, description="Audio sample rate in Hz")


def _inference_headers() -> dict:
    return {
        "Authorization": CONFIG.bhashini_api_key,
        "Content-Type": "application/json",
    }

def _ulca_headers() -> dict:
    return {
        "userID": CONFIG.bhashini_user_id,
        "ulcaApiKey": CONFIG.bhashini_ulca_api_key,
        "Content-Type": "application/json",
    }


async def _call_inference(payload: dict, timeout: float = 60.0) -> dict:
    async with httpx.AsyncClient(timeout=timeout) as client:
        resp = await client.post(BHASHINI_INFERENCE_URL, headers=_inference_headers(), json=payload)
        if not resp.is_success:
            body = resp.text[:600]
            logger.error("Bhashini inference %s: %s | payload: %s", resp.status_code, body, str(payload)[:300])
            # Raise with the actual error text so callers can surface it
            raise httpx.HTTPStatusError(
                f"Bhashini API error {resp.status_code}: {body}",
                request=resp.request,
                response=resp,
            )
        return resp.json()


async def _get_pipeline_config(pipeline_tasks: list) -> dict:
    payload = {
        "pipelineTasks": pipeline_tasks,
        "pipelineRequestConfig": {"pipelineId": "64392f96daac500b55c543cd"},
    }
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(BHASHINI_PIPELINE_CONFIG_URL, headers=_ulca_headers(), json=payload)
        if not resp.is_success:
            logger.error("Bhashini pipeline config %s: %s", resp.status_code, resp.text[:400])
            resp.raise_for_status()
        return resp.json()


def _extract_asr_text(asr_data: dict) -> str:
    for task in asr_data.get("pipelineResponse") or []:
        for item in task.get("output") or []:
            if not isinstance(item, dict):
                continue
            for key in ("source", "target", "transcript"):
                val = item.get(key)
                if isinstance(val, str) and val.strip():
                    return val.strip()
    return ""


def _extract_service_id(config_data: dict, task_type: str) -> str:
    try:
        for task in config_data.get("pipelineResponseConfig", []):
            if task.get("taskType") == task_type:
                models = task.get("config", [])
                if models:
                    return models[0].get("serviceId", "")
    except Exception as exc:
        logger.warning("Could not extract serviceId for %s: %s", task_type, exc)
    return ""


async def _detect_language(text: str) -> str:
    payload = {
        "pipelineTasks": [{"taskType": "txt-lang-detection", "config": {"language": {"sourceLanguage": ""}}}],
        "inputData": {"input": [{"source": text}]},
    }
    try:
        data = await _call_inference(payload)
        detected = (
            data.get("pipelineResponse", [{}])[0]
            .get("output", [{}])[0]
            .get("langPrediction", [{}])[0]
            .get("langCode", "hi")
        )
        return detected if detected in BHASHINI_LANG_MAP else "hi"
    except Exception as exc:
        logger.warning("Bhashini TLD failed, using unicode detect: %s", exc)
        return _unicode_detect(text)


def _unicode_detect(text: str) -> str:
    RANGES = {
        "hi": (0x0900, 0x097F), "bn": (0x0980, 0x09FF), "pa": (0x0A00, 0x0A7F),
        "gu": (0x0A80, 0x0AFF), "or": (0x0B00, 0x0B7F), "ta": (0x0B80, 0x0BFF),
        "te": (0x0C00, 0x0C7F), "kn": (0x0C80, 0x0CFF), "ml": (0x0D00, 0x0D7F),
        "ur": (0x0600, 0x06FF),
    }
    counts: dict = {}
    for char in text:
        cp = ord(char)
        for lang, (start, end) in RANGES.items():
            if start <= cp <= end:
                counts[lang] = counts.get(lang, 0) + 1
    return max(counts, key=lambda k: counts[k]) if counts else "en"


async def _nmt_translate(text: str, source_lang: str, target_lang: str) -> str:
    service_id = CONFIG.bhashini_translation_service_id or ""
    if not service_id:
        try:
            cfg = await _get_pipeline_config([{
                "taskType": "translation",
                "config": {"language": {"sourceLanguage": source_lang, "targetLanguage": target_lang}},
            }])
            service_id = _extract_service_id(cfg, "translation")
        except Exception as exc:
            logger.warning("NMT config fetch failed, trying without serviceId: %s", exc)

    nmt_config: dict = {"language": {"sourceLanguage": source_lang, "targetLanguage": target_lang}}
    if service_id:
        nmt_config["serviceId"] = service_id

    payload = {
        "pipelineTasks": [{"taskType": "translation", "config": nmt_config}],
        "inputData": {"input": [{"source": text}]},
    }
    data = await _call_inference(payload)
    return (
        data.get("pipelineResponse", [{}])[0]
        .get("output", [{}])[0]
        .get("target", text)
    )


async def _get_asr_service_id(source_lang: str) -> str:
    # ASR service IDs are model/language-specific. Reusing one value from
    # BHASHINI_ASR_SERVICE_ID for every language causes Dhruva's generic 500
    # errors for languages not supported by that particular model.
    # Resolve the model for the selected language through the config API.
    try:
        cfg = await _get_pipeline_config([{
            "taskType": "asr",
            "config": {"language": {"sourceLanguage": source_lang}},
        }])
        sid = _extract_service_id(cfg, "asr")
        if sid:
            logger.info("ASR serviceId for '%s': %s", source_lang, sid)
        return sid
    except Exception as exc:
        logger.warning("ASR config fetch failed for '%s': %s", source_lang, exc)
        return ""


@router.post("/detect-and-translate")
async def detect_and_translate(body: DetectAndTranslateRequest) -> dict:
    if not CONFIG.bhashini_configured:
        return {"original_text": body.text, "translated_text": body.text,
                "detected_language_code": "en", "detected_language_name": "English",
                "target_language": body.target_language, "provider": "mock_unconfigured"}

    detected_lang = await _detect_language(body.text)
    detected_name = LANGUAGE_NAMES.get(detected_lang, detected_lang.upper())

    if detected_lang == body.target_language:
        return {"original_text": body.text, "translated_text": body.text,
                "detected_language_code": detected_lang, "detected_language_name": detected_name,
                "target_language": body.target_language, "provider": "bhashini_tld_no_translate_needed"}

    try:
        translated = await _nmt_translate(body.text, detected_lang, body.target_language)
    except Exception as exc:
        logger.error("Bhashini NMT failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"Bhashini NMT failed: {exc}")

    return {"original_text": body.text, "translated_text": translated,
            "detected_language_code": detected_lang, "detected_language_name": detected_name,
            "target_language": body.target_language, "provider": "bhashini_tld_nmt"}


@router.post("/asr-translate")
async def asr_and_translate(body: ASRTranslateRequest) -> dict:
    """Speech-to-text via Bhashini ASR, then translate to English."""
    if not CONFIG.bhashini_configured:
        raise HTTPException(status_code=503, detail="Bhashini is not configured on this server.")

    src = body.source_language
    tgt = body.target_language
    src_name = LANGUAGE_NAMES.get(src, src.upper())

    # Step 1: Get ASR serviceId dynamically from Bhashini
    asr_service_id = await _get_asr_service_id(src)

    if not asr_service_id:
        # Sending an ASR request without a matching service ID makes Bhashini
        # return an opaque 500. Give the user an actionable response instead.
        raise HTTPException(
            status_code=422,
            detail=(
                f"Bhashini ASR is not available for {src_name} ({src}) in the "
                "configured pipeline. Please type the request or select a "
                "language with an available Bhashini ASR model."
            ),
        )
    # Step 2: Build ASR payload
    # Bhashini Dhruva ASR supports: wav, flac, mp3, pcm; webm/opus may not be supported
    # by all language models. Default to wav for best compatibility.
    audio_fmt = body.audio_format if hasattr(body, "audio_format") else "wav"
    sample_rate = body.sample_rate if hasattr(body, "sample_rate") else 16000

    asr_config: dict = {
        "language": {"sourceLanguage": src},
        "audioFormat": audio_fmt,
        "samplingRate": sample_rate,
    }
    if asr_service_id:
        asr_config["serviceId"] = asr_service_id

    audio_content = body.audio_content.strip()
    if audio_content.startswith("data:") and "," in audio_content:
        audio_content = audio_content.split(",", 1)[1]
    audio_content = "".join(audio_content.split())

    asr_payload = {
        "pipelineTasks": [{"taskType": "asr", "config": asr_config}],
        "inputData": {"audio": [{"audioContent": audio_content}]},
    }

    # Step 3: Call ASR (with fallback on format mismatch)
    transcribed = ""
    try:
        asr_data = await _call_inference(asr_payload)
        transcribed = _extract_asr_text(asr_data)
        logger.info("Bhashini ASR '%s' transcript (%s chars): %s", src, len(transcribed), transcribed[:120])
    except httpx.HTTPStatusError as exc:
        # If Bhashini returns 500 with webm, retry with wav (browser conversion)
        if exc.response.status_code == 500 and audio_fmt == "webm":
            logger.warning("Bhashini ASR 500 with webm, retrying with wav format")
            asr_config["audioFormat"] = "wav"
            asr_payload["pipelineTasks"][0]["config"] = asr_config
            try:
                asr_data = await _call_inference(asr_payload)
                transcribed = _extract_asr_text(asr_data)
            except Exception as retry_exc:
                logger.error("Bhashini ASR retry also failed: %s", retry_exc)
                raise HTTPException(
                    status_code=502,
                    detail=f"Bhashini ASR is temporarily unavailable for {src_name}. Please type your request instead.",
                )
        else:
            logger.error("Bhashini ASR failed (%s): %s", exc.response.status_code, exc)
            raise HTTPException(
                status_code=502,
                detail=f"Bhashini ASR is temporarily unavailable for {src_name}. Please type your request instead.",
            )
    except Exception as exc:
        logger.error("Bhashini ASR network error: %s", exc)
        raise HTTPException(
            status_code=502,
            detail=f"Could not reach Bhashini ASR service. Please check your connection or type your request.",
        )

    if not transcribed or not transcribed.strip():
        return {"transcribed_text": "", "translated_text": "", "source_language": src,
                "source_language_name": src_name, "target_language": tgt, "provider": "bhashini_asr_empty"}

    # Step 4: NMT translate
    translated_text = transcribed
    if src != tgt:
        try:
            translated_text = await _nmt_translate(transcribed, src, tgt)
        except Exception as exc:
            logger.warning("NMT after ASR failed (%s) — returning raw transcript", exc)
            translated_text = transcribed

    return {"transcribed_text": transcribed, "translated_text": translated_text,
            "source_language": src, "source_language_name": src_name,
            "target_language": tgt, "provider": "bhashini_asr_nmt"}


@router.post("/translate")
async def translate(body: TranslateRequest) -> dict:
    if not CONFIG.bhashini_configured:
        return {"original_text": body.text, "translated_text": body.text,
                "source_language": body.source_language, "target_language": body.target_language,
                "provider": "mock_unconfigured"}

    if body.source_language == body.target_language:
        return {"original_text": body.text, "translated_text": body.text,
                "source_language": body.source_language, "target_language": body.target_language,
                "provider": "no_op"}

    try:
        translated = await _nmt_translate(body.text, body.source_language, body.target_language)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    return {"original_text": body.text, "translated_text": translated,
            "source_language": body.source_language, "target_language": body.target_language,
            "provider": "bhashini_nmt"}


@router.post("/tts")
async def text_to_speech(body: TTSRequest) -> dict:
    if not CONFIG.bhashini_configured:
        raise HTTPException(status_code=503, detail="Bhashini is not configured on this server.")

    tts_service_id = CONFIG.bhashini_tts_service_id or ""
    if not tts_service_id:
        try:
            cfg = await _get_pipeline_config([{
                "taskType": "tts",
                "config": {"language": {"sourceLanguage": body.target_language}},
            }])
            tts_service_id = _extract_service_id(cfg, "tts")
        except Exception as exc:
            logger.warning("TTS config fetch failed: %s", exc)

    tts_config: dict = {"language": {"sourceLanguage": body.target_language}, "gender": body.gender}
    if tts_service_id:
        tts_config["serviceId"] = tts_service_id

    payload = {
        "pipelineTasks": [{"taskType": "tts", "config": tts_config}],
        "inputData": {"input": [{"source": body.text}]},
    }
    try:
        data = await _call_inference(payload)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    output = data.get("pipelineResponse", [{}])[0].get("output", [{}])[0]
    return {"audio_content": output.get("audioContent", ""), "audio_format": output.get("audioFormat", "wav"),
            "target_language": body.target_language, "provider": "bhashini_tts"}


@router.get("/status")
async def bhashini_status() -> dict:
    return {
        "configured": CONFIG.bhashini_configured,
        "api_url": BHASHINI_INFERENCE_URL,
        "quota": {"used": 0, "limit": "Unlimited", "remaining": "Unlimited"},
        "services": {
            "tld": "auto",
            "nmt": CONFIG.bhashini_translation_service_id or "dynamic",
            "asr": CONFIG.bhashini_asr_service_id or "dynamic",
            "tts": CONFIG.bhashini_tts_service_id or "dynamic",
        },
    }
