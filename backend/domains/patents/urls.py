"""
URL configuration for Patent Portfolio Management
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PortfolioViewSet, PatentViewSet

router = DefaultRouter()
router.register(r'portfolios', PortfolioViewSet, basename='portfolio')
router.register(r'patents', PatentViewSet, basename='patent')

app_name = 'patents'

urlpatterns = [
    path('', include(router.urls)),
]