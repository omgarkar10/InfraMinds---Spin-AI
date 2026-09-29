/**
 * Bhashini API service — frontend client.
 * All actual API keys live on the backend; this module only calls our own FastAPI endpoints.
 */

const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8080/api`;

export interface DetectAndTranslateResult {
  original_text: string;
  translated_text: string;
  detected_language_code: string;
  detected_language_name: string;
  target_language: string;
  provider: string;
}

/**
 * Auto-detects the language of `text` using Bhashini TLD, then translates it
 * to `targetLanguage` (default: "en") using Bhashini NMT.
 * The caller does NOT need to know the source language — Bhashini figures it out.
 */
export async function detectAndTranslate(
  text: string,
  targetLanguage = "en"
): Promise<DetectAndTranslateResult> {
  const response = await fetch(`${API_BASE}/bhashini/detect-and-translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, target_language: targetLanguage }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Bhashini service error: ${response.status}`);
  }

  return response.json();
}

/**
 * Translate text from a known source language to a target language.
 */
export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage = "en"
): Promise<{ translated_text: string; source_language: string }> {
  const response = await fetch(`${API_BASE}/bhashini/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      source_language: sourceLanguage,
      target_language: targetLanguage,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Bhashini translate error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get Bhashini service status and quota.
 */
export async function getBhashiniStatus(): Promise<{
  configured: boolean;
  quota: { used: number; limit: number; remaining: number };
}> {
  const response = await fetch(`${API_BASE}/bhashini/status`);
  if (!response.ok) throw new Error("Could not fetch Bhashini status");
  return response.json();
}

/**
 * Send base64-encoded audio to Bhashini ASR, get transcription in native script
 * + English translation in one call.
 */
export async function speechToText(
  audioBase64: string,
  sourceLanguage: string,
  targetLanguage = "en"
): Promise<{
  transcribed_text: string;
  translated_text: string;
  source_language: string;
  source_language_name: string;
  target_language: string;
  provider: string;
}> {
  const response = await fetch(`${API_BASE}/bhashini/asr-translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      audio_content: audioBase64,
      source_language: sourceLanguage,
      target_language: targetLanguage,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Bhashini ASR error: ${response.status}`);
  }

  return response.json();
}
