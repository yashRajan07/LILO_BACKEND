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
            logger.info("PipelineAudioRateController: Sentence arriving. Queueing START marker.")
            async def send_start():
                logger.info("PipelineAudioRateController: Releasing custom START marker downstream.")
                await self.push_frame(frame, direction)
            self.rate_controller.add_message(send_start)
            return
                
        elif isinstance(frame, TTSStoppedFrame): 
            logger.info("PipelineAudioRateController: STOP marker received. Queueing STOP marker.")
            async def send_stop():
                # Wait for the virtual playback timeline to reach the end of the last audio frame
                while True:
                    elapsed = self.rate_controller._get_elapsed_ms()
                    remaining = self.rate_controller.play_position - elapsed
                    if remaining > 0:
                        await asyncio.sleep(remaining / 1000.0)
                    else:
                        break
                logger.info("PipelineAudioRateController: Queue completely cleared. Releasing custom STOP marker downstream.")
                await self.push_frame(frame, direction)
            self.rate_controller.add_message(send_stop)
            return

        # ── B. PACED AUDIO DATA PACKETS ─────────────────────────────────────
        elif isinstance(frame, OutboundOpusAudioFrame):
            self.rate_controller.add_audio(frame.data)
            return

        # ── C. RESET STRUCTURES ON INTERRUPTION ─────────────────────────────
        elif isinstance(frame, InterruptionFrame):
            logger.info("PipelineAudioRateController: Interruption detected. Purging pacer.")
            self.rate_controller.reset()

        await self.push_frame(frame, direction)