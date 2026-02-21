"""
Workflow Integrations
Integration points between workflows and other domain models
Includes external API integration hooks and notification system
"""

import logging
import json
import requests
from typing import Optional, List, Dict, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model
from django.db import transaction
from django.conf import settings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone

from domains.projects.models import Project, ProjectStatus
from .models import WorkflowTemplate, WorkflowInstance, WorkflowInstanceStatus, WorkflowStepInstance

User = get_user_model()
logger = logging.getLogger(__name__)


class ProjectWorkflowIntegration:
    """
    Integration between Projects and Workflows
    Automatically attaches workflows to projects based on project types
    """
    
    # Mapping of project types to workflow template names
    PROJECT_TYPE_WORKFLOWS = {
        'Prior Art Search - Patentability': 'Prior Art Search - Patentability',
        'Patent Drafting - Utility': 'Patent Drafting - Utility Patent',
        'Freedom to Operate Search': 'Freedom to Operate Analysis',
        'Prior Art Search - Validity': 'Prior Art Search - Patentability',  # Reuse same workflow
        'Patent Drafting - Provisional': 'Patent Drafting - Utility Patent',  # Adapted workflow
        # Add more mappings as needed
    }
    
    @classmethod
    def attach_workflows_to_project(
        cls, 
        project: Project, 
        user: User,
        workflow_names: Optional[List[str]] = None,
        auto_start: bool = False
    ) -> List[WorkflowInstance]:
        """
        Attach appropriate workflows to a project based on its type
        """
        
        if not workflow_names:
            # Auto-determine workflows based on project type
            project_type_name = cls._get_project_type_name(project)
            workflow_names = [cls.PROJECT_TYPE_WORKFLOWS.get(project_type_name)]
            workflow_names = [name for name in workflow_names if name]  # Filter None values
        
        if not workflow_names:
            logger.warning(f"No workflows found for project type: {project.type}")
            return []
        
        attached_workflows = []
        
        with transaction.atomic():
            for workflow_name in workflow_names:
                try:
                    # Find workflow template
                    template = WorkflowTemplate.objects.get(
                        name=workflow_name,
                        is_active=True
                    )
                    
                    # Check if workflow already attached
                    existing = WorkflowInstance.objects.filter(
                        workflow_template=template,
                        content_type=ContentType.objects.get_for_model(Project),
                        object_id=project.id
                    ).exists()
                    
                    if existing:
                        logger.info(f"Workflow {workflow_name} already attached to project {project.id}")
                        continue
                    
                    # Create workflow instance
                    from .services import workflow_engine
                    workflow_instance = workflow_engine.create_workflow_instance(
                        template_id=str(template.id),
                        target_object=project,
                        user=user,
                        name=f"{workflow_name} - {project.name}",
                        assigned_to=project.lead_attorney or user,
                        organization=project.organization,
                        due_date=project.target_date,
                        priority=cls._map_project_priority(project.priority),
                        tags=project.tags.copy() if project.tags else []
                    )
                    
                    attached_workflows.append(workflow_instance)
                    
                    # Auto-start if requested
                    if auto_start:
                        from .services import workflow_engine
                        workflow_engine.start_workflow(workflow_instance, user)
                    
                    logger.info(f"Attached workflow {workflow_name} to project {project.id}")
                    
                except WorkflowTemplate.DoesNotExist:
                    logger.error(f"Workflow template '{workflow_name}' not found")
                    continue
                    
                except Exception as e:
                    logger.error(f"Failed to attach workflow {workflow_name} to project {project.id}: {e}")
                    continue
        
        return attached_workflows
    
    @classmethod
    def _get_project_type_name(cls, project: Project) -> str:
        """Get the project type name for workflow mapping"""
        
        # Try to get from configurable project types first
        try:
            from domains.projects.models import ConfigurableProjectType
            project_type = ConfigurableProjectType.objects.get(id=project.type)
            return project_type.name
        except (ConfigurableProjectType.DoesNotExist, ValueError):
            # Fallback to direct type string
            return project.type
    
    @classmethod
    def _map_project_priority(cls, project_priority: str) -> str:
        """Map project priority to workflow priority"""
        mapping = {
            'low': 'low',
            'medium': 'medium', 
            'high': 'high',
            'urgent': 'urgent'
        }
        return mapping.get(project_priority, 'medium')
    
    @classmethod
    def get_project_workflows(cls, project: Project) -> List[WorkflowInstance]:
        """Get all workflows attached to a project"""
        
        content_type = ContentType.objects.get_for_model(Project)
        
        return list(WorkflowInstance.objects.filter(
            content_type=content_type,
            object_id=project.id
        ).select_related('workflow_template', 'assigned_to').order_by('-created_at'))
    
    @classmethod
    def update_project_status_from_workflows(cls, project: Project):
        """Update project status based on workflow completion"""
        
        workflows = cls.get_project_workflows(project)
        
        if not workflows:
            return
        
        # Analyze workflow statuses
        workflow_statuses = [w.status for w in workflows]
        
        # Determine new project status
        if all(status == WorkflowInstanceStatus.COMPLETED for status in workflow_statuses):
            new_status = ProjectStatus.COMPLETED
        elif any(status == WorkflowInstanceStatus.FAILED for status in workflow_statuses):
            new_status = ProjectStatus.UNDER_REVIEW  # Needs attention
        elif any(status == WorkflowInstanceStatus.IN_PROGRESS for status in workflow_statuses):
            new_status = ProjectStatus.ACTIVE
        else:
            return  # No change needed
        
        # Update project status if changed
        if project.status != new_status:
            project.status = new_status
            project.save(update_fields=['status'])
            
            logger.info(f"Updated project {project.id} status to {new_status} based on workflows")
    
    @classmethod
    def sync_project_assignments(cls, project: Project):
        """Sync project team assignments with workflow assignments"""
        
        workflows = cls.get_project_workflows(project)
        
        for workflow in workflows:
            # Update workflow assignment if project lead changed
            if project.lead_attorney and workflow.assigned_to != project.lead_attorney:
                workflow.assigned_to = project.lead_attorney
                workflow.save(update_fields=['assigned_to'])
                
                # Also update step assignments for steps assigned to roles
                for step_instance in workflow.step_instances.filter(assigned_to__isnull=True):
                    step = step_instance.workflow_step
                    
                    if step.assigned_role == 'lead_attorney':
                        step_instance.assigned_to = project.lead_attorney
                        step_instance.save(update_fields=['assigned_to'])
                
                logger.info(f"Synced workflow {workflow.id} assignment with project lead")


class WorkflowProjectSignalHandlers:
    """Signal handlers for project-workflow integration"""
    
    @staticmethod
    def handle_project_created(project: Project, user: User):
        """Handle new project creation - attach appropriate workflows"""
        
        # Auto-attach workflows based on project type
        workflows = ProjectWorkflowIntegration.attach_workflows_to_project(
            project=project,
            user=user,
            auto_start=False  # Don't auto-start, let user decide
        )
        
        if workflows:
            logger.info(f"Auto-attached {len(workflows)} workflows to project {project.id}")
    
    @staticmethod
    def handle_project_status_changed(project: Project, old_status: str, new_status: str):
        """Handle project status changes"""
        
        workflows = ProjectWorkflowIntegration.get_project_workflows(project)
        
        # If project is cancelled/archived, pause workflows
        if new_status in [ProjectStatus.ARCHIVED] and old_status != new_status:
            from .services import workflow_engine
            for workflow in workflows:
                if workflow.status == WorkflowInstanceStatus.IN_PROGRESS:
                    workflow_engine.pause_workflow(workflow, project.created_by)
                    logger.info(f"Paused workflow {workflow.id} due to project status change")
        
        # If project is reactivated, resume workflows  
        elif new_status == ProjectStatus.ACTIVE and old_status in [ProjectStatus.ON_HOLD]:
            from .services import workflow_engine
            for workflow in workflows:
                if workflow.status == WorkflowInstanceStatus.ON_HOLD:
                    workflow_engine.resume_workflow(workflow, project.created_by)
                    logger.info(f"Resumed workflow {workflow.id} due to project reactivation")
    
    @staticmethod
    def handle_project_team_changed(project: Project):
        """Handle project team assignment changes"""
        
        ProjectWorkflowIntegration.sync_project_assignments(project)


class WorkflowRecommendationEngine:
    """
    Intelligent workflow recommendation system
    Suggests appropriate workflows based on project context
    """
    
    @classmethod
    def recommend_workflows_for_project(
        cls, 
        project: Project,
        context: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Recommend workflows for a project based on various factors
        """
        
        recommendations = []
        context = context or {}
        
        # Get base recommendations from project type
        base_workflows = cls._get_base_workflow_recommendations(project)
        
        # Add contextual recommendations
        contextual_workflows = cls._get_contextual_recommendations(project, context)
        
        # Combine and rank recommendations
        all_recommendations = base_workflows + contextual_workflows
        ranked_recommendations = cls._rank_recommendations(all_recommendations, project, context)
        
        return ranked_recommendations
    
    @classmethod
    def _get_base_workflow_recommendations(cls, project: Project) -> List[Dict[str, Any]]:
        """Get base workflow recommendations from project type"""
        
        recommendations = []
        project_type_name = ProjectWorkflowIntegration._get_project_type_name(project)
        
        # Primary workflow recommendation
        primary_workflow = ProjectWorkflowIntegration.PROJECT_TYPE_WORKFLOWS.get(project_type_name)
        if primary_workflow:
            try:
                template = WorkflowTemplate.objects.get(name=primary_workflow, is_active=True)
                recommendations.append({
                    'template': template,
                    'confidence': 0.9,
                    'reason': f'Primary workflow for {project_type_name}',
                    'category': 'primary',
                    'auto_attach': True
                })
            except WorkflowTemplate.DoesNotExist:
                pass
        
        return recommendations
    
    @classmethod 
    def _get_contextual_recommendations(
        cls, 
        project: Project, 
        context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Get contextual workflow recommendations"""
        
        recommendations = []
        
        # If project involves international filing
        if context.get('international_filing'):
            try:
                # Recommend PCT workflow if available
                template = WorkflowTemplate.objects.get(
                    name__icontains='PCT',
                    is_active=True
                )
                recommendations.append({
                    'template': template,
                    'confidence': 0.8,
                    'reason': 'International filing indicated',
                    'category': 'contextual',
                    'auto_attach': False
                })
            except WorkflowTemplate.DoesNotExist:
                pass
        
        # If project has tight deadlines
        if project.target_date:
            from django.utils import timezone
            days_until_target = (project.target_date - timezone.now().date()).days
            
            if days_until_target < 30:  # Rush project
                try:
                    # Look for expedited workflows
                    expedited_templates = WorkflowTemplate.objects.filter(
                        name__icontains='expedited',
                        is_active=True
                    )
                    for template in expedited_templates:
                        recommendations.append({
                            'template': template,
                            'confidence': 0.7,
                            'reason': f'Tight deadline - {days_until_target} days remaining',
                            'category': 'expedited',
                            'auto_attach': False
                        })
                except:
                    pass
        
        return recommendations
    
    @classmethod
    def _rank_recommendations(
        cls, 
        recommendations: List[Dict[str, Any]], 
        project: Project,
        context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Rank and sort recommendations by relevance"""
        
        # Sort by confidence score (descending)
        return sorted(recommendations, key=lambda x: x['confidence'], reverse=True)


# Utility functions for workflow integration
def get_workflow_progress_for_project(project: Project) -> Dict[str, Any]:
    """Get aggregated workflow progress for a project"""
    
    workflows = ProjectWorkflowIntegration.get_project_workflows(project)
    
    if not workflows:
        return {
            'total_workflows': 0,
            'overall_progress': 0,
            'status_summary': {},
            'next_actions': []
        }
    
    # Calculate overall progress
    total_progress = sum(w.progress_percentage for w in workflows)
    overall_progress = total_progress / len(workflows) if workflows else 0
    
    # Status summary
    status_counts = {}
    for workflow in workflows:
        status = workflow.status
        status_counts[status] = status_counts.get(status, 0) + 1
    
    # Next actions (pending steps across all workflows)
    next_actions = []
    for workflow in workflows:
        pending_steps = workflow.step_instances.filter(
            status='pending'
        ).select_related('workflow_step')[:3]  # Limit to 3 per workflow
        
        for step in pending_steps:
            next_actions.append({
                'workflow_id': workflow.id,
                'workflow_name': workflow.name,
                'step_id': step.id,
                'step_name': step.workflow_step.name,
                'assigned_to': step.assigned_to.get_full_name() if step.assigned_to else 'Unassigned',
                'due_date': step.due_date
            })
    
    return {
        'total_workflows': len(workflows),
        'overall_progress': round(overall_progress, 1),
        'status_summary': status_counts,
        'next_actions': next_actions[:10],  # Limit to top 10 actions
        'workflows': [
            {
                'id': w.id,
                'name': w.name,
                'status': w.status,
                'progress': w.progress_percentage,
                'due_date': w.due_date
            }
            for w in workflows
        ]
    }


# ==================== INTEGRATION HOOKS SYSTEM ====================

class HookTrigger(Enum):
    """Workflow event triggers for integration hooks"""
    WORKFLOW_CREATED = 'workflow_created'
    WORKFLOW_STARTED = 'workflow_started'
    WORKFLOW_COMPLETED = 'workflow_completed'
    WORKFLOW_FAILED = 'workflow_failed'
    WORKFLOW_CANCELLED = 'workflow_cancelled'
    WORKFLOW_PAUSED = 'workflow_paused'
    WORKFLOW_RESUMED = 'workflow_resumed'
    STEP_STARTED = 'step_started'
    STEP_COMPLETED = 'step_completed'
    STEP_FAILED = 'step_failed'
    STEP_ASSIGNED = 'step_assigned'
    QUALITY_CHECK_PASSED = 'quality_check_passed'
    QUALITY_CHECK_FAILED = 'quality_check_failed'
    DEADLINE_APPROACHING = 'deadline_approaching'
    DEADLINE_MISSED = 'deadline_missed'


class IntegrationType(Enum):
    """Types of external integrations"""
    EMAIL_NOTIFICATION = 'email'
    SLACK_WEBHOOK = 'slack'
    TEAMS_WEBHOOK = 'teams'
    EXTERNAL_API = 'api'
    SMS_NOTIFICATION = 'sms'
    JIRA_INTEGRATION = 'jira'
    TRELLO_INTEGRATION = 'trello'
    CUSTOM_WEBHOOK = 'custom_webhook'


@dataclass
class IntegrationHook:
    """Configuration for an integration hook"""
    id: str
    name: str
    trigger: HookTrigger
    integration_type: IntegrationType
    config: Dict[str, Any] = field(default_factory=dict)
    enabled: bool = True
    conditions: Optional[Dict[str, Any]] = None
    retry_count: int = 3
    retry_delay: int = 60  # seconds
    timeout: int = 30  # seconds
    created_by: str = ''
    created_at: str = ''


class WorkflowIntegrationHooksManager:
    """
    Manages external integration hooks for workflow events
    Handles API calls, notifications, and third-party integrations
    """
    
    def __init__(self):
        self._hooks: List[IntegrationHook] = []
        self._load_hooks_from_config()
    
    def _load_hooks_from_config(self):
        """Load integration hooks from Django settings or database"""
        # For now, load from settings. In production, this would load from database
        hooks_config = getattr(settings, 'WORKFLOW_INTEGRATION_HOOKS', {})
        
        for hook_id, hook_data in hooks_config.items():
            hook = IntegrationHook(
                id=hook_id,
                name=hook_data.get('name', hook_id),
                trigger=HookTrigger(hook_data['trigger']),
                integration_type=IntegrationType(hook_data['type']),
                config=hook_data.get('config', {}),
                enabled=hook_data.get('enabled', True),
                conditions=hook_data.get('conditions'),
                retry_count=hook_data.get('retry_count', 3),
                retry_delay=hook_data.get('retry_delay', 60),
                timeout=hook_data.get('timeout', 30),
                created_by=hook_data.get('created_by', 'system'),
                created_at=hook_data.get('created_at', timezone.now().isoformat())
            )
            self._hooks.append(hook)
    
    def register_hook(self, hook: IntegrationHook):
        """Register a new integration hook"""
        # Remove existing hook with same ID if exists
        self._hooks = [h for h in self._hooks if h.id != hook.id]
        self._hooks.append(hook)
        logger.info(f"Registered integration hook: {hook.name} ({hook.id})")
    
    def trigger_hooks(
        self, 
        trigger: HookTrigger, 
        context: Dict[str, Any],
        async_execution: bool = True
    ):
        """Trigger all hooks for a specific event"""
        matching_hooks = [h for h in self._hooks if h.trigger == trigger and h.enabled]
        
        if not matching_hooks:
            logger.debug(f"No hooks found for trigger: {trigger.value}")
            return
        
        logger.info(f"Triggering {len(matching_hooks)} hooks for {trigger.value}")
        
        for hook in matching_hooks:
            try:
                # Check conditions if specified
                if hook.conditions and not self._check_conditions(hook.conditions, context):
                    logger.debug(f"Hook {hook.id} conditions not met, skipping")
                    continue
                
                if async_execution:
                    # In a real implementation, use Celery or Django-RQ for async execution
                    self._execute_hook_async(hook, context)
                else:
                    self._execute_hook(hook, context)
                    
            except Exception as e:
                logger.error(f"Failed to trigger hook {hook.id}: {e}")
    
    def _check_conditions(self, conditions: Dict[str, Any], context: Dict[str, Any]) -> bool:
        """Check if hook conditions are met"""
        for key, expected_value in conditions.items():
            if key not in context:
                return False
            
            context_value = context[key]
            
            # Handle different condition types
            if isinstance(expected_value, dict):
                operator = expected_value.get('op', 'eq')
                value = expected_value.get('value')
                
                if operator == 'eq' and context_value != value:
                    return False
                elif operator == 'ne' and context_value == value:
                    return False
                elif operator == 'in' and context_value not in value:
                    return False
                elif operator == 'contains' and value not in str(context_value):
                    return False
            else:
                if context_value != expected_value:
                    return False
        
        return True
    
    def _execute_hook_async(self, hook: IntegrationHook, context: Dict[str, Any]):
        """Execute hook asynchronously (placeholder for Celery task)"""
        # In production, this would dispatch to a Celery task
        self._execute_hook(hook, context)
    
    def _execute_hook(self, hook: IntegrationHook, context: Dict[str, Any]):
        """Execute an integration hook"""
        try:
            if hook.integration_type == IntegrationType.EMAIL_NOTIFICATION:
                self._send_email_notification(hook, context)
                
            elif hook.integration_type == IntegrationType.SLACK_WEBHOOK:
                self._send_slack_webhook(hook, context)
                
            elif hook.integration_type == IntegrationType.TEAMS_WEBHOOK:
                self._send_teams_webhook(hook, context)
                
            elif hook.integration_type == IntegrationType.EXTERNAL_API:
                self._call_external_api(hook, context)
                
            elif hook.integration_type == IntegrationType.SMS_NOTIFICATION:
                self._send_sms_notification(hook, context)
                
            elif hook.integration_type == IntegrationType.JIRA_INTEGRATION:
                self._create_jira_ticket(hook, context)
                
            elif hook.integration_type == IntegrationType.CUSTOM_WEBHOOK:
                self._call_custom_webhook(hook, context)
                
            else:
                logger.warning(f"Unknown integration type: {hook.integration_type}")
                
        except Exception as e:
            logger.error(f"Hook execution failed for {hook.id}: {e}")
            self._handle_hook_failure(hook, context, e)
    
    def _send_email_notification(self, hook: IntegrationHook, context: Dict[str, Any]):
        """Send email notification"""
        config = hook.config
        template_name = config.get('template', 'workflows/email/default_notification.html')
        
        subject_template = config.get('subject', 'Workflow Notification: {workflow_name}')
        subject = subject_template.format(**context)
        
        # Determine recipients
        recipients = []
        if config.get('notify_assignee') and context.get('assigned_to'):
            recipients.append(context['assigned_to'].email)
        
        if config.get('notify_creator') and context.get('created_by'):
            recipients.append(context['created_by'].email)
        
        if config.get('additional_recipients'):
            recipients.extend(config['additional_recipients'])
        
        if not recipients:
            logger.warning(f"No email recipients found for hook {hook.id}")
            return
        
        # Render email content
        try:
            html_content = render_to_string(template_name, context)
            
            send_mail(
                subject=subject,
                message='',  # Plain text version
                html_message=html_content,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=list(set(recipients)),  # Remove duplicates
                fail_silently=False
            )
            
            logger.info(f"Email notification sent for hook {hook.id} to {len(recipients)} recipients")
            
        except Exception as e:
            logger.error(f"Failed to send email for hook {hook.id}: {e}")
    
    def _send_slack_webhook(self, hook: IntegrationHook, context: Dict[str, Any]):
        """Send Slack webhook notification"""
        webhook_url = hook.config.get('webhook_url')
        if not webhook_url:
            logger.error(f"No webhook URL configured for Slack hook {hook.id}")
            return
        
        # Build Slack message
        message = self._build_slack_message(hook, context)
        
        response = requests.post(
            webhook_url,
            json=message,
            timeout=hook.timeout
        )
        
        if response.status_code == 200:
            logger.info(f"Slack webhook sent successfully for hook {hook.id}")
        else:
            logger.error(f"Slack webhook failed for hook {hook.id}: {response.status_code}")
            response.raise_for_status()
    
    def _build_slack_message(self, hook: IntegrationHook, context: Dict[str, Any]) -> Dict[str, Any]:
        """Build Slack message payload"""
        workflow = context.get('workflow_instance')
        step = context.get('step_instance')
        trigger = hook.trigger
        
        # Color coding based on trigger type
        color_map = {
            HookTrigger.WORKFLOW_COMPLETED: 'good',
            HookTrigger.WORKFLOW_FAILED: 'danger',
            HookTrigger.QUALITY_CHECK_FAILED: 'warning',
            HookTrigger.DEADLINE_MISSED: 'danger',
            HookTrigger.DEADLINE_APPROACHING: 'warning'
        }
        
        color = color_map.get(trigger, '#439FE0')
        
        # Build message text
        if workflow:
            title = f"Workflow: {workflow.name}"
            if step:
                title += f" - Step: {step.workflow_step.name}"
        else:
            title = "Workflow Notification"
        
        fields = []
        
        if workflow:
            fields.extend([
                {
                    "title": "Status",
                    "value": workflow.status.replace('_', ' ').title(),
                    "short": True
                },
                {
                    "title": "Progress", 
                    "value": f"{workflow.progress_percentage}%",
                    "short": True
                }
            ])
            
            if workflow.assigned_to:
                fields.append({
                    "title": "Assigned To",
                    "value": workflow.assigned_to.get_full_name(),
                    "short": True
                })
        
        message = {
            "attachments": [
                {
                    "title": title,
                    "color": color,
                    "fields": fields,
                    "footer": "Patent Analytics Platform",
                    "ts": int(timezone.now().timestamp())
                }
            ]
        }
        
        # Add custom text if configured
        if hook.config.get('custom_text'):
            message['text'] = hook.config['custom_text'].format(**context)
        
        return message
    
    def _send_teams_webhook(self, hook: IntegrationHook, context: Dict[str, Any]):
        """Send Microsoft Teams webhook notification"""
        webhook_url = hook.config.get('webhook_url')
        if not webhook_url:
            logger.error(f"No webhook URL configured for Teams hook {hook.id}")
            return
        
        message = self._build_teams_message(hook, context)
        
        response = requests.post(
            webhook_url,
            json=message,
            timeout=hook.timeout
        )
        
        if response.status_code == 200:
            logger.info(f"Teams webhook sent successfully for hook {hook.id}")
        else:
            logger.error(f"Teams webhook failed for hook {hook.id}: {response.status_code}")
            response.raise_for_status()
    
    def _build_teams_message(self, hook: IntegrationHook, context: Dict[str, Any]) -> Dict[str, Any]:
        """Build Microsoft Teams message payload"""
        workflow = context.get('workflow_instance')
        title = f"Workflow Notification: {workflow.name if workflow else 'System'}"
        
        message = {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": "0076D7",
            "summary": title,
            "sections": [{
                "activityTitle": title,
                "activitySubtitle": f"Trigger: {hook.trigger.value.replace('_', ' ').title()}",
                "facts": []
            }]
        }
        
        if workflow:
            message["sections"][0]["facts"].extend([
                {"name": "Status", "value": workflow.status.replace('_', ' ').title()},
                {"name": "Progress", "value": f"{workflow.progress_percentage}%"}
            ])
            
            if workflow.assigned_to:
                message["sections"][0]["facts"].append({
                    "name": "Assigned To", 
                    "value": workflow.assigned_to.get_full_name()
                })
        
        return message
    
    def _call_external_api(self, hook: IntegrationHook, context: Dict[str, Any]):
        """Call external API endpoint"""
        config = hook.config
        url = config.get('url')
        method = config.get('method', 'POST').upper()
        headers = config.get('headers', {})
        
        if not url:
            logger.error(f"No URL configured for external API hook {hook.id}")
            return
        
        # Build payload
        payload = self._build_api_payload(hook, context)
        
        # Add authentication headers if configured
        auth_config = config.get('authentication', {})
        if auth_config.get('type') == 'bearer':
            headers['Authorization'] = f"Bearer {auth_config['token']}"
        elif auth_config.get('type') == 'basic':
            import base64
            credentials = base64.b64encode(
                f"{auth_config['username']}:{auth_config['password']}".encode()
            ).decode()
            headers['Authorization'] = f"Basic {credentials}"
        elif auth_config.get('type') == 'api_key':
            headers[auth_config.get('header', 'X-API-Key')] = auth_config['key']
        
        # Make API call
        response = requests.request(
            method=method,
            url=url,
            json=payload if method in ['POST', 'PUT', 'PATCH'] else None,
            params=payload if method == 'GET' else None,
            headers=headers,
            timeout=hook.timeout
        )
        
        if 200 <= response.status_code < 300:
            logger.info(f"External API call successful for hook {hook.id}")
        else:
            logger.error(f"External API call failed for hook {hook.id}: {response.status_code}")
            response.raise_for_status()
    
    def _build_api_payload(self, hook: IntegrationHook, context: Dict[str, Any]) -> Dict[str, Any]:
        """Build API payload from context"""
        payload = {
            'trigger': hook.trigger.value,
            'timestamp': timezone.now().isoformat(),
            'hook_id': hook.id
        }
        
        # Add workflow data if available
        workflow = context.get('workflow_instance')
        if workflow:
            payload['workflow'] = {
                'id': str(workflow.id),
                'name': workflow.name,
                'status': workflow.status,
                'progress': workflow.progress_percentage,
                'template': workflow.workflow_template.name,
                'created_at': workflow.created_at.isoformat(),
                'assigned_to': workflow.assigned_to.get_full_name() if workflow.assigned_to else None
            }
        
        # Add step data if available
        step = context.get('step_instance')
        if step:
            payload['step'] = {
                'id': str(step.id),
                'name': step.workflow_step.name,
                'status': step.status,
                'assigned_to': step.assigned_to.get_full_name() if step.assigned_to else None
            }
        
        # Add custom data from hook configuration
        if hook.config.get('custom_payload'):
            payload.update(hook.config['custom_payload'])
        
        return payload
    
    def _send_sms_notification(self, hook: IntegrationHook, context: Dict[str, Any]):
        """Send SMS notification (placeholder - integrate with SMS service)"""
        # This would integrate with services like Twilio, AWS SNS, etc.
        logger.info(f"SMS notification triggered for hook {hook.id} (not implemented)")
        
        # Example implementation with Twilio:
        # from twilio.rest import Client
        # client = Client(account_sid, auth_token)
        # message = client.messages.create(
        #     body="Your workflow notification message",
        #     from_='+1234567890',
        #     to='+0987654321'
        # )
    
    def _create_jira_ticket(self, hook: IntegrationHook, context: Dict[str, Any]):
        """Create JIRA ticket (placeholder)"""
        logger.info(f"JIRA integration triggered for hook {hook.id} (not implemented)")
        
        # Example implementation:
        # from jira import JIRA
        # jira = JIRA(server, basic_auth=(username, token))
        # issue = jira.create_issue(project='PROJ', summary='Workflow issue', ...)
    
    def _call_custom_webhook(self, hook: IntegrationHook, context: Dict[str, Any]):
        """Call custom webhook with flexible configuration"""
        config = hook.config
        url = config.get('url')
        
        if not url:
            logger.error(f"No URL configured for custom webhook hook {hook.id}")
            return
        
        payload = self._build_api_payload(hook, context)
        
        response = requests.post(
            url,
            json=payload,
            headers=config.get('headers', {}),
            timeout=hook.timeout
        )
        
        if 200 <= response.status_code < 300:
            logger.info(f"Custom webhook call successful for hook {hook.id}")
        else:
            logger.error(f"Custom webhook call failed for hook {hook.id}: {response.status_code}")
    
    def _handle_hook_failure(self, hook: IntegrationHook, context: Dict[str, Any], error: Exception):
        """Handle hook execution failure with retry logic"""
        # In production, implement retry logic with exponential backoff
        logger.error(f"Hook {hook.id} failed: {error}")
        
        # Could store failure info in database for monitoring and retry
        # Could send alert to administrators
        # Could implement circuit breaker pattern


# Global instance for workflow integration hooks
integration_hooks_manager = WorkflowIntegrationHooksManager()


# Workflow event functions that trigger hooks
def trigger_workflow_created_hooks(workflow_instance: WorkflowInstance, user: User):
    """Trigger hooks when workflow is created"""
    context = {
        'workflow_instance': workflow_instance,
        'created_by': user,
        'trigger_time': timezone.now()
    }
    integration_hooks_manager.trigger_hooks(HookTrigger.WORKFLOW_CREATED, context)


def trigger_workflow_started_hooks(workflow_instance: WorkflowInstance, user: User):
    """Trigger hooks when workflow is started"""
    context = {
        'workflow_instance': workflow_instance,
        'started_by': user,
        'trigger_time': timezone.now()
    }
    integration_hooks_manager.trigger_hooks(HookTrigger.WORKFLOW_STARTED, context)


def trigger_workflow_completed_hooks(workflow_instance: WorkflowInstance, user: User):
    """Trigger hooks when workflow is completed"""
    context = {
        'workflow_instance': workflow_instance,
        'completed_by': user,
        'completion_time': timezone.now(),
        'duration': workflow_instance.get_duration() if hasattr(workflow_instance, 'get_duration') else None
    }
    integration_hooks_manager.trigger_hooks(HookTrigger.WORKFLOW_COMPLETED, context)


def trigger_step_completed_hooks(step_instance: WorkflowStepInstance, user: User):
    """Trigger hooks when workflow step is completed"""
    context = {
        'workflow_instance': step_instance.workflow_instance,
        'step_instance': step_instance,
        'completed_by': user,
        'trigger_time': timezone.now()
    }
    integration_hooks_manager.trigger_hooks(HookTrigger.STEP_COMPLETED, context)


def trigger_quality_check_hooks(step_instance: WorkflowStepInstance, passed: bool, score: float):
    """Trigger hooks for quality check results"""
    trigger = HookTrigger.QUALITY_CHECK_PASSED if passed else HookTrigger.QUALITY_CHECK_FAILED
    context = {
        'workflow_instance': step_instance.workflow_instance,
        'step_instance': step_instance,
        'quality_passed': passed,
        'quality_score': score,
        'trigger_time': timezone.now()
    }
    integration_hooks_manager.trigger_hooks(trigger, context)


def trigger_deadline_hooks(workflow_instance: WorkflowInstance, missed: bool = False):
    """Trigger hooks for deadline events"""
    trigger = HookTrigger.DEADLINE_MISSED if missed else HookTrigger.DEADLINE_APPROACHING
    context = {
        'workflow_instance': workflow_instance,
        'deadline_missed': missed,
        'due_date': workflow_instance.due_date,
        'trigger_time': timezone.now()
    }
    integration_hooks_manager.trigger_hooks(trigger, context)