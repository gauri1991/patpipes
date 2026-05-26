"""
Web Search URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SearchSessionViewSet,
    SearchQueryViewSet,
    SearchResultViewSet,
    QuotaView,
    GoogleSearchConfigView,
    SearchConfigPublicView,
    ClientSearchResultsView,
)

app_name = 'web_search'

router = DefaultRouter()
router.register(r'sessions', SearchSessionViewSet, basename='search-session')
router.register(r'queries', SearchQueryViewSet, basename='search-query')
router.register(r'results', SearchResultViewSet, basename='search-result')

urlpatterns = [
    path('quota/', QuotaView.as_view(), name='quota'),
    path('config/', GoogleSearchConfigView.as_view(), name='config'),
    path('config/public/', SearchConfigPublicView.as_view(), name='config-public'),
    path('client-results/', ClientSearchResultsView.as_view(), name='client-results'),
    path('', include(router.urls)),
]
