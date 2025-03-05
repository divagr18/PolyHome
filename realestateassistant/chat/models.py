from django.db import models
from django.conf import settings
from clients.models import Client  
from django.contrib.auth import get_user_model

User = get_user_model()

class Chat(models.Model):
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_messages', on_delete=models.CASCADE)  
    recipient = models.ForeignKey(Client, related_name='received_messages', on_delete=models.CASCADE)  
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"From {self.sender} to {self.recipient} at {self.timestamp}"