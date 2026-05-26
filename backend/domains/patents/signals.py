"""
Patent domain signals — keep Portfolio cached metrics in sync with Patent data.
"""
import logging

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

logger = logging.getLogger(__name__)


@receiver(post_save, sender='patents.Patent')
def patent_saved(sender, instance, **kwargs):
    """Refresh portfolio metrics whenever a patent is created or updated."""
    if instance.portfolio_id:
        try:
            instance.portfolio.update_metrics()
        except Exception:
            logger.exception("Failed to refresh metrics for portfolio %s", instance.portfolio_id)


@receiver(post_delete, sender='patents.Patent')
def patent_deleted(sender, instance, **kwargs):
    """Refresh portfolio metrics whenever a patent is removed."""
    if instance.portfolio_id:
        try:
            instance.portfolio.update_metrics()
        except Exception:
            logger.exception("Failed to refresh metrics for portfolio %s", instance.portfolio_id)
