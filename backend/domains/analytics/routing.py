"""
WebSocket URL routing for analytics consumers
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/analytics/pipeline/(?P<pipeline_id>[0-9a-f-]+)/$', consumers.PipelineConsumer.as_asgi()),
    re_path(r'ws/analytics/updates/$', consumers.AnalyticsConsumer.as_asgi()),
]