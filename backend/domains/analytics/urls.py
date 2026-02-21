"""
Analytics URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AnalyticsProjectViewSet, TechnologyAreaViewSet, PatentDatasetViewSet,
    CompetitorProfileViewSet, AnalyticsVisualizationViewSet,
    AnalyticsReportViewSet, AnalyticsPresentationViewSet, AnalyticsInsightViewSet, ColumnMappingRuleViewSet,
    TemplateViewSet, GlobalCompetitorProfileViewSet, GlobalTechnologyAreaViewSet
)

# Create router and register viewsets
router = DefaultRouter()
router.register(r'projects', AnalyticsProjectViewSet, basename='analytics-projects')
router.register(r'technology-areas', TechnologyAreaViewSet, basename='technology-areas')
router.register(r'datasets', PatentDatasetViewSet, basename='patent-datasets')
router.register(r'competitors', CompetitorProfileViewSet, basename='competitor-profiles')
router.register(r'visualizations', AnalyticsVisualizationViewSet, basename='analytics-visualizations')
router.register(r'reports', AnalyticsReportViewSet, basename='analytics-reports')
router.register(r'presentations', AnalyticsPresentationViewSet, basename='analytics-presentations')
router.register(r'insights', AnalyticsInsightViewSet, basename='analytics-insights')
router.register(r'column-mapping-rules', ColumnMappingRuleViewSet, basename='column-mapping-rules')
router.register(r'templates', TemplateViewSet, basename='templates')
router.register(r'global-competitors', GlobalCompetitorProfileViewSet, basename='global-competitors')
router.register(r'global-technology-areas', GlobalTechnologyAreaViewSet, basename='global-technology-areas')

app_name = 'analytics'

urlpatterns = [
    path('api/', include(router.urls)),
    path('api/admin/data-configuration/', include('domains.analytics.admin_urls')),
    path('api/research/', include('domains.analytics.research_urls')),
    path('api/brainstorming/', include('domains.analytics.brainstorming_urls')),
    path('api/agentic/', include('domains.analytics.agentic_urls')),
]