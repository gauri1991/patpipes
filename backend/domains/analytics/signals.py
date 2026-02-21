"""
Analytics signals
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone

from .models import AnalyticsProject, PatentDataset, AnalyticsVisualization


@receiver(post_save, sender=PatentDataset)
def update_project_progress(sender, instance, **kwargs):
    """Update project progress when dataset status changes"""
    if instance.processing_status == 'completed':
        project = instance.project
        project.updated_at = timezone.now()
        project.save(update_fields=['updated_at'])


@receiver(post_save, sender=AnalyticsVisualization)
def update_project_on_visualization_change(sender, instance, **kwargs):
    """Update project timestamp when visualizations change"""
    project = instance.project
    project.updated_at = timezone.now()
    project.save(update_fields=['updated_at'])