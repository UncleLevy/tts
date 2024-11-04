import pyttsx3
import numpy as np
import io
import wave
import threading
from queue import Queue

class TTSService:
    def __init__(self):
        self.engine = pyttsx3.init()
        self.audio_queue = Queue()
        self.is_speaking = False
        self._setup_engine()

    def _setup_engine(self):
        self.engine.setProperty('rate', 150)    # Speaking rate
        self.engine.setProperty('volume', 1.0)  # Volume (0.0 to 1.0)
        
        # Get available voices and set a default one
        voices = self.engine.getProperty('voices')
        if voices:
            self.engine.setProperty('voice', voices[0].id)

    def _audio_callback(self, name, completed):
        # This callback receives audio data from pyttsx3
        if name == 'started':
            self.is_speaking = True
        elif name == 'finished':
            self.is_speaking = False
            self.audio_queue.put(None)  # Signal end of stream

    def stream_text(self, text, chunk_size=1024):
        """
        Generator function that yields audio chunks
        """
        self.engine.connect('started-utterance', self._audio_callback)
        self.engine.connect('finished-utterance', self._audio_callback)
        
        # Create a background thread for TTS processing
        def process_tts():
            self.engine.say(text)
            self.engine.runAndWait()
        
        tts_thread = threading.Thread(target=process_tts)
        tts_thread.start()
        
        # Yield audio chunks as they become available
        while True:
            chunk = self.audio_queue.get()
            if chunk is None:  # End of stream
                break
            yield chunk

    def update_settings(self, settings):
        """
        Update TTS engine settings
        """
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
