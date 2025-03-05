from rest_framework import serializers
from .models import Appointment
from django.utils import timezone

class AppointmentSerializer(serializers.ModelSerializer):
    client_name = serializers.ReadOnlyField(source='client.name')
    agent_username = serializers.ReadOnlyField(source='agent.username')
    date_time_local = serializers.SerializerMethodField() 

    class Meta:
        model = Appointment
        fields = ['id', 'property_name', 'client', 'agent', 'date_time', 'notes', 'client_name', 'agent_username', 'date_time_local'] 
        read_only_fields = ['id', 'client_name', 'agent_username', 'date_time_local']

    def get_date_time_local(self, obj):
        
        local_time = timezone.localtime(obj.date_time)
        return local_time.isoformat() 