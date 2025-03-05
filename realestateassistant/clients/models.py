from django.db import models
from django.conf import settings
class Client(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  
    name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    preferences = models.TextField(blank=True, null=True) 

    def __str__(self):
        return self.name