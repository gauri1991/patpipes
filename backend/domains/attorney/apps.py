"""
Attorney Network App Configuration
"""

from django.apps import AppConfig


class AttorneyConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'domains.attorney'
    verbose_name = 'Attorney Network'
