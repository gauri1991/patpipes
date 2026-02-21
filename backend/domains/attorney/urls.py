"""
Attorney Network URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LawFirmViewSet,
    AttorneyViewSet,
    AttorneyReviewViewSet,
    AttorneyConnectionViewSet
)

app_name = 'attorney'

router = DefaultRouter()
router.register(r'law-firms', LawFirmViewSet, basename='law-firm')
router.register(r'attorneys', AttorneyViewSet, basename='attorney')
router.register(r'reviews', AttorneyReviewViewSet, basename='attorney-review')
router.register(r'connections', AttorneyConnectionViewSet, basename='attorney-connection')

urlpatterns = [
    path('', include(router.urls)),
]
