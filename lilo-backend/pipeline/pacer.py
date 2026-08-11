import asyncio
import logging
from pipecat.processors.frame_processor import FrameProcessor
from pipecat.frames.frames import InterruptionFrame, TTSStartedFrame, TTSStoppedFrame 
from pipeline.frames import OutboundOpusAudioFrame  

logger = logging.getLogger(__name__)

class PipelineAudioRateController(FrameProcessor):
    def __init__(self, rate_controller):
        super().__init__()
        self.rate_controller = rate_controller
        self.sent_packet_count = 0

    def _ensure_background_worker_is_alive(self, direction):
        task = self.rate_controller.pending_send_task
        if task is None or task.done():
            async def send_audio_callback(opus_packet: bytes):
                await self.push_frame(OutboundOpusAudioFrame(data=opus_packet), direction)
            self.rate_controller.start_sending(send_audio_callback)

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)
        self._ensure_background_worker_is_alive(direction)

        # ── A. CUSTOM CONTROL FRAMES ────────────────────────────────────────
        if isinstance(frame, TTSStartedFrame):
            logger.info("PipelineAudioRateController: Sentence arriving. Resetting pre-buffer count and releasing START marker immediately.")
            self.sent_packet_count = 0
            await self.push_frame(frame, direction)
            return
                
        elif isinstance(frame, TTSStoppedFrame): 
            logger.info("PipelineAudioRateController: STOP marker received. Queueing STOP marker.")
            async def send_stop():
                # 1. Wait for the virtual playback timeline of paced audio to finish
                while True:
                    elapsed = self.rate_controller._get_elapsed_ms()
                    remaining = self.rate_controller.play_position - elapsed
                    if remaining > 0:
                        await asyncio.sleep(remaining / 1000.0)
                    else:
                        break
                # 2. Wait for the pre-buffered (bypassed) audio packets to finish playing on client.
                # Always sleep for at least 7 frames (420ms) as a safety margin (matching xiaozhi-server's (PRE_BUFFER_COUNT + 2) logic)
                # to prevent network jitter/client start lag from clipping short responses.
                if self.sent_packet_count > 0:
                    pre_buffer_time = (max(self.sent_packet_count, 7) * self.rate_controller.frame_duration) / 1000.0
                    logger.info(f"PipelineAudioRateController: Waiting an additional {pre_buffer_time}s for pre-buffered frames to complete.")
                    await asyncio.sleep(pre_buffer_time)
                
                logger.info("PipelineAudioRateController: Queue completely cleared. Releasing custom STOP marker downstream.")
                await self.push_frame(frame, direction)
            self.rate_controller.add_message(send_stop)
            return

        # ── B. PACED AUDIO DATA PACKETS ─────────────────────────────────────
        elif isinstance(frame, OutboundOpusAudioFrame):
            if self.sent_packet_count < 5:
                self.sent_packet_count += 1
                logger.info(f"PipelineAudioRateController: Pre-buffering audio frame #{self.sent_packet_count} directly downstream.")
                await self.push_frame(frame, direction)
            else:
                self.rate_controller.add_audio(frame.data)
            return

        # ── C. RESET STRUCTURES ON INTERRUPTION ─────────────────────────────
        elif isinstance(frame, InterruptionFrame):
            logger.info("PipelineAudioRateController: Interruption detected. Purging pacer.")
            self.rate_controller.reset()
            self.sent_packet_count = 0

        await self.push_frame(frame, direction)