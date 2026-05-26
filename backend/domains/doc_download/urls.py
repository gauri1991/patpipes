"""
Document Download URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CrawlJobViewSet, DownloadedFileViewSet

app_name = 'doc_download'

router = DefaultRouter()
router.register(r'jobs', CrawlJobViewSet, basename='crawl-job')
router.register(r'files', DownloadedFileViewSet, basename='downloaded-file')

urlpatterns = [
    path('', include(router.urls)),
]
