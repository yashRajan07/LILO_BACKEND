import logging
from pipecat.services.elevenlabs.tts import ElevenLabsTTSService, ElevenLabsTTSSettings
from config.settings import (
    ELEVENLABS_API_KEY,
    ELEVENLABS_VOICE_ID,
    ELEVENLABS_MODEL,
    AUDIO_OUT_SAMPLE_RATE,
)

logger = logging.getLogger(__name__)

def create_elevenlabs_tts_service() -> ElevenLabsTTSService:
    """
    Instantiates and returns the streaming WebSocket-based ElevenLabsTTSService.
    """
    logger.info(f"Initializing ElevenLabs TTS  Service (Model: {ELEVENLABS_MODEL}, Voice ID: {ELEVENLABS_VOICE_ID})")
    
    settings = ElevenLabsTTSSettings(
        model=ELEVENLABS_MODEL,
        voice=ELEVENLABS_VOICE_ID,
        stability=0.95,
        similarity_boost=0.10,
        style=0.50,
        speed=0.88
    )

    tts = ElevenLabsTTSService(
        api_key=ELEVENLABS_API_KEY,
        sample_rate=AUDIO_OUT_SAMPLE_RATE,
        settings=settings,
    )

    return tts
