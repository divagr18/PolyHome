from django.db import models
from django.conf import settings
 
from django.contrib.auth import get_user_model

User = get_user_model()

class Chat(models.Model):
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"From {self.sender} to {self.recipient} at {self.timestamp}"