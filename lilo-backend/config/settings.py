"""
LILO Voice Assistant — Configuration Settings

Centralized configuration loaded from environment variables via .env file.
All API keys, audio parameters, and server settings live here.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ──────────────────────────────────────────────
# API Keys
# ──────────────────────────────────────────────
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "")

# ──────────────────────────────────────────────
# Audio Configuration
# ──────────────────────────────────────────────
AUDIO_IN_SAMPLE_RATE = 16000       # 16kHz — ESP32 mic & playback rate
AUDIO_CHUNK_SIZE = 640          # 20ms at 16kHz, 16-bit mono = 640 bytes
AUDIO_OUT_SAMPLE_RATE = 24000   # TTS output rate (24kHz matches the ESP32's native hardware playback rate)
AUDIO_OUT_FORMAT = "linear16"        # Output format: "opus" or "linear16" (PCM)
AUDIO_FRAME_SIZE_MS = 60             # Frame size in milliseconds for Opus encoding

# ──────────────────────────────────────────────
# LLM Configuration (OpenRouter)
# ──────────────────────────────────────────────
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
LLM_MODEL = "openai/gpt-4o-mini"

SYSTEM_PROMPT = """
name: Lilo Companion Toy
instructions: |
  You are LILO, a friendly companion toy for Indian kids (ages 5-10). Talk like a warm best friend using simple English with occasional phonetic Hinglish (e.g., dost, masti, waah, chalo).

  CORE RULES:
  1. ENGAGEMENT LOGIC:
     - IF CHILD IS CURIOUS / ASKS A QUESTION: Give a direct, simple answer. Do NOT add extra questions or unprompted facts.
     - IF CHILD IS BORED / UNINTERESTED: Spark curiosity with an exciting Indian fact, silly scenario, or playful question.
  2. INDIAN CONTEXT: Use relatable Indian references (peacocks, mangoes, monsoon, space rockets) and everyday examples.
  3. VOICE CONSTRAINTS: Strictly under 30 words per turn. One idea per response. Output plain text ONLY (no markdown, lists, or emojis). Spell numbers as words.

  SPECIAL HANDLERS:
  - START: Greet with "Namaste dost!" and ask what they want to explore.
  - SENSITIVE / COMPLEX TOPICS: Redirect: "That is a bit too complicated for today! Want to hear a cool space fact instead?"
  - SAFETY: If hurt, scared, or in danger, drop persona and say exactly: "I am listening to you, dost. Please go tell a trusted grown up like your mummy or papa right now so they can help."

  FEW-SHOT EXAMPLES:

  User: "Why do peacocks dance?"
  Lilo: "Peacocks dance during the monsoon rain to show off their colorful feathers and call out to their friends!"

  User: "What is five plus five?"
  Lilo: "Five plus five equals ten!"

  User: "I don't know."
  Lilo: "Did you know India has a floating post office on a lake in Kashmir? How cool is that, dost?"

  User: "I am bored."
  Lilo: "Oh no, zero masti! Would you rather ride an elephant through a jungle or fly in a rocket to the moon?"
"""

# ──────────────────────────────────────────────
# TTS Provider Configuration
# ──────────────────────────────────────────────
TTS_PROVIDER = os.getenv("TTS_PROVIDER", "sarvam")  # "sarvam" or "elevenlabs"

# ──────────────────────────────────────────────
# Sarvam TTS Configuration
# ──────────────────────────────────────────────
SARVAM_TTS_MODEL = "bulbul:v3"
SARVAM_TTS_VOICE = "shubh"
SARVAM_TTS_LANGUAGE = os.getenv("SARVAM_TTS_LANGUAGE", "en-IN")  # Set to "hi-IN" for Hindi

# ──────────────────────────────────────────────
# ElevenLabs TTS Configuration
# ──────────────────────────────────────────────
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Rachel
ELEVENLABS_MODEL = os.getenv("ELEVENLABS_MODEL", "eleven_turbo_v2_5")

# ──────────────────────────────────────────────
# Sarvam STT Configuration
# ──────────────────────────────────────────────
# Set to a specific language (e.g., "en-IN", "hi-IN") or "auto" for auto-detection
SARVAM_STT_LANGUAGE = os.getenv("SARVAM_STT_LANGUAGE", "en-IN")

# ──────────────────────────────────────────────
# VAD & Turn Configuration (Pipecat 1.0 standard)
# ──────────────────────────────────────────────
VAD_CONFIDENCE = 0.5           # Neural model activation confidence threshold
VAD_MIN_VOLUME = 0.05          # Ignored quiet background hum (noise gate)
VAD_START_SECS = 0.1           # Require 100ms continuous speech to register
VAD_STOP_SECS = 0.2            # Silence trailing gap window duration in seconds
USER_SPEECH_TIMEOUT = 0.8      # Seconds of silence before the bot replies
IDLE_TIMEOUT_SECS = None       # None disables the default 5-minute idle timeout, keeping WebSocket connections alive during inactivity

# ──────────────────────────────────────────────
# Server Configuration
# ──────────────────────────────────────────────
SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("SERVER_PORT", "8000"))
