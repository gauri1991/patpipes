"""
Prior Art Domain URL Configuration
Professional API routing for prior art search and analysis
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers

from .views import (
    PriorArtProjectViewSet, TargetPatentViewSet, PatentClaimViewSet,
    ClaimElementViewSet, SearchSessionViewSet, EvidenceItemViewSet,
    ClaimEvidenceMappingViewSet, PriorArtReportViewSet
)

app_name = 'prior_art'

# Main router
router = DefaultRouter(trailing_slash=False)
router.register(r'projects', PriorArtProjectViewSet, basename='prior-art-projects')

# Nested routers for project resources
projects_router = routers.NestedDefaultRouter(
    router, r'projects', lookup='project', trailing_slash=False
)
projects_router.register(r'target-patent', TargetPatentViewSet, basename='project-target-patent')
projects_router.register(r'search-sessions', SearchSessionViewSet, basename='project-search-sessions')
projects_router.register(r'evidence', EvidenceItemViewSet, basename='project-evidence')
projects_router.register(r'reports', PriorArtReportViewSet, basename='project-reports')

# Nested router for target patent claims
target_patent_router = routers.NestedDefaultRouter(
    projects_router, r'target-patent', lookup='target_patent', trailing_slash=False
)
target_patent_router.register(r'claims', PatentClaimViewSet, basename='target-patent-claims')

# Nested router for claim elements
claims_router = routers.NestedDefaultRouter(
    target_patent_router, r'claims', lookup='claim', trailing_slash=False
)
claims_router.register(r'elements', ClaimElementViewSet, basename='claim-elements')

# Nested router for evidence claim mappings
evidence_router = routers.NestedDefaultRouter(
    projects_router, r'evidence', lookup='evidence', trailing_slash=False
)
evidence_router.register(r'claim-mappings', ClaimEvidenceMappingViewSet, basename='evidence-claim-mappings')

urlpatterns = [
    # Main router patterns
    path('', include(router.urls)),
    # Project nested resources
    path('', include(projects_router.urls)),
    # Target patent nested resources
    path('', include(target_patent_router.urls)),
    # Claim nested resources
    path('', include(claims_router.urls)),
    # Evidence nested resources
    path('', include(evidence_router.urls)),
]
