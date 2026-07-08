"""

LILO Voice Assistant — Application Entry Point

FastAPI server that accepts WebSocket connections from ESP32 devices
and runs a Pipecat voice assistant pipeline for each connection.

Usage:
    python main.py
    # or
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload


"""

import os
import sys

# ── Windows Opus DLL Discovery Workaround ───────────────────────────
if sys.platform == "win32":
    import ctypes
    # Try to find pyogg folder inside current virtualenv site-packages
    base_dir = os.path.dirname(os.path.abspath(__file__))
    pyogg_dir = os.path.join(base_dir, "venv", "Lib", "site-packages", "pyogg")
    if os.path.isdir(pyogg_dir):
        os.environ["PATH"] = pyogg_dir + os.pathsep + os.environ.get("PATH", "")
        if hasattr(os, "add_dll_directory"):
            try:
                os.add_dll_directory(pyogg_dir)
            except Exception:
                pass

    try:
        ctypes.windll.winmm.timeBeginPeriod(1)
        print("⚡ System: Windows clock precision successfully scaled to 1ms interval.")
    except Exception as e:
        print(f"⚠️ System: Failed to set Windows timer resolution: {e}")

import logging

import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from websocket_handler import handle_esp32_connection
from config.settings import SERVER_HOST, SERVER_PORT

# ── Logging Setup ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)-25s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# Suppress verbose Loguru DEBUG logs from Pipecat which block the Windows console
try:
    from loguru import logger as loguru_logger
    loguru_logger.remove()  # Remove default handler (prints DEBUG)
    loguru_logger.add(sys.stderr, level="INFO")  # Only print INFO and above
except ImportError:
    pass

# ── FastAPI App ────────────────────────────────────────────────────
app = FastAPI(
    title="LILO Voice Assistant",
    description="ESP32-based voice assistant powered by Pipecat",
    version="1.0.0",
)

# CORS — allow all origins for ESP32 and development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health Check ───────────────────────────────────────────────────
@app.get("/")
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "running",
        "service": "LILO Voice Assistant",
        "version": "1.0.0",
    }


# ── WebSocket Endpoint ────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for ESP32 voice assistant sessions.

    Protocol:
    - ESP32 sends: Opus-encoded mono 16kHz audio bytes (binary messages)
    - Server sends: Opus-encoded audio bytes (binary) or "[INTERRUPT]" (text)
    """
    await handle_esp32_connection(websocket)


# ── Main Entry Point ──────────────────────────────────────────────
if __name__ == "__main__":
    reload_mode = os.getenv("RELOAD", "False").lower() == "true"
    logger.info(f"Starting LILO Voice Assistant on {SERVER_HOST}:{SERVER_PORT} (reload={reload_mode})")
    uvicorn.run(
        "main:app",
        host=SERVER_HOST,
        port=SERVER_PORT,
        reload=reload_mode,
        log_level="info",
    )

