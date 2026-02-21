"""
Research URL Configuration
URL routing for patent research functionality
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .research_views import (
    ResearchQueryViewSet,
    ResearchResultViewSet,
    ResearchSessionViewSet,
    ResearchAnalyticsView,
    DatasetFromResearchView,
    PatentAPIViewSet,
)
from .odp_views import USPTOODPViewSet

# Create router and register viewsets
research_router = DefaultRouter()
research_router.register(r'queries', ResearchQueryViewSet, basename='research-queries')
research_router.register(r'results', ResearchResultViewSet, basename='research-results')
research_router.register(r'sessions', ResearchSessionViewSet, basename='research-sessions')
research_router.register(r'analytics', ResearchAnalyticsView, basename='research-analytics')
research_router.register(r'datasets', DatasetFromResearchView, basename='research-datasets')
research_router.register(r'patent-apis', PatentAPIViewSet, basename='patent-apis')
research_router.register(r'odp', USPTOODPViewSet, basename='uspto-odp')

urlpatterns = [
    path('', include(research_router.urls)),
]