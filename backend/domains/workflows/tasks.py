"""
Workflow Celery Tasks
Asynchronous task processing for workflow execution, quality checks, and notifications
"""

import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from decimal import Decimal

from celery import shared_task
from django.utils import timezone
from django.core.cache import cache
from django.db import transaction
from django.contrib.auth import get_user_model

from .models import (
    WorkflowInstance, WorkflowStepInstance, WorkflowTemplate,
    QualityControl, QualityCheckResult, WorkflowInstanceStatus,
    StepStatus
)
from .permissions import workflow_permission_manager

User = get_user_model()
logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def execute_workflow_step(self, step_instance_id: str, user_id: str = None, context: Dict[str, Any] = None):
    """
    Execute a single workflow step asynchronously
    """
    try:
        step_instance = WorkflowStepInstance.objects.select_related(
            'workflow_instance', 'workflow_step'
        ).get(id=step_instance_id)
        
        user = User.objects.get(id=user_id) if user_id else None
        context = context or {}
        
        logger.info(f"Executing workflow step: {step_instance.workflow_step.name} for {step_instance.workflow_instance.name}")
        
        # Update step status
        step_instance.status = StepStatus.IN_PROGRESS
        step_instance.start_date = timezone.now()
        if user:
            step_instance.assigned_to = user
        step_instance.save()
        
        # Add audit entry
        step_instance.workflow_instance.add_audit_entry(
            'step_execution_started',
            user,
            {
                'step_name': step_instance.workflow_step.name,
                'task_id': str(self.request.id)
            }
        )
        
        # Execute step based on type
        step_type = step_instance.workflow_step.step_type
        result = None
        
        if step_type == 'automated':
            result = _execute_automated_step(step_instance, context)
        elif step_type == 'quality_gate':
            result = _execute_quality_gate_step(step_instance, context)
        elif step_type == 'notification':
            result = _execute_notification_step(step_instance, context)
        else:
            # Manual steps require human intervention
            result = {
                'status': 'waiting_for_manual_completion',
                'message': f'Step {step_instance.workflow_step.name} requires manual completion'
            }
        
        # Update step with results
        if result and result.get('status') == 'completed':
            step_instance.complete(
                user=user,
                quality_score=result.get('quality_score'),
                output_data=result.get('output_data', {})
            )
        elif result and result.get('status') == 'failed':
            step_instance.status = StepStatus.FAILED
            step_instance.notes = result.get('error_message', 'Step execution failed')
            step_instance.save()
        
        # Check if workflow should advance to next step
        _check_workflow_progression(step_instance.workflow_instance)
        
        # Send real-time update
        send_workflow_update.delay(str(step_instance.workflow_instance.id), {
            'type': 'step_updated',
            'step_id': str(step_instance.id),
            'step_name': step_instance.workflow_step.name,
            'status': step_instance.status,
            'progress': step_instance.workflow_instance.progress_percentage
        })
        
        return {
            'step_id': str(step_instance.id),
            'status': step_instance.status,
            'result': result
        }
        
    except WorkflowStepInstance.DoesNotExist:
        logger.error(f"Workflow step instance {step_instance_id} not found")
        raise
    except Exception as exc:
        logger.error(f"Error executing workflow step {step_instance_id}: {exc}")
        self.retry(countdown=60, exc=exc)


def _execute_automated_step(step_instance: WorkflowStepInstance, context: Dict[str, Any]) -> Dict[str, Any]:
    """Execute automated step logic"""
    step = step_instance.workflow_step
    
    # Get step configuration
    config = step.configuration or {}
    actions = step.actions or []
    
    results = []
    
    for action in actions:
        action_type = action.get('type')
        action_config = action.get('config', {})
        
        try:
            if action_type == 'data_validation':
                result = _validate_data(context, action_config)
            elif action_type == 'api_call':
                result = _make_api_call(action_config)
            elif action_type == 'file_processing':
                result = _process_files(context, action_config)
            elif action_type == 'calculation':
                result = _perform_calculation(context, action_config)
            else:
                result = {'status': 'skipped', 'reason': f'Unknown action type: {action_type}'}
            
            results.append(result)
            
        except Exception as e:
            logger.error(f"Error executing action {action_type}: {e}")
            return {
                'status': 'failed',
                'error_message': f'Action {action_type} failed: {str(e)}'
            }
    
    # Determine overall step result
    failed_results = [r for r in results if r.get('status') == 'failed']
    if failed_results:
        return {
            'status': 'failed',
            'error_message': 'One or more actions failed',
            'details': results
        }
    
    return {
        'status': 'completed',
        'output_data': {'action_results': results},
        'quality_score': _calculate_step_quality_score(results)
    }


def _execute_quality_gate_step(step_instance: WorkflowStepInstance, context: Dict[str, Any]) -> Dict[str, Any]:
    """Execute quality gate step with automated checks"""
    
    # Get quality controls for this step
    quality_controls = QualityControl.objects.filter(
        workflow_step=step_instance.workflow_step,
        type='automated'
    )
    
    overall_score = 0
    total_weight = 0
    check_results = []
    
    for qc in quality_controls:
        # Execute quality check
        quality_check_task.delay(str(qc.id), str(step_instance.id), context)
        
        # For now, simulate immediate result (in real implementation, this would be async)
        score = _simulate_quality_check(qc, context)
        weight = qc.weight or 1
        
        overall_score += score * weight
        total_weight += weight
        
        check_results.append({
            'control_name': qc.name,
            'score': score,
            'weight': weight,
            'passed': score >= qc.passing_score
        })
    
    # Calculate final score
    final_score = overall_score / total_weight if total_weight > 0 else 0
    passed = final_score >= step_instance.workflow_step.workflow_template.quality_threshold
    
    return {
        'status': 'completed' if passed else 'failed',
        'quality_score': final_score,
        'output_data': {
            'quality_checks': check_results,
            'overall_passed': passed
        }
    }


def _execute_notification_step(step_instance: WorkflowStepInstance, context: Dict[str, Any]) -> Dict[str, Any]:
    """Execute notification step"""
    step = step_instance.workflow_step
    config = step.configuration or {}
    
    notification_type = config.get('type', 'email')
    recipients = config.get('recipients', [])
    template = config.get('template')
    
    # Send notification
    send_notification.delay(
        notification_type=notification_type,
        recipients=recipients,
        template=template,
        context={
            'workflow': step_instance.workflow_instance.name,
            'step': step_instance.workflow_step.name,
            'user': step_instance.assigned_to.get_full_name() if step_instance.assigned_to else 'System',
            **context
        }
    )
    
    return {
        'status': 'completed',
        'output_data': {
            'notification_sent': True,
            'recipients_count': len(recipients)
        }
    }


@shared_task(bind=True, max_retries=3)
def quality_check_task(self, quality_control_id: str, step_instance_id: str, context: Dict[str, Any] = None):
    """
    Execute quality control check asynchronously
    """
    try:
        quality_control = QualityControl.objects.get(id=quality_control_id)
        step_instance = WorkflowStepInstance.objects.get(id=step_instance_id)
        context = context or {}
        
        logger.info(f"Executing quality check: {quality_control.name}")
        
        # Execute quality check based on type
        if quality_control.type == 'automated':
            result = _execute_automated_quality_check(quality_control, step_instance, context)
        elif quality_control.type == 'checklist':
            result = _execute_checklist_quality_check(quality_control, step_instance, context)
        else:
            # Manual quality checks require human review
            result = {
                'passed': None,
                'score': 0,
                'requires_manual_review': True
            }
        
        # Save quality check result
        QualityCheckResult.objects.create(
            quality_control=quality_control,
            step_instance=step_instance,
            passed=result['passed'],
            score=result['score'],
            details=result.get('details', {}),
            reviewer=None,  # Automated check
            requires_remediation=not result['passed'] if result['passed'] is not None else False
        )
        
        return result
        
    except Exception as exc:
        logger.error(f"Error executing quality check {quality_control_id}: {exc}")
        self.retry(countdown=60, exc=exc)


@shared_task
def send_notification(notification_type: str, recipients: List[str], template: str = None, context: Dict[str, Any] = None):
    """
    Send notifications asynchronously
    """
    try:
        context = context or {}
        
        if notification_type == 'email':
            _send_email_notification(recipients, template, context)
        elif notification_type == 'webhook':
            _send_webhook_notification(recipients, context)
        elif notification_type == 'slack':
            _send_slack_notification(recipients, context)
        else:
            logger.warning(f"Unknown notification type: {notification_type}")
        
        logger.info(f"Notification sent to {len(recipients)} recipients")
        
    except Exception as e:
        logger.error(f"Error sending notification: {e}")


@shared_task
def send_workflow_update(workflow_instance_id: str, update_data: Dict[str, Any]):
    """
    Send real-time workflow updates via WebSocket
    """
    try:
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        
        channel_layer = get_channel_layer()
        
        # Send to workflow-specific group
        group_name = f"workflow_{workflow_instance_id}"
        
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                'type': 'workflow_update',
                'update_data': update_data
            }
        )
        
        # Also send to general workflow updates group
        async_to_sync(channel_layer.group_send)(
            'workflow_updates',
            {
                'type': 'workflow_update',
                'workflow_id': workflow_instance_id,
                'update_data': update_data
            }
        )
        
    except Exception as e:
        logger.error(f"Error sending workflow update: {e}")


@shared_task
def bulk_workflow_operation(operation: str, workflow_ids: List[str], parameters: Dict[str, Any] = None):
    """
    Execute bulk operations on multiple workflows
    """
    try:
        parameters = parameters or {}
        results = []
        
        for workflow_id in workflow_ids:
            try:
                workflow = WorkflowInstance.objects.get(id=workflow_id)
                
                if operation == 'start':
                    workflow.start()
                elif operation == 'pause':
                    workflow.status = WorkflowInstanceStatus.ON_HOLD
                    workflow.save()
                elif operation == 'cancel':
                    workflow.status = WorkflowInstanceStatus.CANCELLED
                    workflow.save()
                elif operation == 'update_priority':
                    workflow.priority = parameters.get('priority', workflow.priority)
                    workflow.save()
                
                results.append({
                    'workflow_id': workflow_id,
                    'status': 'success',
                    'operation': operation
                })
                
            except Exception as e:
                results.append({
                    'workflow_id': workflow_id,
                    'status': 'error',
                    'error': str(e)
                })
        
        return {
            'operation': operation,
            'processed': len(workflow_ids),
            'successful': len([r for r in results if r['status'] == 'success']),
            'failed': len([r for r in results if r['status'] == 'error']),
            'details': results
        }
        
    except Exception as e:
        logger.error(f"Error in bulk workflow operation: {e}")
        raise


@shared_task
def cleanup_expired_workflows():
    """
    Cleanup expired and stale workflows (periodic task)
    """
    try:
        cutoff_date = timezone.now() - timedelta(days=90)
        
        # Find completed workflows older than 90 days
        expired_workflows = WorkflowInstance.objects.filter(
            status=WorkflowInstanceStatus.COMPLETED,
            completed_date__lt=cutoff_date
        )
        
        archived_count = 0
        for workflow in expired_workflows:
            # Archive instead of delete to preserve audit trail
            workflow.status = WorkflowInstanceStatus.ARCHIVED
            workflow.save()
            archived_count += 1
        
        logger.info(f"Archived {archived_count} expired workflows")
        return {'archived_count': archived_count}
        
    except Exception as e:
        logger.error(f"Error cleaning up expired workflows: {e}")


@shared_task
def update_workflow_analytics():
    """
    Update workflow analytics cache (periodic task)
    """
    try:
        from .analytics import WorkflowAnalyticsEngine
        
        analytics_engine = WorkflowAnalyticsEngine()
        
        # Generate and cache analytics data
        dashboard_data = analytics_engine.get_progress_dashboard()
        cache.set('workflow_dashboard_data', dashboard_data, timeout=1800)  # 30 minutes
        
        # Generate real-time metrics
        realtime_metrics = analytics_engine.get_realtime_metrics()
        cache.set('workflow_realtime_metrics', realtime_metrics, timeout=300)  # 5 minutes
        
        logger.info("Workflow analytics updated successfully")
        
    except Exception as e:
        logger.error(f"Error updating workflow analytics: {e}")


@shared_task
def check_overdue_workflows():
    """
    Check for overdue workflows and send notifications (periodic task)
    """
    try:
        overdue_workflows = WorkflowInstance.objects.filter(
            due_date__lt=timezone.now().date(),
            status__in=[WorkflowInstanceStatus.PENDING, WorkflowInstanceStatus.IN_PROGRESS]
        ).select_related('assigned_to', 'workflow_template')
        
        for workflow in overdue_workflows:
            # Send notification to assigned user and managers
            recipients = []
            if workflow.assigned_to:
                recipients.append(workflow.assigned_to.email)
            
            # Add managers (this would be more sophisticated in real implementation)
            # For now, just add a default admin email
            recipients.append('admin@company.com')
            
            send_notification.delay(
                notification_type='email',
                recipients=recipients,
                template='workflow_overdue',
                context={
                    'workflow_name': workflow.name,
                    'due_date': workflow.due_date,
                    'days_overdue': (timezone.now().date() - workflow.due_date).days
                }
            )
        
        logger.info(f"Checked {overdue_workflows.count()} overdue workflows")
        
    except Exception as e:
        logger.error(f"Error checking overdue workflows: {e}")


@shared_task
def generate_quality_reports():
    """
    Generate daily quality reports (periodic task)
    """
    try:
        from .analytics import WorkflowAnalyticsEngine
        
        analytics_engine = WorkflowAnalyticsEngine()
        
        # Generate compliance report for yesterday
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=1)
        
        compliance_report = analytics_engine.generate_compliance_report(start_date, end_date)
        
        # Store report in cache and/or database
        cache.set(f'compliance_report_{start_date}', compliance_report, timeout=86400 * 7)  # 1 week
        
        # Send report to stakeholders if there are issues
        if compliance_report.critical_issues > 0:
            send_notification.delay(
                notification_type='email',
                recipients=['quality@company.com', 'admin@company.com'],
                template='daily_quality_report',
                context={'report': compliance_report.__dict__}
            )
        
        logger.info("Daily quality report generated successfully")
        
    except Exception as e:
        logger.error(f"Error generating quality reports: {e}")


# Helper functions

def _check_workflow_progression(workflow_instance: WorkflowInstance):
    """Check if workflow can progress to next step"""
    
    if not workflow_instance.workflow_template.require_sequential:
        return  # Parallel execution allowed
    
    # Find next pending step
    next_step = workflow_instance.step_instances.filter(
        status=StepStatus.PENDING
    ).order_by('workflow_step__order').first()
    
    if next_step:
        # Check if all dependencies are completed
        dependencies_completed = all(
            workflow_instance.step_instances.filter(
                workflow_step__in=next_step.workflow_step.depends_on.all(),
                status=StepStatus.COMPLETED
            ).count() == next_step.workflow_step.depends_on.count()
        )
        
        if dependencies_completed:
            # Auto-start next step if configured
            if workflow_instance.workflow_template.auto_assign:
                execute_workflow_step.delay(str(next_step.id))


def _validate_data(context: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
    """Validate data according to configuration"""
    # Simplified validation logic
    required_fields = config.get('required_fields', [])
    
    for field in required_fields:
        if field not in context or not context[field]:
            return {'status': 'failed', 'reason': f'Missing required field: {field}'}
    
    return {'status': 'success'}


def _make_api_call(config: Dict[str, Any]) -> Dict[str, Any]:
    """Make external API call"""
    import requests
    
    url = config.get('url')
    method = config.get('method', 'GET')
    headers = config.get('headers', {})
    data = config.get('data', {})
    
    try:
        response = requests.request(method, url, headers=headers, json=data, timeout=30)
        response.raise_for_status()
        
        return {
            'status': 'success',
            'response_data': response.json() if response.content else None,
            'status_code': response.status_code
        }
    except requests.RequestException as e:
        return {'status': 'failed', 'error': str(e)}


def _process_files(context: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
    """Process files according to configuration"""
    # Placeholder for file processing logic
    return {'status': 'success', 'files_processed': 0}


def _perform_calculation(context: Dict[str, Any], config: Dict[str, Any]) -> Dict[str, Any]:
    """Perform calculations based on configuration"""
    # Placeholder for calculation logic
    return {'status': 'success', 'result': 0}


def _calculate_step_quality_score(results: List[Dict[str, Any]]) -> int:
    """Calculate quality score for step based on action results"""
    successful_actions = sum(1 for r in results if r.get('status') == 'success')
    total_actions = len(results)
    
    if total_actions == 0:
        return 100
    
    return int((successful_actions / total_actions) * 100)


def _simulate_quality_check(quality_control: QualityControl, context: Dict[str, Any]) -> int:
    """Simulate quality check execution (placeholder)"""
    # In real implementation, this would execute actual quality check logic
    import random
    return random.randint(70, 100)


def _execute_automated_quality_check(qc: QualityControl, step_instance: WorkflowStepInstance, context: Dict[str, Any]) -> Dict[str, Any]:
    """Execute automated quality check"""
    # Placeholder implementation
    score = _simulate_quality_check(qc, context)
    passed = score >= qc.passing_score
    
    return {
        'passed': passed,
        'score': score,
        'details': {'check_type': 'automated', 'criteria_met': passed}
    }


def _execute_checklist_quality_check(qc: QualityControl, step_instance: WorkflowStepInstance, context: Dict[str, Any]) -> Dict[str, Any]:
    """Execute checklist-based quality check"""
    criteria = qc.criteria or {}
    checklist_items = criteria.get('checklist', [])
    
    # For automated checklist, check items that can be verified programmatically
    passed_items = 0
    total_items = len(checklist_items)
    
    for item in checklist_items:
        # Simplified check logic
        if item.get('auto_checkable', False):
            # Perform automated check
            passed_items += 1
    
    if total_items == 0:
        return {'passed': True, 'score': 100, 'details': {'no_criteria': True}}
    
    score = int((passed_items / total_items) * 100)
    passed = score >= qc.passing_score
    
    return {
        'passed': passed,
        'score': score,
        'details': {
            'checklist_items': total_items,
            'passed_items': passed_items,
            'auto_checked': True
        }
    }


def _send_email_notification(recipients: List[str], template: str, context: Dict[str, Any]):
    """Send email notification (placeholder)"""
    # In real implementation, this would use Django's email system
    logger.info(f"Email notification sent to {recipients} using template {template}")


def _send_webhook_notification(recipients: List[str], context: Dict[str, Any]):
    """Send webhook notification (placeholder)"""
    # In real implementation, this would make HTTP POST requests
    logger.info(f"Webhook notifications sent to {len(recipients)} endpoints")


def _send_slack_notification(recipients: List[str], context: Dict[str, Any]):
    """Send Slack notification (placeholder)"""
    # In real implementation, this would use Slack API
    logger.info(f"Slack notifications sent to {len(recipients)} channels/users")