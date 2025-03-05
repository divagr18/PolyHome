from django.urls import path
from . import views

urlpatterns = [
    path('clients/', views.ClientListCreateView.as_view(), name='client-list-create'),
    path('clients/<int:pk>/', views.ClientRetrieveUpdateDestroyView.as_view(), name='client-retrieve-update-destroy'),
]