from django.urls import path
from . import views
from .views import MultiAgentChatStreamView

urlpatterns = [
    path('multiagent/stream/', MultiAgentChatStreamView.as_view()),

]