"""
FCC Data URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FCCGranteeViewSet, FCCQueryJobViewSet, FCCExportFileViewSet, FCCDocumentViewSet

app_name = 'fcc_data'

router = DefaultRouter()
router.register(r'grantees', FCCGranteeViewSet, basename='fcc-grantee')
router.register(r'jobs', FCCQueryJobViewSet, basename='fcc-query-job')
router.register(r'exports', FCCExportFileViewSet, basename='fcc-export-file')
router.register(r'documents', FCCDocumentViewSet, basename='fcc-document')

urlpatterns = [
    path('', include(router.urls)),
]
