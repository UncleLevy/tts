from django.urls import path
from .consumers import TTSConsumer

websocket_urlpatterns = [
    path('ws/tts/', TTSConsumer.as_asgi()),
]
