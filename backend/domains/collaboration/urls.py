"""
Collaboration Domain URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    CommentThreadViewSet,
    CommentViewSet,
    ActivityViewSet,
    NotificationViewSet,
    SharedResourceViewSet,
    MentionViewSet
)

app_name = 'collaboration'

router = DefaultRouter()
router.register(r'threads', CommentThreadViewSet, basename='threads')
router.register(r'comments', CommentViewSet, basename='comments')
router.register(r'activities', ActivityViewSet, basename='activities')
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'shared', SharedResourceViewSet, basename='shared')
router.register(r'mentions', MentionViewSet, basename='mentions')

urlpatterns = [
    path('', include(router.urls)),
]
