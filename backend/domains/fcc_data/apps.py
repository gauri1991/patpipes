"""
FCC Data App Configuration
"""

from django.apps import AppConfig


class FccDataConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'domains.fcc_data'
    verbose_name = 'FCC Equipment Data'
