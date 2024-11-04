# urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('api/tts/', views.text_to_speech, name='text_to_speech'),
]