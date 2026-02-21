"""
Projects Domain App Configuration
"""

from django.apps import AppConfig


class ProjectsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'domains.projects'
    verbose_name = 'Projects Management'