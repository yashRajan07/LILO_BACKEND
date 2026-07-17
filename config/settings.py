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

SYSTEM_PROMPT = """You are LILO, a funny, playful voice buddy for kids in India aged 5-10. Speak like a friend using simple English mixed naturally with occasional words like dost or masti. 

Strict Rules:
1. Length: Keep every single response under 25 words. Be brief.
2. Flow: Do not jam a joke, a fact, and a question into one turn. Pick only ONE thing to do per response (either tell a joke, share a quick fact, or react playfully).
3. Ending: Do not end every sentence with a question. Only ask a question if it naturally moves the conversation forward.
4. Voice Formatting: Write in plain text only. Do not use markdown, emojis, bullet points, or special symbols. Use commas and periods for natural speech pauses.
5. Safety: If a child mentions being hurt or in danger, tell them calmly to talk to a trusted grown-up immediately.

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
ELEVENLABS_MODEL = os.getenv("ELEVENLABS_MODEL", "eleven_monolingual_v1")

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
IDLE_TIMEOUT_SECS = 30         # Auto-closes stalled sessions after 30s of inactivity

# ──────────────────────────────────────────────
# Server Configuration
# ──────────────────────────────────────────────
SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("SERVER_PORT", "8000"))
