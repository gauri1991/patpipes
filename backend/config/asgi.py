"""
ASGI config for config project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
import django
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Initialize Django ASGI application early to ensure the app registry
# is populated before importing code that may import ORM models.
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from channels.security.websocket import AllowedHostsOriginValidator

# Import routing from apps after Django setup
from domains.analytics.routing import websocket_urlpatterns as analytics_ws
from domains.workflows.routing import websocket_urlpatterns as workflows_ws
from domains.collaboration.routing import websocket_urlpatterns as collaboration_ws

# Combine all WebSocket URL patterns
websocket_urlpatterns = []
websocket_urlpatterns.extend(analytics_ws)
websocket_urlpatterns.extend(workflows_ws)
websocket_urlpatterns.extend(collaboration_ws)

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
