"""
LILO Voice Assistant — Sarvam Speech-to-Text Service

Factory for creating a configured SarvamSTTService instance.
Uses Sarvam AI's WebSocket API for real-time transcription.

Requires:
    - SARVAM_API_KEY environment variable
    - pip install "pipecat-ai[sarvam]"
"""

from pipecat.services.sarvam.stt import SarvamSTTService
from pipecat.transcriptions.language import Language

from config.settings import SARVAM_API_KEY, SARVAM_STT_LANGUAGE


def create_stt_service() -> SarvamSTTService:
    """
    Creates and returns a configured Sarvam STT service.

    The service uses streaming recognition optimized for voice assistants:
    - Model: saaras:v3 (advanced, supports mode and fine-grained VAD)
    - Language: dynamically set or 'auto' (None) for multilingual auto-detection
    """
    # Map "auto" to None, which enables Sarvam's automatic language detection
    stt_lang = None if SARVAM_STT_LANGUAGE == "auto" else SARVAM_STT_LANGUAGE

    stt = SarvamSTTService(
        api_key=SARVAM_API_KEY,
        settings=SarvamSTTService.Settings(
            model="saaras:v3",
            language=stt_lang,
        )
    )

    return stt
