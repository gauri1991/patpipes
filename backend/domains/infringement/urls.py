"""
Infringement Analysis URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    InfringementCaseViewSet,
    ClaimMappingViewSet,
    ClaimElementViewSet,
    EvidenceViewSet,
    EvidenceScreenshotViewSet,
    RiskAssessmentViewSet,
    DamagesAnalysisViewSet,
    ExpertOpinionViewSet,
    LitigationStrategyViewSet,
    InfringementReportViewSet,
    RiskAnalysisViewSet,
    AIAnalysisViewSet
)

app_name = 'infringement'

router = DefaultRouter()
router.register(r'cases', InfringementCaseViewSet, basename='infringement-case')
router.register(r'claim-mappings', ClaimMappingViewSet, basename='claim-mapping')
router.register(r'claim-elements', ClaimElementViewSet, basename='claim-element')
router.register(r'evidence', EvidenceViewSet, basename='evidence')
router.register(r'screenshots', EvidenceScreenshotViewSet, basename='evidence-screenshot')
router.register(r'risk-assessments', RiskAssessmentViewSet, basename='risk-assessment')
router.register(r'damages-analysis', DamagesAnalysisViewSet, basename='damages-analysis')
router.register(r'expert-opinions', ExpertOpinionViewSet, basename='expert-opinion')
router.register(r'litigation-strategy', LitigationStrategyViewSet, basename='litigation-strategy')
router.register(r'reports', InfringementReportViewSet, basename='infringement-report')
router.register(r'risk-analysis', RiskAnalysisViewSet, basename='risk-analysis')
router.register(r'ai', AIAnalysisViewSet, basename='ai-analysis')

urlpatterns = [
    path('', include(router.urls)),
]
