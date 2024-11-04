from django.shortcuts import render

# Create your views here.
# views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from gtts import gTTS
import os
import uuid

@csrf_exempt
def text_to_speech(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        text = data.get('text', '')
        
        if not text:
            return JsonResponse({'error': 'No text provided'}, status=400)
        
        # Generate unique filename
        filename = f"tts_{uuid.uuid4()}.mp3"
        filepath = os.path.join('media', 'tts', filename)
        
        # Generate speech
        tts = gTTS(text=text, lang='en')
        tts.save(filepath)
        
        # Return audio file URL
        audio_url = f"/media/tts/{filename}"
        return JsonResponse({'audio_url': audio_url})
    
    return JsonResponse({'error': 'Invalid request method'}, status=405)