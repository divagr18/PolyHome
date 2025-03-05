from django.urls import path
from .views import RandomPropertiesView

urlpatterns = [
    path('random-properties/', RandomPropertiesView.as_view(), name='random-properties'), 
]