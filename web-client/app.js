const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const logDiv = document.getElementById('log');
const statusLog = document.getElementById('statusLog');

let ws = null;
let audioContext = null;
let mediaStream = null;
let processor = null;

let totalBytesSent = 0;

let playbackQueue = [];
let isPlaying = false;
let playbackTime = 0;
let initialBufferFilled = false;
let serverSampleRate = 16000;

function log(message) {
    const time = new Date().toLocaleTimeString();
    logDiv.innerHTML += `<div>[${time}] ${message}</div>`;
    logDiv.scrollTop = logDiv.scrollHeight;
}

function floatTo16BitPCM(input) {

    const output = new Int16Array(input.length);

    let hasAudio = false;

    for (let i = 0; i < input.length; i++) {

        let s = Math.max(-1, Math.min(1, input[i]));

        output[i] =
            s < 0
                ? s * 0x8000
                : s * 0x7FFF;

        if (Math.abs(output[i]) > 100) {
            hasAudio = true;
        }
    }

    return {
        buffer: output.buffer,
        hasAudio
    };
}

function int16ToFloat32(inputArray) {

    const output = new Float32Array(inputArray.length);

    for (let i = 0; i < inputArray.length; i++) {

        output[i] =
            inputArray[i] /
            (inputArray[i] < 0
                ? 0x8000
                : 0x7FFF);
    }

    return output;
}

// 48kHz -> 16kHz downsampling
function downsampleBuffer(buffer, inputRate, outputRate) {

    if (inputRate === outputRate) {
        return buffer;
    }

    const sampleRateRatio =
        inputRate / outputRate;

    const newLength =
        Math.round(
            buffer.length /
            sampleRateRatio
        );

    const result =
        new Float32Array(newLength);

    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {

        const nextOffsetBuffer =
            Math.round(
                (offsetResult + 1) *
                sampleRateRatio
            );

        let accum = 0;
        let count = 0;

        for (
            let i = offsetBuffer;
            i < nextOffsetBuffer &&
            i < buffer.length;
            i++
        ) {
            accum += buffer[i];
            count++;
        }

        result[offsetResult] =
            accum / count;

        offsetResult++;
        offsetBuffer =
            nextOffsetBuffer;
    }

    return result;
}

function playNextChunk() {

    if (playbackQueue.length === 0) {

        isPlaying = false;
        initialBufferFilled = false;

        return;
    }

    isPlaying = true;

    const buffer = playbackQueue.shift();

    const source =
        audioContext.createBufferSource();

    source.buffer = buffer;

    source.connect(
        audioContext.destination
    );

    if (
        playbackTime <
        audioContext.currentTime
    ) {
        playbackTime =
            audioContext.currentTime;
    }

    source.start(playbackTime);

    playbackTime +=
        buffer.duration;

    source.onended = () => {
        playNextChunk();
    };
}

async function startConnection() {

    try {

        totalBytesSent = 0;

        playbackQueue = [];
        isPlaying = false;
        playbackTime = 0;
        initialBufferFilled = false;

        log(
            "Requesting microphone access..."
        );

        mediaStream =
            await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

        log(
            "Connecting to backend..."
        );

        ws = new WebSocket(
            "ws://localhost:8000/ws"
        );

        ws.binaryType = "arraybuffer";

        ws.onopen = () => {
            log("✅ Connected. Establishing handshake...");
            
            // Send handshake hello message
            const handshake = {
                type: "hello",
                version: 1,
                transport: "websocket",
                audio_params: {
                    format: "pcm",
                    sample_rate: 16000,
                    channels: 1,
                    frame_duration: 20
                }
            };
            ws.send(JSON.stringify(handshake));
        };

        ws.onmessage = (event) => {
            if (typeof event.data === "string") {
                try {
                    const payload = JSON.parse(event.data);
                    
                    if (payload.type === "hello") {
                        log("✅ Handshake successful. Initialising audio...");
                        if (payload.audio_params && payload.audio_params.sample_rate) {
                            serverSampleRate = payload.audio_params.sample_rate;
                            log(`Server audio sample rate: ${serverSampleRate}Hz`);
                        }
                        
                        startBtn.disabled = true;
                        stopBtn.disabled = false;

                        audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        console.log("AudioContext sample rate:", audioContext.sampleRate);
                        log(`Audio sample rate: ${audioContext.sampleRate}`);

                        const source = audioContext.createMediaStreamSource(mediaStream);
                        processor = audioContext.createScriptProcessor(2048, 1, 1);
                        const dummyGain = audioContext.createGain();
                        dummyGain.gain.value = 0;

                        let logCounter = 0;
                        processor.onaudioprocess = (e) => {
                            if (!ws || ws.readyState !== WebSocket.OPEN) {
                                return;
                            }

                            const floatData = e.inputBuffer.getChannelData(0);
                            const downsampled = downsampleBuffer(
                                floatData,
                                audioContext.sampleRate,
                                16000
                            );

                            const { buffer, hasAudio } = floatTo16BitPCM(downsampled);
                            ws.send(buffer);
                            totalBytesSent += buffer.byteLength;
                            logCounter++;

                            if (logCounter % 10 === 0) {
                                statusLog.innerText =
                                    `Sent: ${Math.floor(totalBytesSent / 1024)} KB | ` +
                                    (hasAudio ? "🎤 Speaking" : "🔇 Silence");
                            }
                        };

                        source.connect(processor);
                        processor.connect(dummyGain);
                        dummyGain.connect(audioContext.destination);
                        return;
                    }
                    
                    if (payload.type === "stt") {
                        log("💬 Transcription: " + payload.text);
                        return;
                    }
                    
                    if (payload.type === "tts") {
                        log("🔊 Assistant state: " + payload.state);
                        if (payload.state === "stop") {
                            playbackQueue = [];
                            isPlaying = false;
                            playbackTime = audioContext ? audioContext.currentTime : 0;
                        }
                        return;
                    }
                    
                    log("💬 JSON message received: " + event.data);

                } catch (err) {
                    // Fallback for non-JSON text frames or legacy interruption string
                    if (event.data === "[INTERRUPT]") {
                        log("🚨 Assistant interrupted");
                        playbackQueue = [];
                        isPlaying = false;
                        playbackTime = audioContext ? audioContext.currentTime : 0;
                    } else {
                        log("💬 Text message: " + event.data);
                    }
                }
                return;
            }

            if (!(event.data instanceof ArrayBuffer)) {
                return;
            }

            // Playback audio frames
            if (!audioContext) {
                return; // Guard against audio not being initialized yet
            }

            const int16Array = new Int16Array(event.data);
            const float32Array = int16ToFloat32(int16Array);
            const audioBuffer = audioContext.createBuffer(
                1,
                float32Array.length,
                serverSampleRate
            );

            audioBuffer.copyToChannel(float32Array, 0);
            playbackQueue.push(audioBuffer);

            // small jitter buffer
            if (!initialBufferFilled && playbackQueue.length >= 2) {
                initialBufferFilled = true;
                log("🔊 Audio buffer ready");
            }

            if (initialBufferFilled && !isPlaying) {
                playNextChunk();
            }
        };

        ws.onerror = (err) => {

            console.error(err);

            log(
                "❌ WebSocket Error"
            );
        };

        ws.onclose = () => {

            log(
                "🔌 Connection closed"
            );

            stopConnection();
        };

    }
    catch (err) {

        console.error(err);

        log(
            "❌ " +
            err.message
        );
    }
}

function stopConnection() {

    if (
        ws &&
        ws.readyState ===
        WebSocket.OPEN
    ) {
        ws.close();
    }

    if (processor) {
        processor.disconnect();
        processor = null;
    }

    if (mediaStream) {

        mediaStream
            .getTracks()
            .forEach(
                track => track.stop()
            );

        mediaStream = null;
    }

    if (audioContext) {

        audioContext.close();

        audioContext = null;
    }

    playbackQueue = [];
    isPlaying = false;
    playbackTime = 0;
    initialBufferFilled = false;

    startBtn.disabled = false;
    stopBtn.disabled = true;

    statusLog.innerText = "";

    log("🛑 Disconnected");
}

startBtn.addEventListener(
    "click",
    startConnection
);

stopBtn.addEventListener(
    "click",
    stopConnection
);