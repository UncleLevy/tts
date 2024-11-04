import pyttsx3
import numpy as np
import io
import wave
import threading
from queue import Queue
import logging

class TTSService:
    def __init__(self):
        self.engine = pyttsx3.init()
        self.audio_queue = Queue()
        self.is_speaking = False
        self._setup_engine()
        self.logger = logging.getLogger(__name__)

    def _setup_engine(self):
        try:
            self.engine.setProperty('rate', 150)    # Speaking rate
            self.engine.setProperty('volume', 1.0)  # Volume (0.0 to 1.0)
            
            voices = self.engine.getProperty('voices')
            if voices:
                self.engine.setProperty('voice', voices[0].id)
        except Exception as e:
            self.logger.error(f"Error setting up engine: {str(e)}")

    def _audio_callback(self, name, completed):
        try:
            if name == 'started':
                self.is_speaking = True
            elif name == 'finished':
                self.is_speaking = False
                self.audio_queue.put(None)  # Signal end of stream
        except Exception as e:
            self.logger.error(f"Error in audio callback: {str(e)}")

    def stream_text(self, text, chunk_size=1024):
        """
        Generator function that yields audio chunks
        """
        try:
            self.engine.connect('started-utterance', self._audio_callback)
            self.engine.connect('finished-utterance', self._audio_callback)
            
            def process_tts():
                self.engine.say(text)
                self.engine.runAndWait()
            
            tts_thread = threading.Thread(target=process_tts)
            tts_thread.start()
            
            while True:
                chunk = self.audio_queue.get()
                if chunk is None:  # End of stream
                    break
                yield chunk
        except Exception as e:
            self.logger.error(f"Error streaming text: {str(e)}")

    def update_settings(self, settings):
        """
        Update TTS engine settings
        """
        try:
            if 'rate' in settings:
                self.engine.setProperty('rate', settings['rate'])
            if 'volume' in settings:
                self.engine.setProperty('volume', settings['volume'])
            if 'voice' in settings:
                voices = self.engine.getProperty('voices')
                for voice in voices:
                    if voice.id == settings['voice']:
                        self.engine.setProperty('voice', voice.id)
                        break
        except Exception as e:
            self.logger.error(f"Error updating settings: {str(e)}")

    def cleanup(self):
        """
        Clean up resources
        """
        try:
            self.engine.stop()
            self.audio_queue.put(None)  # Signal end of stream
        except Exception as e:
            self.logger.error(f"Error during cleanup: {str(e)}")
