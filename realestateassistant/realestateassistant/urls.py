from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('chat.urls')),
    path('api/', include('clients.urls')),
    path('api/', include('properties.urls')),
    path('api/properties/', include('properties.urls')),
    path('api/appointments/', include('appointments.urls')),
]
