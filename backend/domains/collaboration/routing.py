"""
WebSocket URL routing for collaboration domain
"""

from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Notifications - personal channel for each user
    re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_asgi()),

    # Activity feed - can be project-specific or general
    re_path(r'ws/activity/$', consumers.ActivityFeedConsumer.as_asgi()),
    re_path(r'ws/activity/project/(?P<project_id>[0-9a-f-]+)/$', consumers.ActivityFeedConsumer.as_asgi()),

    # Comment threads - real-time comments
    re_path(r'ws/threads/(?P<thread_id>[0-9a-f-]+)/$', consumers.CommentThreadConsumer.as_asgi()),

    # Presence - track who's viewing/editing a resource
    re_path(r'ws/presence/(?P<resource_type>\w+)/(?P<resource_id>[0-9a-f-]+)/$', consumers.PresenceConsumer.as_asgi()),
]
