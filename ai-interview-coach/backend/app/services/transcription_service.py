import httpx
from app.core.config import settings

DEEPGRAM_URL = "https://api.deepgram.com/v1/listen"

async def transcribe_audio(audio_bytes: bytes, mimetype: str = "audio/webm") -> str:
    """
    Transcribe audio bytes using Deepgram Nova-2 model.
    Falls back to a placeholder if no API key is set (for local testing).
    """
    if not settings.deepgram_api_key:
        return "[Transcription unavailable - add DEEPGRAM_API_KEY to .env]"

    headers = {
        "Authorization": f"Token {settings.deepgram_api_key}",
        "Content-Type": mimetype,
    }
    params = {
        "model": "nova-2",
        "smart_format": "true",
        "punctuate": "true",
        "filler_words": "true",   # Deepgram detects um/uh natively
        "language": "en",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            DEEPGRAM_URL,
            headers=headers,
            params=params,
            content=audio_bytes,
        )
        response.raise_for_status()
        data = response.json()

    transcript = (
        data.get("results", {})
        .get("channels", [{}])[0]
        .get("alternatives", [{}])[0]
        .get("transcript", "")
    )
    return transcript
