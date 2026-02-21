"""
Workflows Django App Configuration
"""

from django.apps import AppConfig


class WorkflowsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'domains.workflows'
    verbose_name = 'Workflows'
    
    def ready(self):
        # Import signals to register them
        from . import signals