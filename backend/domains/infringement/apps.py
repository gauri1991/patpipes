"""
Infringement Analysis App Configuration
"""

from django.apps import AppConfig


class InfringementConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'domains.infringement'
    verbose_name = 'Patent Infringement Analysis'
