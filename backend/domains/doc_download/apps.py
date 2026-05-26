"""
Document Download App Configuration
"""

from django.apps import AppConfig


class DocDownloadConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'domains.doc_download'
    verbose_name = 'Document Download'
