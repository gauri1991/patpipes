"""
Celery Configuration for Patent Analytics Platform
Handles asynchronous task processing for workflows, quality checks, and notifications
"""

import os
import ssl
from celery import Celery
from django.conf import settings

# Set the default Django settings module for the 'celery' program
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Create the Celery app
app = Celery('patent_analytics_platform')

# Load task modules from all registered Django app configs
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Celery Configuration
app.conf.update(
    # Broker settings
    broker_url=getattr(settings, 'CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    result_backend=getattr(settings, 'CELERY_RESULT_BACKEND', 'redis://localhost:6379/0'),
    
    # Task routing
    task_routes={
        'domains.workflows.tasks.execute_workflow_step': {'queue': 'workflow_execution'},
        'domains.workflows.tasks.quality_check_task': {'queue': 'quality_control'},
        'domains.workflows.tasks.send_notification': {'queue': 'notifications'},
        'domains.workflows.tasks.generate_analytics': {'queue': 'analytics'},
        'domains.workflows.tasks.bulk_operation': {'queue': 'bulk_operations'},
        'domains.patents.tasks.run_odp_import': {'queue': 'bulk_operations'},
    },
    
    # Task execution settings
    task_always_eager=getattr(settings, 'CELERY_TASK_ALWAYS_EAGER', False),
    task_eager_propagates=True,
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Task retry settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_default_retry_delay=60,
    task_max_retries=3,
    
    # Worker settings
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
    worker_disable_rate_limits=False,
    
    # Beat scheduler settings (for periodic tasks)
    beat_schedule={
        'cleanup-expired-workflows': {
            'task': 'domains.workflows.tasks.cleanup_expired_workflows',
            'schedule': 3600.0,  # Every hour
        },
        'update-workflow-analytics': {
            'task': 'domains.workflows.tasks.update_workflow_analytics',
            'schedule': 1800.0,  # Every 30 minutes
        },
        'check-overdue-workflows': {
            'task': 'domains.workflows.tasks.check_overdue_workflows',
            'schedule': 900.0,  # Every 15 minutes
        },
        'generate-quality-reports': {
            'task': 'domains.workflows.tasks.generate_quality_reports',
            'schedule': 86400.0,  # Daily
        },
    },
    beat_scheduler='django_celery_beat.schedulers:DatabaseScheduler',
    
    # Result backend settings
    result_expires=3600,
    result_cache_max=10000,
    
    # Security settings
    worker_hijack_root_logger=False,
    worker_log_color=False,
)

# SSL configuration for production
if getattr(settings, 'CELERY_BROKER_USE_SSL', False):
    app.conf.broker_use_ssl = {
        'ssl_cert_reqs': ssl.CERT_REQUIRED,
        'ssl_ca_certs': '/etc/ssl/certs/ca-certificates.crt',
        'ssl_certfile': '/path/to/client.crt',
        'ssl_keyfile': '/path/to/client.key',
    }

# Queue configuration
app.conf.task_create_missing_queues = True
app.conf.task_default_queue = 'default'
app.conf.task_queues = {
    'default': {
        'exchange': 'default',
        'routing_key': 'default',
    },
    'workflow_execution': {
        'exchange': 'workflows',
        'routing_key': 'workflow.execution',
        'priority': 8,
    },
    'quality_control': {
        'exchange': 'workflows',
        'routing_key': 'workflow.quality',
        'priority': 9,
    },
    'notifications': {
        'exchange': 'notifications',
        'routing_key': 'notify',
        'priority': 6,
    },
    'analytics': {
        'exchange': 'analytics',
        'routing_key': 'analytics.generate',
        'priority': 4,
    },
    'bulk_operations': {
        'exchange': 'bulk',
        'routing_key': 'bulk.process',
        'priority': 3,
    },
}

@app.task(bind=True)
def debug_task(self):
    """Debug task for testing Celery setup"""
    print(f'Request: {self.request!r}')
    return 'Celery is working!'


# Error handling
@app.task(bind=True, autoretry_for=(Exception,), retry_kwargs={'max_retries': 3})
def error_handler(self, task_id, error, traceback):
    """Handle task errors and send notifications"""
    from domains.workflows.models import WorkflowInstance
    from domains.workflows.tasks import send_notification
    
    try:
        # Log the error
        print(f"Task {task_id} failed: {error}")
        
        # Try to find the related workflow and notify stakeholders
        # This is a simplified version - real implementation would be more robust
        send_notification.delay(
            notification_type='task_error',
            message=f"Workflow task failed: {error}",
            recipients=['admin@company.com']
        )
    except Exception as e:
        print(f"Error in error handler: {e}")


# Custom task decorator for workflow tasks
def workflow_task(*args, **kwargs):
    """
    Custom decorator for workflow-related tasks
    Adds common retry logic and error handling
    """
    kwargs.setdefault('bind', True)
    kwargs.setdefault('autoretry_for', (Exception,))
    kwargs.setdefault('retry_kwargs', {'max_retries': 3, 'countdown': 60})
    kwargs.setdefault('soft_time_limit', 300)  # 5 minutes
    kwargs.setdefault('time_limit', 360)  # 6 minutes
    
    def decorator(func):
        return app.task(*args, **kwargs)(func)
    
    return decorator


# Monitoring and metrics
@app.task
def collect_celery_metrics():
    """Collect Celery metrics for monitoring"""
    inspect = app.control.inspect()
    
    # Get worker stats
    stats = inspect.stats()
    active_tasks = inspect.active()
    scheduled_tasks = inspect.scheduled()
    reserved_tasks = inspect.reserved()
    
    metrics = {
        'timestamp': os.time.time(),
        'workers': len(stats) if stats else 0,
        'active_tasks': sum(len(tasks) for tasks in active_tasks.values()) if active_tasks else 0,
        'scheduled_tasks': sum(len(tasks) for tasks in scheduled_tasks.values()) if scheduled_tasks else 0,
        'reserved_tasks': sum(len(tasks) for tasks in reserved_tasks.values()) if reserved_tasks else 0,
    }
    
    # Store metrics in cache for monitoring dashboard
    from django.core.cache import cache
    cache.set('celery_metrics', metrics, timeout=300)  # 5 minutes
    
    return metrics


if __name__ == '__main__':
    app.start()