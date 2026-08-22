from google.cloud import translate_v2 as translate
import os

# Initialize the translation client.
# This assumes GOOGLE_APPLICATION_CREDENTIALS environment variable is set.
def get_translation_client():
    try:
        return translate.Client()
    except Exception as e:
        print(f"Failed to initialize Translation Client: {e}")
        return None

def translate_to_english(text: str) -> dict:
    """
    Translates text to English using Google Cloud Translation API.
    Returns a dictionary containing the translated text and the detected source language.
    """
    if not text:
        return {"translated_text": "", "source_language": "en"}
        
    client = get_translation_client()
    if not client:
        # Fallback if no credentials available during development
        return {"translated_text": f"[Mock Translation] {text}", "source_language": "unknown"}

    try:
        result = client.translate(text, target_language='en')
        return {
            "translated_text": result['translatedText'],
            "source_language": result['detectedSourceLanguage']
        }
    except Exception as e:
        print(f"Translation API error: {e}")
        return {"translated_text": text, "source_language": "error"}

if __name__ == "__main__":
    # Test the service
    sample_text = "नमस्ते, मुझे मदद चाहिए।"
    print(f"Original: {sample_text}")
    print(translate_to_english(sample_text))
