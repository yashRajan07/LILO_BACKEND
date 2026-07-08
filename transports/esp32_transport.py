import json
import struct
import asyncio
import logging
from fastapi import WebSocketDisconnect
from pipecat.processors.frame_processor import FrameProcessor
from pipecat.frames.frames import AudioRawFrame, InterruptionFrame, EndFrame, TTSStartedFrame, TTSStoppedFrame
from pipeline.frames import OutboundOpusAudioFrame, InboundOpusAudioFrame

logger = logging.getLogger(__name__)

class ESP32Transport:
    def __init__(self, websocket):
        self.ws = websocket
        self._input_processor = ESP32InputProcessor(websocket)
        self._output_processor = ESP32OutputProcessor(websocket)

    def input(self) -> FrameProcessor:
        return self._input_processor

    def output(self) -> FrameProcessor:
        return self._output_processor


class ESP32InputProcessor(FrameProcessor):
    def __init__(self, websocket):
        super().__init__()
        self.ws = websocket
        self.reading_started = False

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)
        if not self.reading_started:
            asyncio.create_task(self._read_session_loop(direction))
            self.reading_started = True
        await self.push_frame(frame, direction)

    async def _read_session_loop(self, direction):
        try:
            while True:
                message = await self.ws.receive()

                # ── 1. CRUCIAL ASGI DISCONNECT GATEKEEPER ────────────────────
                # Intercept the raw disconnect event dictionary before it loops
                if message.get("type") == "websocket.disconnect":
                    raise WebSocketDisconnect(code=message.get("code", 1000))

                # ── 2. HANDLE MIC AUDIO (BINARY) ─────────────────────────────
                if "bytes" in message:
                    raw_bytes = message["bytes"]
                    if len(raw_bytes) < 4: 
                        continue
                    p_type, reserved, payload_size = struct.unpack(">BBH", raw_bytes[:4])
                    if payload_size > len(raw_bytes) - 4: 
                        continue
                    
                    mic_opus_payload = raw_bytes[4 : 4 + payload_size]
                    
                    # Wrap the raw compressed network bytes explicitly
                    await self.push_frame(InboundOpusAudioFrame(data=mic_opus_payload), direction)

                # ── 3. HANDLE INBOUND COMMANDS (TEXT) ────────────────────────
                elif "text" in message:
                    text_data = message["text"]
                    if text_data == "[INTERRUPT]":
                        await self.push_frame(InterruptionFrame(), direction)
                        continue
                    try:
                        data = json.loads(text_data)
                        if data.get("type") == "abort":
                            await self.push_frame(InterruptionFrame(), direction)
                    except json.JSONDecodeError:
                        pass

        except (WebSocketDisconnect, asyncio.CancelledError):
            logger.info("ESP32 network connection disconnected. Initiating pipeline teardown...")
        except Exception as e:
            logger.error(f"Inbound network loop encountered an anomaly: {e}", exc_info=True)
        finally:
            # Inform Pipecat that this session is over so resources clean up cleanly
            logger.info("ESP32InputProcessor loop closed. Propagating EndFrame down the belt.")
            await self.push_frame(EndFrame(), direction)


class ESP32OutputProcessor(FrameProcessor):
    def __init__(self, websocket):
        super().__init__()
        self.ws = websocket
        self.packets_sent = 0
        self.total_bytes_sent = 0

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)
        
        # ── 1. BINARY AUDIO STREAM ROUTING ──────────────────────────────────
        if isinstance(frame, OutboundOpusAudioFrame):
            try:
                payload = frame.data
                header = struct.pack(">BBH", 0, 0, len(payload))
                full_packet = header + payload
                
                await self.ws.send_bytes(full_packet)
                
                self.packets_sent += 1
                self.total_bytes_sent += len(full_packet)
                
                if self.packets_sent % 10 == 0 or self.packets_sent == 1:
                    logger.debug(f"🚀 Network Flush: Packet #{self.packets_sent} sent successfully.")
            except Exception as e:
                logger.error(f"❌ Network Drop: Failed to write audio packet: {e}")
            return  # Consume the audio frame

        # ── 2. STATE NOTIFICATIONS: Custom Sequenced Control Frames ─────────
        elif isinstance(frame, TTSStartedFrame) or isinstance(frame, TTSStoppedFrame):
            try:
                if isinstance(frame, TTSStartedFrame):
                    logger.debug(f"🚀 Network Flush: Dispatching text event -> type: tts, state:start")
                    await self.ws.send_text(json.dumps({"type": "tts", "state": "start"}))
                elif isinstance(frame, TTSStoppedFrame):
                    logger.debug(f"🚀 Network Flush: Dispatching text event -> type: tts, state:stop")
                    await self.ws.send_text(json.dumps({"type": "tts", "state": "stop"}))
                    
            except Exception as e:
                logger.error(f"❌ Network Drop: Failed to write state change text: {e}")
            return  # Consume the control frame

        # Make sure system control frames (like EndFrame) flow through cleanly
        await self.push_frame(frame, direction)