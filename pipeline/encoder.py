import logging
from pipecat.processors.frame_processor import FrameProcessor
from pipecat.frames.frames import TTSAudioRawFrame, TTSStartedFrame, TTSStoppedFrame, InterruptionFrame
from pipeline.frames import OutboundOpusAudioFrame

logger = logging.getLogger(__name__)

class PipelineOpusEncoder(FrameProcessor):
    def __init__(self, opus_encoder_utils):
        super().__init__()
        self.encoder_utils = opus_encoder_utils
        self.leftover_byte = b""

    async def process_frame(self, frame, direction):
        await super().process_frame(frame, direction)
        
        if isinstance(frame, TTSStartedFrame):
            logger.debug("PipelineOpusEncoder: Resetting encoder state for new stream.")
            self.encoder_utils.reset_state()
            self.leftover_byte = b""
            await self.push_frame(frame, direction)
            return

        elif isinstance(frame, TTSStoppedFrame):
            logger.debug("PipelineOpusEncoder: Flushing encoder buffer at end of TTS stream.")
            self.leftover_byte = b""
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
            self.leftover_byte = b""
            await self.push_frame(frame, direction)
            return

        elif isinstance(frame, TTSAudioRawFrame):
            pcm_data = frame.audio
            
            # Stitch leftover odd byte if it exists from the previous chunk
            if self.leftover_byte:
                pcm_data = self.leftover_byte + pcm_data
                self.leftover_byte = b""
                
            # DEFENSIVE GUARD: Preserve 16-bit word alignment and save odd byte
            if len(pcm_data) % 2 != 0:
                self.leftover_byte = pcm_data[-1:]
                pcm_data = pcm_data[:-1]
                
            if not pcm_data:
                return

            logger.debug(f"PipelineOpusEncoder: Received {len(pcm_data)} bytes from TTS. Starting compression...")

            try:
                packet_count = 0
                for opus_packet in self.encoder_utils.encode_pcm_to_opus_stream(pcm_data, end_of_stream=False):
                    packet_count += 1
                    await self.push_frame(OutboundOpusAudioFrame(data=opus_packet), direction)
                    
                logger.debug(f"PipelineOpusEncoder: Compression finished! Pushed {packet_count} OutboundOpusAudioFrames downstream.")
                
            except Exception as e:
                logger.error(f"PipelineOpusEncoder: Error processing compression loop: {e}", exc_info=True)
                
            return  # Consume the raw frame

        await self.push_frame(frame, direction)