"""
Patent Prosecution URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'prosecution'

# Create router and register viewsets
router = DefaultRouter()
router.register(r'applications', views.PatentApplicationViewSet, basename='applications')
router.register(r'claims', views.ClaimViewSet, basename='claims')
router.register(r'events', views.ProsecutionEventViewSet, basename='events')
router.register(r'office-actions', views.OfficeActionViewSet, basename='office-actions')
router.register(r'deadlines', views.ProsecutionDeadlineViewSet, basename='deadlines')
router.register(r'documents', views.ProsecutionDocumentViewSet, basename='documents')
router.register(r'odp-sync', views.ODPProsecutionSyncViewSet, basename='odp-sync')

urlpatterns = [
    path('', include(router.urls)),
]