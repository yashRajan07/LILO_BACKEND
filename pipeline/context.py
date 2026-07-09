import logging
logger = logging.getLogger(__name__)

from pipecat.processors.aggregators.llm_context import LLMContext
from pipecat.processors.aggregators.llm_response_universal import (
    LLMContextAggregatorPair,
    LLMUserAggregatorParams,
)
from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.audio.vad.vad_analyzer import VADParams
from pipecat.turns.user_turn_strategies import UserTurnStrategies
from pipecat.turns.user_start import MinWordsUserTurnStartStrategy
from pipecat.turns.user_stop import SpeechTimeoutUserTurnStopStrategy

from config.settings import (
    SYSTEM_PROMPT,
    AUDIO_IN_SAMPLE_RATE,
    VAD_CONFIDENCE,
    VAD_MIN_VOLUME,
    VAD_START_SECS,
    VAD_STOP_SECS,
    USER_SPEECH_TIMEOUT,
)

def create_context_aggregator() -> tuple[LLMContext, LLMContextAggregatorPair]:
    # Initialize context with the LILO system prompt
    context = LLMContext(
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            }
        ]
    )

    # Attach VAD and Turn Strategies to the User Aggregator
    user_params = LLMUserAggregatorParams(
        vad_analyzer=SileroVADAnalyzer(
            sample_rate=AUDIO_IN_SAMPLE_RATE,
            params=VADParams(
                confidence=VAD_CONFIDENCE,
                min_volume=VAD_MIN_VOLUME,
                start_secs=VAD_START_SECS,
                stop_secs=VAD_STOP_SECS
            ),
        ),
        user_turn_strategies=UserTurnStrategies(
            # Start: Bot stops talking when user says at least 1 word
            start=[MinWordsUserTurnStartStrategy(min_words=1)],
            # Stop: Bot replies after X seconds of silence
            stop=[SpeechTimeoutUserTurnStopStrategy(user_speech_timeout=USER_SPEECH_TIMEOUT)],
        ),
    )

    # Create the aggregator pair with the new configuration
    aggregator = LLMContextAggregatorPair(context, user_params=user_params)


    return context, aggregator