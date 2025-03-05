# properties/serializers.py
from rest_framework import serializers
from .models import Property, Offer
from clients.models import Client
from appointments.models import Appointment  # Import Appointment model


class OfferSerializer(serializers.ModelSerializer):
    client_name = serializers.SerializerMethodField()

    class Meta:
        model = Offer
        fields = ['id', 'price', 'client_id', 'client_name']  # Include client_name

    def get_client_name(self, obj):
        try:
            client = Client.objects.get(pk=obj.client_id)
            return client.name  # Return the client's name
        except Client.DoesNotExist:
            return "Unknown Client"  # Handle case where client is not found

class AppointmentSerializer(serializers.ModelSerializer):
    client_name = serializers.ReadOnlyField(source='client.name')
    agent_username = serializers.ReadOnlyField(source='agent.username')

    class Meta:
        model = Appointment
        fields = ['id', 'property_name', 'client', 'agent', 'date_time', 'notes', 'client_name', 'agent_username']
        read_only_fields = ['id', 'client_name', 'agent_username']