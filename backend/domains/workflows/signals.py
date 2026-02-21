"""
Workflow Signals and Events
Django signals for workflow state changes and notifications
"""

import logging
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver, Signal
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import WorkflowInstance, WorkflowStepInstance, QualityCheckResult
from .models import WorkflowInstanceStatus, StepStatus

User = get_user_model()
logger = logging.getLogger(__name__)

# Custom signals for workflow events
workflow_started = Signal()
workflow_completed = Signal()
workflow_failed = Signal()
step_started = Signal()
step_completed = Signal()
step_failed = Signal()
quality_check_failed = Signal()
workflow_overdue = Signal()


@receiver(pre_save, sender=WorkflowInstance)
def workflow_instance_pre_save(sender, instance, **kwargs):
    """Track workflow status changes before save"""
    
    if instance.pk:  # Existing instance
        try:
            old_instance = WorkflowInstance.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except WorkflowInstance.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=WorkflowInstance)
def workflow_instance_post_save(sender, instance, created, **kwargs):
    """Handle workflow instance status changes"""
    
    if created:
        logger.info(f"Workflow instance created: {instance.id}")
        return
    
    old_status = getattr(instance, '_old_status', None)
    new_status = instance.status
    
    if old_status != new_status:
        logger.info(f"Workflow {instance.id} status changed: {old_status} -> {new_status}")
        
        # Emit appropriate signals
        if new_status == WorkflowInstanceStatus.IN_PROGRESS and old_status == WorkflowInstanceStatus.PENDING:
            workflow_started.send(
                sender=WorkflowInstance,
                workflow_instance=instance,
                user=instance.created_by
            )
        
        elif new_status == WorkflowInstanceStatus.COMPLETED:
            workflow_completed.send(
                sender=WorkflowInstance,
                workflow_instance=instance,
                user=instance.final_approver or instance.created_by
            )
            
        elif new_status == WorkflowInstanceStatus.FAILED:
            workflow_failed.send(
                sender=WorkflowInstance,
                workflow_instance=instance,
                user=instance.created_by
            )


@receiver(pre_save, sender=WorkflowStepInstance)
def step_instance_pre_save(sender, instance, **kwargs):
    """Track step status changes before save"""
    
    if instance.pk:
        try:
            old_instance = WorkflowStepInstance.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
        except WorkflowStepInstance.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


@receiver(post_save, sender=WorkflowStepInstance)
def step_instance_post_save(sender, instance, created, **kwargs):
    """Handle step instance status changes"""
    
    if created:
        logger.info(f"Step instance created: {instance.id} ({instance.workflow_step.name})")
        return
    
    old_status = getattr(instance, '_old_status', None)
    new_status = instance.status
    
    if old_status != new_status:
        logger.info(
            f"Step {instance.id} ({instance.workflow_step.name}) "
            f"status changed: {old_status} -> {new_status}"
        )
        
        # Emit appropriate signals
        if new_status == StepStatus.IN_PROGRESS and old_status == StepStatus.PENDING:
            step_started.send(
                sender=WorkflowStepInstance,
                step_instance=instance,
                user=instance.assigned_to
            )
        
        elif new_status == StepStatus.COMPLETED:
            step_completed.send(
                sender=WorkflowStepInstance,
                step_instance=instance,
                user=instance.assigned_to
            )
            
        elif new_status == StepStatus.FAILED:
            step_failed.send(
                sender=WorkflowStepInstance,
                step_instance=instance,
                user=instance.assigned_to
            )


@receiver(post_save, sender=QualityCheckResult)
def quality_check_result_post_save(sender, instance, created, **kwargs):
    """Handle quality check results"""
    
    if created and not instance.passed:
        logger.warning(
            f"Quality check failed: {instance.quality_control.name} "
            f"for step {instance.step_instance.workflow_step.name}"
        )
        
        quality_check_failed.send(
            sender=QualityCheckResult,
            quality_result=instance,
            step_instance=instance.step_instance
        )


# Signal handlers for notifications
@receiver(workflow_started)
def handle_workflow_started(sender, workflow_instance, user, **kwargs):
    """Handle workflow started event"""
    
    logger.info(f"Handling workflow started: {workflow_instance.id}")
    
    # Send notification to assigned user and participants
    recipients = [workflow_instance.assigned_to] if workflow_instance.assigned_to else []
    recipients.extend(workflow_instance.participants.all())
    
    # Remove duplicates
    unique_recipients = list(set(recipients))
    
    for recipient in unique_recipients:
        send_workflow_notification(
            recipient=recipient,
            workflow_instance=workflow_instance,
            event_type='workflow_started',
            message=f"Workflow '{workflow_instance.name}' has been started"
        )


@receiver(workflow_completed)
def handle_workflow_completed(sender, workflow_instance, user, **kwargs):
    """Handle workflow completed event"""
    
    logger.info(f"Handling workflow completed: {workflow_instance.id}")
    
    # Notify stakeholders
    recipients = [workflow_instance.created_by]
    if workflow_instance.assigned_to and workflow_instance.assigned_to != workflow_instance.created_by:
        recipients.append(workflow_instance.assigned_to)
    
    recipients.extend(workflow_instance.participants.all())
    unique_recipients = list(set(recipients))
    
    for recipient in unique_recipients:
        send_workflow_notification(
            recipient=recipient,
            workflow_instance=workflow_instance,
            event_type='workflow_completed',
            message=f"Workflow '{workflow_instance.name}' has been completed successfully"
        )


@receiver(workflow_failed)
def handle_workflow_failed(sender, workflow_instance, user, **kwargs):
    """Handle workflow failed event"""
    
    logger.error(f"Handling workflow failed: {workflow_instance.id}")
    
    # Notify stakeholders about failure
    recipients = [workflow_instance.created_by]
    if workflow_instance.assigned_to and workflow_instance.assigned_to != workflow_instance.created_by:
        recipients.append(workflow_instance.assigned_to)
    
    unique_recipients = list(set(recipients))
    
    for recipient in unique_recipients:
        send_workflow_notification(
            recipient=recipient,
            workflow_instance=workflow_instance,
            event_type='workflow_failed',
            message=f"Workflow '{workflow_instance.name}' has failed",
            priority='high'
        )


@receiver(step_started)
def handle_step_started(sender, step_instance, user, **kwargs):
    """Handle step started event"""
    
    logger.info(f"Handling step started: {step_instance.id}")
    
    if step_instance.assigned_to:
        send_step_notification(
            recipient=step_instance.assigned_to,
            step_instance=step_instance,
            event_type='step_assigned',
            message=f"You have been assigned step '{step_instance.workflow_step.name}'"
        )


@receiver(step_completed)
def handle_step_completed(sender, step_instance, user, **kwargs):
    """Handle step completed event"""
    
    logger.info(f"Handling step completed: {step_instance.id}")
    
    # Notify workflow owner about step completion
    workflow = step_instance.workflow_instance
    
    if workflow.created_by != step_instance.assigned_to:
        send_step_notification(
            recipient=workflow.created_by,
            step_instance=step_instance,
            event_type='step_completed',
            message=f"Step '{step_instance.workflow_step.name}' has been completed in workflow '{workflow.name}'"
        )


@receiver(step_failed)
def handle_step_failed(sender, step_instance, user, **kwargs):
    """Handle step failed event"""
    
    logger.error(f"Handling step failed: {step_instance.id}")
    
    # Notify relevant stakeholders about step failure
    workflow = step_instance.workflow_instance
    recipients = [workflow.created_by]
    
    if workflow.assigned_to and workflow.assigned_to != workflow.created_by:
        recipients.append(workflow.assigned_to)
    
    if step_instance.assigned_to and step_instance.assigned_to not in recipients:
        recipients.append(step_instance.assigned_to)
    
    for recipient in recipients:
        send_step_notification(
            recipient=recipient,
            step_instance=step_instance,
            event_type='step_failed',
            message=f"Step '{step_instance.workflow_step.name}' has failed in workflow '{workflow.name}'",
            priority='high'
        )


@receiver(quality_check_failed)
def handle_quality_check_failed(sender, quality_result, step_instance, **kwargs):
    """Handle quality check failure"""
    
    logger.warning(f"Handling quality check failed: {quality_result.id}")
    
    # Notify step assignee about quality failure
    if step_instance.assigned_to:
        send_step_notification(
            recipient=step_instance.assigned_to,
            step_instance=step_instance,
            event_type='quality_check_failed',
            message=f"Quality check '{quality_result.quality_control.name}' failed for step '{step_instance.workflow_step.name}'",
            priority='high'
        )


def send_workflow_notification(
    recipient: User,
    workflow_instance: WorkflowInstance,
    event_type: str,
    message: str,
    priority: str = 'normal'
):
    """Send workflow-related notification"""
    
    # For now, just log the notification
    # In a real implementation, you'd integrate with email/SMS/push notification services
    
    logger.info(f"NOTIFICATION [{priority.upper()}] to {recipient.get_full_name()}: {message}")
    
    # TODO: Implement actual notification delivery
    # - Email notifications
    # - In-app notifications  
    # - Push notifications
    # - SMS for urgent notifications
    
    notification_data = {
        'recipient': recipient.id,
        'recipient_name': recipient.get_full_name(),
        'workflow_id': workflow_instance.id,
        'workflow_name': workflow_instance.name,
        'event_type': event_type,
        'message': message,
        'priority': priority,
        'timestamp': timezone.now().isoformat(),
        'url': f"/dashboard/workflows/{workflow_instance.id}"
    }
    
    # Store in database or queue for processing
    logger.debug(f"Notification data: {notification_data}")


def send_step_notification(
    recipient: User,
    step_instance: WorkflowStepInstance,
    event_type: str,
    message: str,
    priority: str = 'normal'
):
    """Send step-related notification"""
    
    logger.info(f"NOTIFICATION [{priority.upper()}] to {recipient.get_full_name()}: {message}")
    
    notification_data = {
        'recipient': recipient.id,
        'recipient_name': recipient.get_full_name(),
        'workflow_id': step_instance.workflow_instance.id,
        'workflow_name': step_instance.workflow_instance.name,
        'step_id': step_instance.id,
        'step_name': step_instance.workflow_step.name,
        'event_type': event_type,
        'message': message,
        'priority': priority,
        'timestamp': timezone.now().isoformat(),
        'url': f"/dashboard/workflows/{step_instance.workflow_instance.id}/steps/{step_instance.id}"
    }
    
    logger.debug(f"Step notification data: {notification_data}")


def check_overdue_workflows():
    """
    Utility function to check for overdue workflows and send notifications
    This would typically be run as a periodic task (e.g., celery beat)
    """
    
    now = timezone.now()
    
    # Find overdue workflows
    overdue_workflows = WorkflowInstance.objects.filter(
        due_date__lt=now,
        status__in=[WorkflowInstanceStatus.PENDING, WorkflowInstanceStatus.IN_PROGRESS]
    ).select_related('assigned_to', 'created_by')
    
    for workflow in overdue_workflows:
        logger.warning(f"Workflow {workflow.id} is overdue")
        
        # Emit overdue signal
        workflow_overdue.send(
            sender=WorkflowInstance,
            workflow_instance=workflow
        )
        
        # Send notifications
        recipients = [workflow.created_by]
        if workflow.assigned_to and workflow.assigned_to != workflow.created_by:
            recipients.append(workflow.assigned_to)
        
        for recipient in recipients:
            send_workflow_notification(
                recipient=recipient,
                workflow_instance=workflow,
                event_type='workflow_overdue',
                message=f"Workflow '{workflow.name}' is overdue (Due: {workflow.due_date})",
                priority='high'
            )
    
    # Find overdue steps
    overdue_steps = WorkflowStepInstance.objects.filter(
        due_date__lt=now,
        status__in=[StepStatus.PENDING, StepStatus.IN_PROGRESS]
    ).select_related('assigned_to', 'workflow_instance')
    
    for step in overdue_steps:
        logger.warning(f"Step {step.id} is overdue")
        
        if step.assigned_to:
            send_step_notification(
                recipient=step.assigned_to,
                step_instance=step,
                event_type='step_overdue',
                message=f"Step '{step.workflow_step.name}' is overdue (Due: {step.due_date})",
                priority='high'
            )
    
    return {
        'overdue_workflows': overdue_workflows.count(),
        'overdue_steps': overdue_steps.count()
    }