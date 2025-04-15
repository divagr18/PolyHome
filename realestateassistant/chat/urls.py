from django.urls import path
from . import views
from .views import MultiAgentChatView,MultiAgentChatStreamView

urlpatterns = [
    path('multiagent/', MultiAgentChatView.as_view(), name='multi_agent_chat'),
    path('multiagent/stream/', MultiAgentChatStreamView.as_view()),

]