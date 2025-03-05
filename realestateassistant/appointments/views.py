from rest_framework import generics
from .models import Appointment
from .serializers import AppointmentSerializer
from rest_framework import permissions
from clients.models import Client
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

User = get_user_model()

class AppointmentListCreateView(generics.ListCreateAPIView):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    

    def perform_create(self, serializer):
        
        client_id = self.request.data.get('client')
        agent_id = self.request.data.get('agent')

        
        client = get_object_or_404(Client, pk=client_id)
        agent = get_object_or_404(User, pk=agent_id)

        serializer.save(client=client, agent=agent)

class AppointmentRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer