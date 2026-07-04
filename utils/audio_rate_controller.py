import time
import logging
import asyncio
from collections import deque

TAG = __name__

class SafeBindLogger:
    def __init__(self, raw_logger):
        self._logger = raw_logger

    def bind(self, **kwargs):
        # Return self so that chained method calls (.debug, .info) still point here
        return self

    def __getattr__(self, name):
        # Pass standard methods (debug, info, error) straight down to the real logger
        return getattr(self._logger, name)


logger = SafeBindLogger(logging.getLogger(__name__))


class AudioRateController:
    """
    Audio Rate Controller - Precisely controls audio transmission based on a fixed frame duration.
    Solves the problem of cumulative time drift in high-concurrency asynchronous environments.
    """

    def __init__(self, frame_duration=60):
        """
        Args:
            frame_duration: Duration of a single audio frame in milliseconds. Defaults to 60ms.
        """
        self.frame_duration = frame_duration
        self.queue = deque()
        self.play_position = 0  # Virtual playback timeline in milliseconds
        self.start_timestamp = None  # Absolute real-world start time (read-only after set)
        self.pending_send_task = None
        self.logger = logger
        
        # Event flags to efficiently wake/sleep the processing loop without CPU polling
        self.queue_empty_event = asyncio.Event() 
        self.queue_empty_event.set()  # Initial state is empty
        self.queue_has_data_event = asyncio.Event() 
        self._last_queue_empty_time = 0  # Records exactly when the queue last ran out of data

    def reset(self):
        """Resets the controller back to its initial state."""
        if self.pending_send_task and not self.pending_send_task.done():
            self.pending_send_task.cancel()
            # The cancelled task will be cleaned up in the next event loop iteration

        self.queue.clear()
        self.play_position = 0
        self.start_timestamp = None  
        self._last_queue_empty_time = 0 

        # Reset event flags
        self.queue_empty_event.set()
        self.queue_has_data_event.clear()

    def add_audio(self, opus_packet):
        """Adds an audio packet to the transmission queue."""
        # Pause-Resumption Logic: If the queue was empty, we may need to fast-forward the start_timestamp.
        # This prevents the controller from trying to rapidly catch up after the AI pauses to "think".
        if len(self.queue) == 0 and self.play_position > 0:
            elapsed_since_empty = (time.monotonic() - self._last_queue_empty_time) * 1000
            
            # Only trigger a timestamp reset if the gap is longer than one frame (ignore micro-stutters)
            if elapsed_since_empty >= self.frame_duration:
                self.start_timestamp = time.monotonic() - (self.play_position / 1000)
                self.logger.bind(tag=TAG).debug(
                    f"Queue resumed from empty. Timestamp reset. Current play pos: {self.play_position}ms, Gap: {elapsed_since_empty:.0f}ms"
                )

        self.queue.append(("audio", opus_packet))
        
        # Wake up the processing loop
        self.queue_empty_event.clear()
        self.queue_has_data_event.set()

    def add_message(self, message_callback):
        """
        Adds a control message to the queue. 
        Messages are sent immediately and do not consume virtual playback time.

        Args:
            message_callback: Asynchronous callback function `async def()`
        """
        # Apply the exact same pause-resumption logic here in case a message arrives during a pause
        if len(self.queue) == 0 and self.play_position > 0:
            elapsed_since_empty = (time.monotonic() - self._last_queue_empty_time) * 1000
            if elapsed_since_empty >= self.frame_duration:
                self.start_timestamp = time.monotonic() - (self.play_position / 1000)
                self.logger.bind(tag=TAG).debug(
                    f"Queue resumed from empty. Timestamp reset. Current play pos: {self.play_position}ms, Gap: {elapsed_since_empty:.0f}ms"
                )

        self.queue.append(("message", message_callback))
        
        # Wake up the processing loop
        self.queue_empty_event.clear()
        self.queue_has_data_event.set()

    def _get_elapsed_ms(self):
        """Calculates the exact real-world time elapsed since the stream started."""
        if self.start_timestamp is None:
            return 0
        return (time.monotonic() - self.start_timestamp) * 1000

    async def check_queue(self, send_audio_callback):
        """
        The core engine. Processes the queue by executing messages instantly and pacing audio frames.

        Args:
            send_audio_callback: Asynchronous callback function for sending audio packets
        """
        while self.queue:
            item = self.queue[0]
            item_type = item[0]

            if item_type == "message":
                # Instantly execute the message callback without advancing the timeline
                _, message_callback = item
                self.queue.popleft()
                try:
                    await message_callback()
                except Exception as e:
                    self.logger.bind(tag=TAG).error(f"Failed to send message: {e}")
                    raise

            elif item_type == "audio":
                # Initialize the absolute timestamp anchor on the very first audio frame
                if self.start_timestamp is None:
                    self.start_timestamp = time.monotonic()

                _, opus_packet = item

                # Pacing loop: Wait until the exact scheduled real-world time is reached
                while True:
                    elapsed_ms = self._get_elapsed_ms()
                    output_ms = self.play_position

                    if elapsed_ms < output_ms:
                        # We are ahead of schedule. Calculate the exact time difference to wait.
                        wait_ms = output_ms - elapsed_ms

                        try:
                            # Use asyncio.sleep to wait, yielding control back to the event loop
                            await asyncio.sleep(wait_ms / 1000)
                        except asyncio.CancelledError:
                            self.logger.bind(tag=TAG).debug("Audio transmission task cancelled during sleep phase")
                            raise
                        # After sleeping, reiterate the while loop to double-check the precise time
                    else:
                        # Target time reached or passed; break loop to fire the audio immediately
                        break

                # The scheduled time has arrived. Remove from queue and advance virtual timeline.
                self.queue.popleft()
                self.play_position += self.frame_duration
                try:
                    await send_audio_callback(opus_packet)
                except Exception as e:
                    self.logger.bind(tag=TAG).error(f"Failed to send audio packet: {e}")
                    raise

        # The queue is completely drained. Reset flags and record the exact time it went empty.
        self.queue_empty_event.set()
        self.queue_has_data_event.clear()
        self._last_queue_empty_time = time.monotonic() 

    def start_sending(self, send_audio_callback):
        """
        Starts the asynchronous background loop that continuously monitors the queue.

        Args:
            send_audio_callback: Callback function to handle audio transmission

        Returns:
            asyncio.Task: The running transmission task
        """

        async def _send_loop():
            try:
                while True:
                    # Sleep efficiently until data is pushed to the queue (prevents CPU burning)
                    await self.queue_has_data_event.wait()
                    await self.check_queue(send_audio_callback)
            except asyncio.CancelledError:
                self.logger.bind(tag=TAG).debug("Audio transmission loop stopped cleanly")
            except Exception as e:
                self.logger.bind(tag=TAG).error(f"Audio transmission loop crashed: {e}")

        self.pending_send_task = asyncio.create_task(_send_loop())
        return self.pending_send_task

    def stop_sending(self):
        """Safely stops the active asynchronous transmission task."""
        if self.pending_send_task and not self.pending_send_task.done():
            self.pending_send_task.cancel()
            self.logger.bind(tag=TAG).debug("Audio transmission task cancelled")