"""
LILO Voice Assistant — WebSocket Connection Handler

Handles incoming WebSocket connections from ESP32 devices.
Each connection gets its own isolated Pipecat pipeline instance,
supporting multiple concurrent ESP32 devices.
"""

"""
LILO Voice Assistant — WebSocket Connection Handler
"""

import asyncio
import json
import logging
from fastapi import WebSocket, WebSocketDisconnect
from pipecat.workers.runner import WorkerRunner
from pipeline.assistant import create_pipeline_worker
from config.settings import AUDIO_OUT_SAMPLE_RATE, AUDIO_FRAME_SIZE_MS

logger = logging.getLogger(__name__)

async def handle_esp32_connection(websocket: WebSocket):
    await websocket.accept()
    logger.info("LILO device connected — starting handshake")

    try:
        # Wait for the LILO "hello" handshake JSON message with a 10s timeout
        try:
            message_text = await asyncio.wait_for(websocket.receive_text(), timeout=10.0)
            payload = json.loads(message_text)
            if payload.get("type") != "hello":
                logger.error(f"Expected 'hello' handshake message, got: {payload}")
                await websocket.close(code=4000, reason="Invalid handshake")
                return
            
            logger.info(f"Received handshake from LILO client: {payload}")
        except asyncio.TimeoutError:
            logger.error("Handshake timed out waiting for client 'hello'")
            await websocket.close(code=4008, reason="Handshake timeout")
            return
        except json.JSONDecodeError:
            logger.error("Failed to parse handshake JSON")
            await websocket.close(code=4003, reason="Invalid JSON")
            return

        # Send server "hello" handshake response
        handshake_response = {
            "type": "hello",
            "transport": "websocket",
            "audio_params": {
                "sample_rate": AUDIO_OUT_SAMPLE_RATE,
                "frame_duration": AUDIO_FRAME_SIZE_MS
            }
        }
        await websocket.send_text(json.dumps(handshake_response))
        logger.info("Sent handshake response to LILO client. Handshake successful.")

        # Create an isolated pipeline for this LILO session
        worker = await create_pipeline_worker(websocket)

        # Run the pipeline
        runner = WorkerRunner()
        await runner.add_workers(worker) # Modern Pipecat syntax
        await runner.run()               # Blocks until completion

    except WebSocketDisconnect:
        logger.info("LILO client disconnected gracefully")

    except Exception as e:
        logger.error(f"Session error: {e}", exc_info=True)

    finally:
        logger.info("LILO session ended — resources cleaned up")