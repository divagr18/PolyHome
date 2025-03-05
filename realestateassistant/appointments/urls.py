from django.urls import path
from . import views

urlpatterns = [
    path('', views.AppointmentListCreateView.as_view(), name='appointment-list-create'),
    path('<int:pk>/', views.AppointmentRetrieveUpdateDestroyView.as_view(), name='appointment-retrieve-update-destroy'),
]