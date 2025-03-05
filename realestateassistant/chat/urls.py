from django.urls import path
from . import views
from .views import ExtractBuyerInfoView

urlpatterns = [
    path('chats/', views.ChatListCreateView.as_view(), name='chat-list-create'),
    path('chats/<int:pk>/', views.ChatRetrieveUpdateDestroyView.as_view(), name='chat-retrieve-update-destroy'),
    path('chat-history/', views.ChatHistoryView.as_view(), name='chat-history'),
    path('agent-client-chat-history/', views.AgentClientChatHistoryView.as_view(), name='agent-client-chat-history'),
    path('extract-buyer-info/<int:client_id>/', ExtractBuyerInfoView.as_view(), name='extract-buyer-info'), # New URL for extraction
]