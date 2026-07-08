"""
LILO Voice Assistant — Pipeline Assembly
"""
import aiohttp
import logging
from fastapi import WebSocket

from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.worker import PipelineWorker, PipelineParams

# Core Custom Transport
from transports.esp32_transport import ESP32Transport

# Custom Processing Nodes
from pipeline.accumulator import SentenceAudioAccumulator
from pipeline.encoder import PipelineOpusEncoder
from pipeline.pacer import PipelineAudioRateController
from pipeline.decoder import PipelineOpusDecoder

# Standard Services
from services.stt import create_stt_service
from services.llm import create_llm_service
from services.tts import create_tts_service
from pipeline.context import create_context_aggregator

#utils
from utils.opus_encoder import OpusEncoderUtils
from utils.audio_rate_controller import AudioRateController

## Configuration Settings
from config.settings import AUDIO_OUT_SAMPLE_RATE, AUDIO_FRAME_SIZE_MS, AUDIO_IN_SAMPLE_RATE, IDLE_TIMEOUT_SECS


logger = logging.getLogger(__name__)

from pipecat.observers.loggers.metrics_log_observer import MetricsLogObserver
from pipecat.observers.user_bot_latency_observer import UserBotLatencyObserver
from pipecat.metrics.metrics import (
    TTFBMetricsData,
    TTFAMetricsData,
    ProcessingMetricsData,
    LLMUsageMetricsData,
    TTSUsageMetricsData,
    TurnMetricsData
)

metrics_logger = logging.getLogger("pipecat.metrics")

class MetricsInfoLogObserver(MetricsLogObserver):
    def _log_metrics_data(self, metrics_data, time_sec: float):
        processor_info = f"[{metrics_data.processor}]"
        model_info = f" ({metrics_data.model})" if metrics_data.model else ""

        if isinstance(metrics_data, TTFBMetricsData):
            metrics_logger.info(
                f"📊 {processor_info} TTFB{model_info}: {metrics_data.value:.3f}s"
            )
        elif isinstance(metrics_data, TTFAMetricsData):
            metrics_logger.info(
                f"📊 {processor_info} TTFA{model_info}: {metrics_data.ttfa:.3f}s "
                f"({metrics_data.leading_silence:.3f}s leading silence)"
            )
        elif isinstance(metrics_data, ProcessingMetricsData):
            metrics_logger.info(
                f"📊 {processor_info} PROCESSING TIME{model_info}: {metrics_data.value:.3f}s"
            )
        elif isinstance(metrics_data, LLMUsageMetricsData):
            usage = metrics_data.value
            metrics_logger.info(
                f"📊 {processor_info} LLM TOKENS{model_info}: prompt={usage.prompt_tokens}, completion={usage.completion_tokens}"
            )
        elif isinstance(metrics_data, TTSUsageMetricsData):
            metrics_logger.info(
                f"📊 {processor_info} TTS USAGE{model_info}: {metrics_data.value} characters"
            )
        elif isinstance(metrics_data, TurnMetricsData):
            complete_str = "COMPLETE" if metrics_data.is_complete else "INCOMPLETE"
            metrics_logger.info(
                f"📊 {processor_info} TURN{model_info}: {complete_str} (e2e: {metrics_data.e2e_processing_time_ms:.1f}ms)"
            )
        else:
            metrics_logger.info(
                f"📊 {processor_info} METRICS{model_info}: {metrics_data}"
            )

async def create_pipeline_worker(websocket: WebSocket) -> PipelineWorker:
    # ── 1. Create the ESP32 transport directly with the raw socket ──
    transport = ESP32Transport(websocket)
    session = aiohttp.ClientSession()


    # ── 2. Create core utility tools ───────────────────────────────
    opus_decoder=PipelineOpusDecoder(sample_rate=AUDIO_IN_SAMPLE_RATE, channels=1, frame_size_ms=AUDIO_FRAME_SIZE_MS)
    opus_tool = OpusEncoderUtils(sample_rate=AUDIO_OUT_SAMPLE_RATE, channels=1, frame_size_ms=AUDIO_FRAME_SIZE_MS)
    pacer_tool = AudioRateController(frame_duration=AUDIO_FRAME_SIZE_MS)

    # ── 3. Instantiate processing elements ─────────────────────────
    accumulator = SentenceAudioAccumulator()
    encoder = PipelineOpusEncoder(opus_encoder_utils=opus_tool)
    rate_controller = PipelineAudioRateController(rate_controller=pacer_tool)

    # ── 4. Create cognitive services ───────────────────────────────
    stt = create_stt_service()
    llm = create_llm_service()
    tts = create_tts_service(aiohttp_session=session)

    # ── 5. Create context and aggregators ──────────────────────────
    context, aggregator = create_context_aggregator()

    # ── 6. Assemble the complete pipeline ──────────────────────────
    pipeline = Pipeline(
        [
            transport.input(),
            opus_decoder,       
            stt,                     
            aggregator.user(),       
            llm,                     
            tts,                     
            aggregator.assistant(),  
            
            # Custom Outbound Audio Stream Processors
            accumulator,             
            encoder,                 
            rate_controller,         
            
            transport.output(),      
        ]
    )

    # ── 7. Create the pipeline worker ──────────────────────────────
    latency_observer = UserBotLatencyObserver()

    @latency_observer.event_handler("on_latency_measured")
    async def on_latency_measured(observer, latency):
        logger.info(f"⏱️ TURN LATENCY (user silence -> bot speaking): {latency:.3f}s")

    worker = PipelineWorker(
        pipeline,
        observers=[
            MetricsInfoLogObserver(),
            latency_observer,
        ],
        params=PipelineParams(
            enable_metrics=True,
            enable_usage_metrics=True,
        ),
        idle_timeout_secs=IDLE_TIMEOUT_SECS,
    )

    logger.info("Clean explicit pipeline created for ESP32 session")
    return worker