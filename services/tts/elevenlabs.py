import logging
from pipecat.services.elevenlabs.tts import ElevenLabsTTSService, ElevenLabsTTSSettings
from pipecat.services.tts_service import TextAggregationMode
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
        stability=0.45,
        similarity_boost=0.75,
        style=0.15,
        use_speaker_boost=False,
        speed=0.92
    )

    tts = ElevenLabsTTSService(
        api_key=ELEVENLABS_API_KEY,
        sample_rate=AUDIO_OUT_SAMPLE_RATE,
        settings=settings,
        text_aggregation_mode=TextAggregationMode.TOKEN
    )

    return tts
