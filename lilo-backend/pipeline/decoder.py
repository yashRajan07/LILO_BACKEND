import logging
import opuslib_next
from pipecat.processors.frame_processor import FrameProcessor
from pipecat.frames.frames import InputAudioRawFrame
from pipeline.frames import InboundOpusAudioFrame

logger = logging.getLogger(__name__)

class PipelineOpusDecoder(FrameProcessor):
    def __init__(self, sample_rate, channels, frame_size_ms):
        super().__init__()
        # 16000 Hz * 0.060 s = 960 samples per 60ms frame
        self.frame_size_samples = int(sample_rate * (frame_size_ms / 1000.0))
        self.decoder = opuslib_next.Decoder(sample_rate, channels)

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)
        # ── DECODE INBOUND MIC AUDIO ────────────────────────────────────────
        if isinstance(frame, InboundOpusAudioFrame):
            try:
                # Decode the compressed Opus packet into raw 16-bit linear PCM bytes
                pcm_data = self.decoder.decode(frame.data, self.frame_size_samples)
                
                # Forward raw PCM down the conveyor belt
                await self.push_frame(
                    InputAudioRawFrame(audio=pcm_data, sample_rate=16000, num_channels=1),
                    direction
                )
            except opuslib_next.OpusError as e:
                logger.error(f"Opus decoding failed: {e}")
            return

        # Pass all other frames (InterruptionFrame, EndFrame, etc.) through unhindered
        await self.push_frame(frame, direction)