from pipecat.frames.frames import DataFrame
from dataclasses import dataclass


@dataclass
class InboundOpusAudioFrame(DataFrame):
    """Carries a compressed Opus packet received from the ESP32 microphone."""
    data: bytes

@dataclass
class OutboundOpusAudioFrame(DataFrame):
    """Carries a single, pre-compressed, zero-padded 60ms Opus packet."""
    data: bytes

