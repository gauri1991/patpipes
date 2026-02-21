from django.apps import AppConfig


class AnalyticsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'domains.analytics'
    verbose_name = 'Patent Analytics'

    def ready(self):
        import domains.analytics.signals