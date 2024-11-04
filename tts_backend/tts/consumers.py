from channels.generic.websocket import AsyncWebsocketConsumer
import json
from .service import TTSService
import asyncio

class TTSConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.tts_service = TTSService()
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get('action')

            if action == 'speak':
                text = data.get('text', '')
                await self.stream_audio(text)
            elif action == 'update_settings':
                settings = data.get('settings', {})
                self.tts_service.update_settings(settings)
            elif action == 'stop':
                pass
        except json.JSONDecodeError:
            await self.send(text_data='Invalid JSON received')
        except Exception as e:
            await self.send(text_data=f'Error: {str(e)}')


    async def stream_audio(self, text):
        for chunk in self.tts_service.stream_text(text):
            await self.send(bytes_data=chunk)