"""
URL Configuration for Agentic Patent Discovery System
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .agentic_views import (
    AgentConfigurationViewSet,
    PatentEntityExtractionViewSet,
    PatentTripletViewSet,
    ProcessingPipelineViewSet,
    PatentClusterViewSet,
    ClassifierDatasetsViewSet
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'agent-configs', AgentConfigurationViewSet, basename='agent-config')
router.register(r'entities', PatentEntityExtractionViewSet, basename='entity')
router.register(r'triplets', PatentTripletViewSet, basename='triplet')
router.register(r'pipelines', ProcessingPipelineViewSet, basename='pipeline')
router.register(r'clusters', PatentClusterViewSet, basename='cluster')
router.register(r'classifier-datasets', ClassifierDatasetsViewSet, basename='classifier-dataset')

urlpatterns = [
    path('', include(router.urls)),
]