import logging
from pipecat.processors.frame_processor import FrameProcessor
from pipecat.frames.frames import OutputAudioRawFrame, TTSStartedFrame, TTSStoppedFrame, InterruptionFrame
from pipeline.frames import OutboundOpusAudioFrame

logger = logging.getLogger(__name__)

class PipelineOpusEncoder(FrameProcessor):
    def __init__(self, opus_encoder_utils):
        super().__init__()
        self.encoder_utils = opus_encoder_utils

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)
        
        if isinstance(frame, TTSStartedFrame):
            logger.debug("PipelineOpusEncoder: Resetting encoder state for new stream.")
            self.encoder_utils.reset_state()
            await self.push_frame(frame, direction)
            return

        elif isinstance(frame, TTSStoppedFrame):
            logger.debug("PipelineOpusEncoder: Flushing encoder buffer at end of TTS stream.")
            try:
                packet_count = 0
                for opus_packet in self.encoder_utils.encode_pcm_to_opus_stream(b"", end_of_stream=True):
                    packet_count += 1
                    await self.push_frame(OutboundOpusAudioFrame(data=opus_packet), direction)
                logger.debug(f"PipelineOpusEncoder: Flushed {packet_count} final Opus packets.")
            except Exception as e:
                logger.error(f"PipelineOpusEncoder: Error flushing encoder: {e}", exc_info=True)
            await self.push_frame(frame, direction)
            return

        elif isinstance(frame, InterruptionFrame):
            logger.debug("PipelineOpusEncoder: Interruption detected. Resetting encoder state.")
            self.encoder_utils.reset_state()
            await self.push_frame(frame, direction)
            return

        elif isinstance(frame, OutputAudioRawFrame):
            pcm_data = frame.audio
            
            # ── DEFENSIVE GUARD: Force even 16-bit alignment ────────────────
            if len(pcm_data) % 2 != 0:
                pcm_data = pcm_data[:-1]
                
            if not pcm_data:
                return

            logger.info(f"PipelineOpusEncoder: Received {len(pcm_data)} bytes from accumulator. Starting compression...")

            try:
                packet_count = 0
                # Direct, beautiful iteration. 
                # As soon as a packet is yielded, it is immediately 'awaited' downstream.
                for opus_packet in self.encoder_utils.encode_pcm_to_opus_stream(pcm_data, end_of_stream=False):
                    packet_count += 1
                    await self.push_frame(OutboundOpusAudioFrame(data=opus_packet), direction)
                    
                logger.info(f"PipelineOpusEncoder: Compression finished! Pushed {packet_count} OutboundOpusAudioFrames downstream.")
                
            except Exception as e:
                logger.error(f"PipelineOpusEncoder: Error processing compression loop: {e}", exc_info=True)
                
            return  # Consume the raw frame

        await self.push_frame(frame, direction)