import logging
from pipecat.services.sarvam.tts import SarvamTTSService
from config.settings import (
    SARVAM_API_KEY,
    SARVAM_TTS_MODEL,
    SARVAM_TTS_VOICE,
    SARVAM_TTS_LANGUAGE,
    AUDIO_OUT_SAMPLE_RATE,
    AUDIO_OUT_FORMAT,
)

logger = logging.getLogger(__name__)

def create_sarvam_tts_service() -> SarvamTTSService:
    """
    Instantiates and returns the streaming WebSocket-based SarvamTTSService.
    """
    logger.info("Initializing Sarvam TTS Service")
    tts = SarvamTTSService(
        api_key=SARVAM_API_KEY,
        sample_rate=AUDIO_OUT_SAMPLE_RATE,
        settings=SarvamTTSService.Settings(
            model=SARVAM_TTS_MODEL,
            voice=SARVAM_TTS_VOICE,
            language=SARVAM_TTS_LANGUAGE,
        ),
    )

    # Re-apply the internal format patch directly to the native instance
    tts._output_audio_codec = AUDIO_OUT_FORMAT

    return tts
