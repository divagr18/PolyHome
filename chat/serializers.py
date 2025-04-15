from rest_framework import serializers
from .models import Chat
from django.contrib.auth import get_user_model
from clients.models import Client
import openai  
from django.conf import settings

User = get_user_model()


OPENAI_API_KEY = settings.OPENAI_API_KEY  
openai.api_key = OPENAI_API_KEY

class ChatSerializer(serializers.ModelSerializer):
    sender = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    recipient = serializers.PrimaryKeyRelatedField(queryset=Client.objects.all())
    recipient_name = serializers.SerializerMethodField()
    sender_name = serializers.SerializerMethodField()
    translated_message = serializers.SerializerMethodField()  

    class Meta:
        model = Chat
        fields = ['id', 'sender', 'recipient', 'message', 'timestamp', 'recipient_name', 'sender_name', 'translated_message']
        read_only_fields = ('id', 'timestamp', 'sender_name', 'recipient_name')

    def get_recipient_name(self, obj):
        return obj.recipient.name

    def get_sender_name(self, obj):
        return obj.sender.username

    def get_translated_message(self, obj):
        """Translates the message to the language specified in the request using GPT-4o-mini."""
        language = self.context.get('language')
        if not language:
            return obj.message  

        try:
            
            prompt = f"Translate the following English text to {language}: {obj.message}"

            
            response = openai.chat.completions.create(
              model="gpt-4o-mini", 
              messages=[
                {"role": "system", "content": "You are a helpful assistant that translates text. Give a simple, direct response"},
                {"role": "user", "content": prompt},
              ]
            )

            
            translated_text = response.choices[0].message.content
            return translated_text
        except Exception as e:
            return f"Translation Error: {e}"  