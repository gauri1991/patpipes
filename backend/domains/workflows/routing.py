"""
WebSocket URL routing for workflow real-time updates
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Individual workflow updates
    re_path(r'ws/workflows/(?P<workflow_id>[0-9a-f-]+)/$', consumers.WorkflowUpdatesConsumer.as_asgi()),
    
    # Workflow analytics dashboard
    re_path(r'ws/workflows/analytics/$', consumers.WorkflowAnalyticsConsumer.as_asgi()),
]