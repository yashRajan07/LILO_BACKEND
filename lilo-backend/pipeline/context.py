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
from database import get_child_profile, get_learning_controls


# ── Topic Label Mapping ───────────────────────────────────────────
TOPIC_LABELS = {
    "science_space": "Science & Space",
    "indian_culture": "Indian Culture & Mythology",
    "math_riddles": "Math Riddles",
    "moral_stories": "Moral Stories",
    "animals_nature": "Animals & Nature",
}


def _build_dynamic_system_prompt() -> str:
    """
    Builds the LLM system prompt dynamically by enriching the base SYSTEM_PROMPT
    with parent-configured child profile and learning controls.
    """
    try:
        profile = get_child_profile()
        controls = get_learning_controls()
    except Exception as e:
        logger.warning(f"Could not load parent settings from DB, using defaults: {e}")
        return SYSTEM_PROMPT

    # ── Child personalization block ───────────────────────────────
    child_name = profile.get("child_name", "Buddy")
    age = profile.get("age", 7)
    hinglish = profile.get("hinglish_ratio", "moderate_hinglish")

    hinglish_instruction = {
        "english_only": "Speak in pure English only. Do not use any Hinglish or Hindi words.",
        "moderate_hinglish": "Use simple English with occasional phonetic Hinglish words (e.g., dost, masti, waah, chalo).",
        "high_hinglish": "Use a rich mix of English and Hinglish throughout your responses. Freely use Hindi words and phrases.",
    }.get(hinglish, "Use simple English with occasional Hinglish.")

    # ── Learning focus block ─────────────────────────────────────
    target_topics = controls.get("target_topics", [])
    banned_topics = controls.get("banned_topics", [])

    topic_labels = [TOPIC_LABELS.get(t, t) for t in target_topics]
    topics_instruction = ""
    if topic_labels:
        topics_instruction = f"\n   FOCUS TOPICS: Whenever possible, steer conversation toward these subjects: {', '.join(topic_labels)}."

    banned_instruction = ""
    if banned_topics:
        banned_instruction = f"\n   BANNED TOPICS: Never discuss or mention these topics under any circumstances: {', '.join(banned_topics)}. If asked about them, redirect politely."

    # ── Assemble the enriched prompt ─────────────────────────────
    dynamic_addendum = f"""

  PARENT-CONFIGURED PERSONALIZATION:
   - The child's name is {child_name}. Address them by name sometimes.
   - The child is {age} years old. Adjust vocabulary complexity to suit a {age}-year-old.
   - LANGUAGE STYLE: {hinglish_instruction}{topics_instruction}{banned_instruction}
"""

    enriched_prompt = SYSTEM_PROMPT + dynamic_addendum
    logger.info(f"Dynamic system prompt built for {child_name} (age {age}, hinglish={hinglish})")
    return enriched_prompt


def create_context_aggregator() -> tuple[LLMContext, LLMContextAggregatorPair]:
    # Build dynamic system prompt from parent settings
    system_prompt = _build_dynamic_system_prompt()

    # Initialize context with the enriched LILO system prompt
    context = LLMContext(
        messages=[
            {
                "role": "system",
                "content": system_prompt,
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