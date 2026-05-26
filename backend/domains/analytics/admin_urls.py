"""
URL configuration for analytics admin views
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .admin_views import (
    ColumnMappingRuleAdminViewSet,
    DatasetMappingAdminViewSet,
    DynamicFieldAdminViewSet,
    DataConfigurationAnalyticsView,
    AnalysisPromptTemplateAdminViewSet,
    LLMProviderConfigAdminViewSet,
)

# Create router for admin viewsets
admin_router = DefaultRouter()
admin_router.register(r'mapping-rules', ColumnMappingRuleAdminViewSet, basename='admin-mapping-rules')
admin_router.register(r'dataset-mappings', DatasetMappingAdminViewSet, basename='admin-dataset-mappings')
admin_router.register(r'dynamic-fields', DynamicFieldAdminViewSet, basename='admin-dynamic-fields')
admin_router.register(r'analytics', DataConfigurationAnalyticsView, basename='admin-analytics')
admin_router.register(r'prompts', AnalysisPromptTemplateAdminViewSet, basename='admin-prompts')
admin_router.register(r'llm-keys', LLMProviderConfigAdminViewSet, basename='admin-llm-keys')

urlpatterns = [
    path('', include(admin_router.urls)),
]