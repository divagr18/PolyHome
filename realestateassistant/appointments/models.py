from django.db import models
from clients.models import Client
from django.contrib.auth import get_user_model

User = get_user_model()

class Appointment(models.Model):
    property_name = models.CharField(max_length=255)  
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    agent = models.ForeignKey(User, on_delete=models.CASCADE) 
    date_time = models.DateTimeField()
    notes = models.TextField(blank=True)  

    def __str__(self):
        return f"Appointment for {self.property_name} with {self.client.name} at {self.date_time}"