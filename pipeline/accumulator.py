import logging
from pipecat.processors.frame_processor import FrameProcessor
from pipecat.frames.frames import (
    TTSStartedFrame, 
    TTSAudioRawFrame, 
    TTSStoppedFrame, 
    OutputAudioRawFrame
)

# Import your native 24kHz output configuration variable
from config.settings import AUDIO_OUT_SAMPLE_RATE

logger = logging.getLogger(__name__)

class SentenceAudioAccumulator(FrameProcessor):
    def __init__(self):
        super().__init__()
        # Tracks split 16-bit audio samples across network packet boundaries
        self.leftover_byte = b""

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)
        
        # ── 1. SYSTEM SIGNAL: New sentence stream starting ────────────────────
        if isinstance(frame, TTSStartedFrame):
            logger.info("TTS stream started. Piping chunks downstream in real-time.")
            self.leftover_byte = b""
            
        # ── 2. AUDIO DATA: Convert and push instantly without hoarding ───────
        elif isinstance(frame, TTSAudioRawFrame):
            chunk = frame.audio
            
            # If the last packet cut a 2-byte sample in half, stitch it back together
            if self.leftover_byte:
                chunk = self.leftover_byte + chunk
                self.leftover_byte = b""
            
            # DEFENSIVE GUARD: Force strict 16-bit word alignment per chunk
            if len(chunk) % 2 != 0:
                self.leftover_byte = chunk[-1:]
                chunk = chunk[:-1]
            
            if chunk:
                # Package the individual chunk immediately
                streaming_pcm_frame = OutputAudioRawFrame(
                    audio=chunk,
                    sample_rate=AUDIO_OUT_SAMPLE_RATE,
                    num_channels=1
                )
                # Release it downstream immediately!
                await self.push_frame(streaming_pcm_frame, direction)
            
            # Return early so the original un-aligned TTSAudioRawFrame is dropped
            return

        # ── 3. SYSTEM SIGNAL: Clean up context at turn completion ─────────────
        elif isinstance(frame, TTSStoppedFrame):
            self.leftover_byte = b""

        # ── 4. PASS-THROUGH: Forward control signals (Started/Stopped signals)
        await self.push_frame(frame, direction)