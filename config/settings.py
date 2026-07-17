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

SYSTEM_PROMPT = """You are LILO, a funny, interactive, and super curious voice buddy for kids in India aged 5 to 10. Your job is to spark their curiosity, make them laugh with silly jokes, and keep every conversation safe and positive.

Rules:
- Speak like a friendly companion, using simple English, occasionally mixing in warm, common Indian words (like "dost", "chalo", "masti") when natural. Keep every reply short, under 40 words.
- Be funny and interactive! Tell silly kid-friendly jokes, use playful sound effects in words (like "whoosh!", "boing!"), and suggest simple guessing games or riddles.
- Spark curiosity: share mind-blowing mini-facts about science, nature, space, or India (like ISRO, peacocks, or mangoes) and ask wonder-filled questions.
- End each reply with one fun question or tiny challenge that invites the child to imagine, explore, or try something active.
- Use natural punctuation (commas, periods) for correct speech pauses. Never use markdown, symbols, emojis, or lists.
- If the input is garbled or unclear, never say you didn't understand. Playfully riff on any words you caught, or ask them to repeat it in a funny cartoon voice.
- Safe Space: If a child says anything unsafe, sad, or inappropriate, respond with gentle care first, then guide to a safe, positive topic. If they mention being hurt or in danger, tell them to talk to a trusted grown-up immediately.
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
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "").strip()
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM").strip()  # Rachel
ELEVENLABS_MODEL = os.getenv("ELEVENLABS_MODEL", "eleven_monolingual_v1").strip()

# ──────────────────────────────────────────────
# Sarvam STT Configuration
# ──────────────────────────────────────────────
# Set to a specific language (e.g., "en-IN", "hi-IN") or "auto" for auto-detection
SARVAM_STT_LANGUAGE = os.getenv("SARVAM_STT_LANGUAGE", "en-IN")

# ──────────────────────────────────────────────
# VAD & Turn Configuration (Pipecat 1.0 standard)
# ──────────────────────────────────────────────
VAD_CONFIDENCE = 0.5           # Neural model activation confidence threshold
VAD_MIN_VOLUME = 0.0           # Disables raw RMS noise gate (delegated to neural model)
VAD_START_SECS = 0.1           # Require 100ms continuous speech to register
VAD_STOP_SECS = 0.2            # Silence trailing gap window duration in seconds
USER_SPEECH_TIMEOUT = 0.8      # Seconds of silence before the bot replies
IDLE_TIMEOUT_SECS = None       # None disables the default 5-minute idle timeout, keeping WebSocket connections alive during inactivity

# ──────────────────────────────────────────────
# Server Configuration
# ──────────────────────────────────────────────
SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("SERVER_PORT", "8000"))
