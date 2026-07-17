import logging
from config.settings import TTS_PROVIDER
from pipecat.services.tts_service import TTSService

logger = logging.getLogger(__name__)

def create_tts_service() -> TTSService:
    """
    Factory function to create and return a configured TTS service instance
    based on the current TTS_PROVIDER setting.
    """
    provider = TTS_PROVIDER.lower().strip()
    logger.info(f"Creating TTS service for provider: '{provider}'")

    if provider == "sarvam":
        from services.tts.sarvamtts import create_sarvam_tts_service
        return create_sarvam_tts_service()

    elif provider == "elevenlabs":
        from services.tts.elevenlabs import create_elevenlabs_tts_service
        return create_elevenlabs_tts_service()

    else:
        supported = ["sarvam", "elevenlabs"]
        raise ValueError(
            f"Unsupported TTS_PROVIDER '{provider}'. "
            f"Please choose from: {supported}"
        )
