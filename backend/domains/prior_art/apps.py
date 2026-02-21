"""
Prior Art Django App Configuration
Professional-grade configuration for prior art search and analysis
"""

from django.apps import AppConfig


class PriorArtConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'domains.prior_art'
    verbose_name = 'Prior Art Search & Analysis'
    
    def ready(self):
        """Initialize app-specific functionality"""
        # Import signals for data processing
        try:
            from . import signals
        except ImportError:
            pass
        
        # Register AI models for claims analysis
        try:
            from .ai_services import ClaimsAnalyzer
            # Initialize AI services on app start
            ClaimsAnalyzer.initialize_models()
        except ImportError:
            # AI services not available yet - will be loaded later
            pass