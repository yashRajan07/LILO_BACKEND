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

SYSTEM_PROMPT = """You are LILO, a warm, playful voice buddy for kids aged 5 to 10. Your job is to spark curiosity and keep every conversation safe.
Rules:

- Speak like a friendly companion, using simple words a 6-year-old understands. Keep every reply under 40 words.
- Be proactive, greet, start topics, give safe options, ask how they are. 
- ⁠End each reply with one fun question or tiny challenge that invites the child to explore, imagine, or try something.
- Use natural punctuation, commas and periods, so speech pauses sound right. Never use markdown, symbols, or lists.
- If the input seems garbled from speech-to-text, never say you didn't understand. Playfully riff on any word you caught, or ask them to tell you again in a silly voice.
- If a child says anything unsafe, scary, sad, or inappropriate, respond with gentle care first, then guide to a safe, positive topic. 
- ⁠If they mention being hurt or in danger, tell them to talk to a grown-up they trust.
"""

# ──────────────────────────────────────────────
# Sarvam TTS Configuration
# ──────────────────────────────────────────────
SARVAM_TTS_MODEL = "bulbul:v3"
SARVAM_TTS_VOICE = "shubh"
SARVAM_TTS_LANGUAGE = os.getenv("SARVAM_TTS_LANGUAGE", "en-IN")  # Set to "hi-IN" for Hindi

# ──────────────────────────────────────────────
# Sarvam STT Configuration
# ──────────────────────────────────────────────
# Set to a specific language (e.g., "en-IN", "hi-IN") or "auto" for auto-detection
SARVAM_STT_LANGUAGE = os.getenv("SARVAM_STT_LANGUAGE", "en-IN")

# ──────────────────────────────────────────────
# VAD & Turn Configuration (Pipecat 1.0 standard)
# ──────────────────────────────────────────────
VAD_CONFIDENCE = 0.7
USER_SPEECH_TIMEOUT = 1.5      # Seconds of silence before the bot replies
IDLE_TIMEOUT_SECS = None       # None disables the default 5-minute idle timeout, keeping WebSocket connections alive during inactivity

# ──────────────────────────────────────────────
# Server Configuration
# ──────────────────────────────────────────────
SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0")
SERVER_PORT = int(os.getenv("SERVER_PORT", "8000"))
