"""
Workflows URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WorkflowTemplateViewSet, WorkflowStepViewSet, WorkflowInstanceViewSet,
    WorkflowStepInstanceViewSet, QualityControlViewSet
)
from .analytics_views import (
    ProgressDashboardView, RealtimeMetricsView, WorkflowMetricsView,
    QualityAnalyticsView, workflow_template_analytics, analytics_summary
)

# Create router for API endpoints
router = DefaultRouter()
router.register(r'templates', WorkflowTemplateViewSet, basename='workflowtemplate')
router.register(r'steps', WorkflowStepViewSet, basename='workflowstep')
router.register(r'instances', WorkflowInstanceViewSet, basename='workflowinstance')
router.register(r'step-instances', WorkflowStepInstanceViewSet, basename='workflowstepinstance')
router.register(r'quality-controls', QualityControlViewSet, basename='qualitycontrol')

app_name = 'workflows'

urlpatterns = [
    path('api/', include(router.urls)),
    
    # Analytics endpoints
    path('api/analytics/dashboard/', ProgressDashboardView.as_view(), name='analytics-dashboard'),
    path('api/analytics/realtime/', RealtimeMetricsView.as_view(), name='analytics-realtime'),
    path('api/analytics/metrics/', WorkflowMetricsView.as_view(), name='analytics-metrics'),
    path('api/analytics/quality/', QualityAnalyticsView.as_view(), name='analytics-quality'),
    path('api/analytics/templates/<uuid:template_id>/', workflow_template_analytics, name='template-analytics'),
    path('api/analytics/summary/', analytics_summary, name='analytics-summary'),
]