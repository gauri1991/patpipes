"""
Workflow Bulk Operations
Bulk operations for applying workflows to multiple projects or entities
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
from django.db import transaction
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.core.exceptions import ValidationError

from .models import (
    WorkflowTemplate, WorkflowInstance, WorkflowStep, WorkflowStepInstance,
    WorkflowInstanceStatus, StepStatus
)
from .services import workflow_engine
from .integrations import trigger_workflow_created_hooks
from domains.projects.models import Project, ProjectStatus

User = get_user_model()
logger = logging.getLogger(__name__)


class BulkOperationType(Enum):
    """Types of bulk operations"""
    CREATE_WORKFLOWS = 'create_workflows'
    START_WORKFLOWS = 'start_workflows'
    PAUSE_WORKFLOWS = 'pause_workflows'
    RESUME_WORKFLOWS = 'resume_workflows'
    CANCEL_WORKFLOWS = 'cancel_workflows'
    UPDATE_ASSIGNMENTS = 'update_assignments'
    UPDATE_PRIORITIES = 'update_priorities'
    UPDATE_DUE_DATES = 'update_due_dates'
    APPLY_TEMPLATE = 'apply_template'
    CLONE_WORKFLOWS = 'clone_workflows'


class BulkOperationStatus(Enum):
    """Status of bulk operation execution"""
    PENDING = 'pending'
    IN_PROGRESS = 'in_progress'
    COMPLETED = 'completed'
    FAILED = 'failed'
    PARTIAL = 'partial'


@dataclass
class BulkOperationRequest:
    """Request for a bulk operation"""
    operation_type: BulkOperationType
    target_objects: List[Any]  # Projects, WorkflowInstances, etc.
    workflow_template: Optional[WorkflowTemplate] = None
    user: Optional[User] = None
    parameters: Dict[str, Any] = field(default_factory=dict)
    options: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BulkOperationResult:
    """Result of a bulk operation"""
    operation_type: BulkOperationType
    status: BulkOperationStatus
    total_items: int
    successful_items: int
    failed_items: int
    results: List[Dict[str, Any]] = field(default_factory=list)
    errors: List[Dict[str, Any]] = field(default_factory=list)
    execution_time: float = 0.0
    metadata: Dict[str, Any] = field(default_factory=dict)


class WorkflowBulkOperationsManager:
    """
    Manages bulk operations for workflows
    Handles batch creation, updates, and management of workflows
    """
    
    def execute_bulk_operation(
        self, 
        request: BulkOperationRequest
    ) -> BulkOperationResult:
        """Execute a bulk operation based on request type"""
        
        start_time = timezone.now()
        
        handlers = {
            BulkOperationType.CREATE_WORKFLOWS: self._bulk_create_workflows,
            BulkOperationType.START_WORKFLOWS: self._bulk_start_workflows,
            BulkOperationType.PAUSE_WORKFLOWS: self._bulk_pause_workflows,
            BulkOperationType.RESUME_WORKFLOWS: self._bulk_resume_workflows,
            BulkOperationType.CANCEL_WORKFLOWS: self._bulk_cancel_workflows,
            BulkOperationType.UPDATE_ASSIGNMENTS: self._bulk_update_assignments,
            BulkOperationType.UPDATE_PRIORITIES: self._bulk_update_priorities,
            BulkOperationType.UPDATE_DUE_DATES: self._bulk_update_due_dates,
            BulkOperationType.APPLY_TEMPLATE: self._bulk_apply_template,
            BulkOperationType.CLONE_WORKFLOWS: self._bulk_clone_workflows,
        }
        
        handler = handlers.get(request.operation_type)
        if not handler:
            raise ValueError(f"Unknown operation type: {request.operation_type}")
        
        # Execute the operation
        result = handler(request)
        
        # Calculate execution time
        end_time = timezone.now()
        result.execution_time = (end_time - start_time).total_seconds()
        
        # Determine overall status
        if result.failed_items == 0:
            result.status = BulkOperationStatus.COMPLETED
        elif result.successful_items == 0:
            result.status = BulkOperationStatus.FAILED
        else:
            result.status = BulkOperationStatus.PARTIAL
        
        logger.info(
            f"Bulk operation {request.operation_type.value} completed: "
            f"{result.successful_items}/{result.total_items} successful"
        )
        
        return result
    
    def _bulk_create_workflows(self, request: BulkOperationRequest) -> BulkOperationResult:
        """Create workflows for multiple projects"""
        
        result = BulkOperationResult(
            operation_type=request.operation_type,
            status=BulkOperationStatus.IN_PROGRESS,
            total_items=len(request.target_objects),
            successful_items=0,
            failed_items=0
        )
        
        if not request.workflow_template:
            raise ValueError("Workflow template is required for bulk creation")
        
        # Options
        auto_start = request.options.get('auto_start', False)
        skip_existing = request.options.get('skip_existing', True)
        
        for target_object in request.target_objects:
            try:
                with transaction.atomic():
                    # Check if workflow already exists for this object
                    if skip_existing:
                        existing = WorkflowInstance.objects.filter(
                            workflow_template=request.workflow_template,
                            content_type=ContentType.objects.get_for_model(target_object.__class__),
                            object_id=target_object.id
                        ).exists()
                        
                        if existing:
                            result.results.append({
                                'object': str(target_object),
                                'status': 'skipped',
                                'message': 'Workflow already exists'
                            })
                            continue
                    
                    # Create workflow instance
                    workflow_instance = workflow_engine.create_workflow_instance(
                        template_id=str(request.workflow_template.id),
                        target_object=target_object,
                        user=request.user,
                        name=f"{request.workflow_template.name} - {target_object}",
                        **request.parameters
                    )
                    
                    # Auto-start if requested
                    if auto_start:
                        workflow_engine.start_workflow(workflow_instance, request.user)
                    
                    result.successful_items += 1
                    result.results.append({
                        'object': str(target_object),
                        'workflow_id': str(workflow_instance.id),
                        'status': 'created',
                        'auto_started': auto_start
                    })
                    
            except Exception as e:
                result.failed_items += 1
                result.errors.append({
                    'object': str(target_object),
                    'error': str(e)
                })
                logger.error(f"Failed to create workflow for {target_object}: {e}")
        
        return result
    
    def _bulk_start_workflows(self, request: BulkOperationRequest) -> BulkOperationResult:
        """Start multiple workflows"""
        
        result = BulkOperationResult(
            operation_type=request.operation_type,
            status=BulkOperationStatus.IN_PROGRESS,
            total_items=len(request.target_objects),
            successful_items=0,
            failed_items=0
        )
        
        for workflow in request.target_objects:
            try:
                if workflow.status != WorkflowInstanceStatus.PENDING:
                    result.results.append({
                        'workflow_id': str(workflow.id),
                        'status': 'skipped',
                        'message': f'Cannot start workflow in {workflow.status} status'
                    })
                    continue
                
                workflow_engine.start_workflow(workflow, request.user)
                
                result.successful_items += 1
                result.results.append({
                    'workflow_id': str(workflow.id),
                    'workflow_name': workflow.name,
                    'status': 'started'
                })
                
            except Exception as e:
                result.failed_items += 1
                result.errors.append({
                    'workflow_id': str(workflow.id),
                    'error': str(e)
                })
                logger.error(f"Failed to start workflow {workflow.id}: {e}")
        
        return result
    
    def _bulk_pause_workflows(self, request: BulkOperationRequest) -> BulkOperationResult:
        """Pause multiple workflows"""
        
        result = BulkOperationResult(
            operation_type=request.operation_type,
            status=BulkOperationStatus.IN_PROGRESS,
            total_items=len(request.target_objects),
            successful_items=0,
            failed_items=0
        )
        
        for workflow in request.target_objects:
            try:
                if workflow.status != WorkflowInstanceStatus.IN_PROGRESS:
                    result.results.append({
                        'workflow_id': str(workflow.id),
                        'status': 'skipped',
                        'message': f'Cannot pause workflow in {workflow.status} status'
                    })
                    continue
                
                workflow_engine.pause_workflow(workflow, request.user)
                
                result.successful_items += 1
                result.results.append({
                    'workflow_id': str(workflow.id),
                    'workflow_name': workflow.name,
                    'status': 'paused'
                })
                
            except Exception as e:
                result.failed_items += 1
                result.errors.append({
                    'workflow_id': str(workflow.id),
                    'error': str(e)
                })
                logger.error(f"Failed to pause workflow {workflow.id}: {e}")
        
        return result
    
    def _bulk_resume_workflows(self, request: BulkOperationRequest) -> BulkOperationResult:
        """Resume multiple workflows"""
        
        result = BulkOperationResult(
            operation_type=request.operation_type,
            status=BulkOperationStatus.IN_PROGRESS,
            total_items=len(request.target_objects),
            successful_items=0,
            failed_items=0
        )
        
        for workflow in request.target_objects:
            try:
                if workflow.status != WorkflowInstanceStatus.ON_HOLD:
                    result.results.append({
                        'workflow_id': str(workflow.id),
                        'status': 'skipped',
                        'message': f'Cannot resume workflow in {workflow.status} status'
                    })
                    continue
                
                workflow_engine.resume_workflow(workflow, request.user)
                
                result.successful_items += 1
                result.results.append({
                    'workflow_id': str(workflow.id),
                    'workflow_name': workflow.name,
                    'status': 'resumed'
                })
                
            except Exception as e:
                result.failed_items += 1
                result.errors.append({
                    'workflow_id': str(workflow.id),
                    'error': str(e)
                })
                logger.error(f"Failed to resume workflow {workflow.id}: {e}")
        
        return result
    
    def _bulk_cancel_workflows(self, request: BulkOperationRequest) -> BulkOperationResult:
        """Cancel multiple workflows"""
        
        result = BulkOperationResult(
            operation_type=request.operation_type,
            status=BulkOperationStatus.IN_PROGRESS,
            total_items=len(request.target_objects),
            successful_items=0,
            failed_items=0
        )
        
        for workflow in request.target_objects:
            try:
                if workflow.status in [WorkflowInstanceStatus.COMPLETED, WorkflowInstanceStatus.CANCELLED]:
                    result.results.append({
                        'workflow_id': str(workflow.id),
                        'status': 'skipped',
                        'message': f'Workflow already in {workflow.status} status'
                    })
                    continue
                
                workflow_engine.cancel_workflow(workflow, request.user)
                
                result.successful_items += 1
                result.results.append({
                    'workflow_id': str(workflow.id),
                    'workflow_name': workflow.name,
                    'status': 'cancelled'
                })
                
            except Exception as e:
                result.failed_items += 1
                result.errors.append({
                    'workflow_id': str(workflow.id),
                    'error': str(e)
                })
                logger.error(f"Failed to cancel workflow {workflow.id}: {e}")
        
        return result
    
    def _bulk_update_assignments(self, request: BulkOperationRequest) -> BulkOperationResult:
        """Update assignments for multiple workflows"""
        
        result = BulkOperationResult(
            operation_type=request.operation_type,
            status=BulkOperationStatus.IN_PROGRESS,
            total_items=len(request.target_objects),
            successful_items=0,
            failed_items=0
        )
        
        new_assignee = request.parameters.get('assignee')
        if not new_assignee:
            raise ValueError("New assignee is required for bulk assignment update")
        
        for workflow in request.target_objects:
            try:
                with transaction.atomic():
                    # Update workflow assignment
                    workflow.assigned_to = new_assignee
                    workflow.save(update_fields=['assigned_to', 'updated_at'])
                    
                    # Update unassigned steps if requested
                    if request.options.get('update_unassigned_steps', True):
                        unassigned_steps = workflow.step_instances.filter(
                            assigned_to__isnull=True,
                            status__in=[StepStatus.PENDING, StepStatus.IN_PROGRESS]
                        )
                        unassigned_steps.update(assigned_to=new_assignee)
                    
                    result.successful_items += 1
                    result.results.append({
                        'workflow_id': str(workflow.id),
                        'workflow_name': workflow.name,
                        'new_assignee': new_assignee.get_full_name(),
                        'status': 'updated'
                    })
                    
            except Exception as e:
                result.failed_items += 1
                result.errors.append({
                    'workflow_id': str(workflow.id),
                    'error': str(e)
                })
                logger.error(f"Failed to update assignment for workflow {workflow.id}: {e}")
        
        return result
    
    def _bulk_update_priorities(self, request: BulkOperationRequest) -> BulkOperationResult:
        """Update priorities for multiple workflows"""
        
        result = BulkOperationResult(
            operation_type=request.operation_type,
            status=BulkOperationStatus.IN_PROGRESS,
            total_items=len(request.target_objects),
            successful_items=0,
            failed_items=0
        )
        
        new_priority = request.parameters.get('priority')
        if not new_priority:
            raise ValueError("New priority is required for bulk priority update")
        
        for workflow in request.target_objects:
            try:
                workflow.priority = new_priority
                workflow.save(update_fields=['priority', 'updated_at'])
                
                result.successful_items += 1
                result.results.append({
                    'workflow_id': str(workflow.id),
                    'workflow_name': workflow.name,
                    'new_priority': new_priority,
                    'status': 'updated'
                })
                
            except Exception as e:
                result.failed_items += 1
                result.errors.append({
                    'workflow_id': str(workflow.id),
                    'error': str(e)
                })
                logger.error(f"Failed to update priority for workflow {workflow.id}: {e}")
        
        return result
    
    def _bulk_update_due_dates(self, request: BulkOperationRequest) -> BulkOperationResult:
        """Update due dates for multiple workflows"""
        
        result = BulkOperationResult(
            operation_type=request.operation_type,
            status=BulkOperationStatus.IN_PROGRESS,
            total_items=len(request.target_objects),
            successful_items=0,
            failed_items=0
        )
        
        new_due_date = request.parameters.get('due_date')
        extend_by_days = request.parameters.get('extend_by_days')
        
        if not new_due_date and not extend_by_days:
            raise ValueError("Either new_due_date or extend_by_days is required")
        
        for workflow in request.target_objects:
            try:
                if new_due_date:
                    workflow.due_date = new_due_date
                elif extend_by_days and workflow.due_date:
                    from datetime import timedelta
                    workflow.due_date = workflow.due_date + timedelta(days=extend_by_days)
                else:
                    result.results.append({
                        'workflow_id': str(workflow.id),
                        'status': 'skipped',
                        'message': 'No existing due date to extend'
                    })
                    continue
                
                workflow.save(update_fields=['due_date', 'updated_at'])
                
                # Update step due dates proportionally if requested
                if request.options.get('update_step_due_dates', False):
                    self._update_step_due_dates(workflow)
                
                result.successful_items += 1
                result.results.append({
                    'workflow_id': str(workflow.id),
                    'workflow_name': workflow.name,
                    'new_due_date': str(workflow.due_date),
                    'status': 'updated'
                })
                
            except Exception as e:
                result.failed_items += 1
                result.errors.append({
                    'workflow_id': str(workflow.id),
                    'error': str(e)
                })
                logger.error(f"Failed to update due date for workflow {workflow.id}: {e}")
        
        return result
    
    def _bulk_apply_template(self, request: BulkOperationRequest) -> BulkOperationResult:
        """Apply a workflow template to multiple projects"""
        
        result = BulkOperationResult(
            operation_type=request.operation_type,
            status=BulkOperationStatus.IN_PROGRESS,
            total_items=len(request.target_objects),
            successful_items=0,
            failed_items=0
        )
        
        if not request.workflow_template:
            raise ValueError("Workflow template is required")
        
        # Options
        auto_start = request.options.get('auto_start', False)
        skip_if_exists = request.options.get('skip_if_exists', True)
        
        for project in request.target_objects:
            try:
                # Check if any workflow exists for this project
                if skip_if_exists:
                    existing = WorkflowInstance.objects.filter(
                        content_type=ContentType.objects.get_for_model(Project),
                        object_id=project.id
                    ).exists()
                    
                    if existing:
                        result.results.append({
                            'project': str(project),
                            'status': 'skipped',
                            'message': 'Project already has workflows'
                        })
                        continue
                
                # Create workflow for project
                workflow = workflow_engine.create_workflow_instance(
                    template_id=str(request.workflow_template.id),
                    target_object=project,
                    user=request.user,
                    name=f"{request.workflow_template.name} - {project.name}",
                    assigned_to=project.lead_attorney or request.user,
                    organization=project.organization,
                    due_date=project.target_date,
                    priority=self._map_project_priority(project.priority),
                    tags=project.tags.copy() if project.tags else []
                )
                
                # Auto-start if requested
                if auto_start:
                    workflow_engine.start_workflow(workflow, request.user)
                
                result.successful_items += 1
                result.results.append({
                    'project': str(project),
                    'workflow_id': str(workflow.id),
                    'status': 'applied',
                    'auto_started': auto_start
                })
                
            except Exception as e:
                result.failed_items += 1
                result.errors.append({
                    'project': str(project),
                    'error': str(e)
                })
                logger.error(f"Failed to apply template to project {project.id}: {e}")
        
        return result
    
    def _bulk_clone_workflows(self, request: BulkOperationRequest) -> BulkOperationResult:
        """Clone multiple workflows"""
        
        result = BulkOperationResult(
            operation_type=request.operation_type,
            status=BulkOperationStatus.IN_PROGRESS,
            total_items=len(request.target_objects),
            successful_items=0,
            failed_items=0
        )
        
        clone_suffix = request.options.get('clone_suffix', ' (Copy)')
        
        for workflow in request.target_objects:
            try:
                with transaction.atomic():
                    # Clone the workflow instance
                    cloned_workflow = WorkflowInstance.objects.create(
                        workflow_template=workflow.workflow_template,
                        name=workflow.name + clone_suffix,
                        content_object=workflow.content_object,
                        status=WorkflowInstanceStatus.PENDING,
                        created_by=request.user,
                        assigned_to=workflow.assigned_to,
                        organization=workflow.organization,
                        due_date=workflow.due_date,
                        priority=workflow.priority,
                        configuration_overrides=workflow.configuration_overrides.copy(),
                        tags=workflow.tags.copy() if workflow.tags else [],
                        notes=f"Cloned from workflow {workflow.id}"
                    )
                    
                    # Clone step instances
                    for step_instance in workflow.step_instances.all():
                        WorkflowStepInstance.objects.create(
                            workflow_instance=cloned_workflow,
                            workflow_step=step_instance.workflow_step,
                            status=StepStatus.PENDING,
                            assigned_to=step_instance.assigned_to,
                            due_date=step_instance.due_date,
                            step_configuration=step_instance.step_configuration.copy(),
                            created_by=request.user
                        )
                    
                    result.successful_items += 1
                    result.results.append({
                        'original_workflow_id': str(workflow.id),
                        'cloned_workflow_id': str(cloned_workflow.id),
                        'cloned_workflow_name': cloned_workflow.name,
                        'status': 'cloned'
                    })
                    
            except Exception as e:
                result.failed_items += 1
                result.errors.append({
                    'workflow_id': str(workflow.id),
                    'error': str(e)
                })
                logger.error(f"Failed to clone workflow {workflow.id}: {e}")
        
        return result
    
    def _update_step_due_dates(self, workflow: WorkflowInstance):
        """Update step due dates proportionally when workflow due date changes"""
        
        if not workflow.due_date:
            return
        
        # Calculate time remaining
        now = timezone.now().date()
        days_remaining = (workflow.due_date - now).days
        
        # Get incomplete steps
        incomplete_steps = workflow.step_instances.filter(
            status__in=[StepStatus.PENDING, StepStatus.IN_PROGRESS]
        ).order_by('workflow_step__order')
        
        if not incomplete_steps:
            return
        
        # Distribute remaining time among steps
        from datetime import timedelta
        days_per_step = max(1, days_remaining // len(incomplete_steps))
        
        current_date = now
        for step in incomplete_steps:
            current_date += timedelta(days=days_per_step)
            step.due_date = min(current_date, workflow.due_date)
            step.save(update_fields=['due_date'])
    
    def _map_project_priority(self, project_priority: str) -> str:
        """Map project priority to workflow priority"""
        mapping = {
            'low': 'low',
            'medium': 'medium', 
            'high': 'high',
            'urgent': 'urgent'
        }
        return mapping.get(project_priority, 'medium')


# Global instance for bulk operations
bulk_operations_manager = WorkflowBulkOperationsManager()


# Convenience functions for common bulk operations

def bulk_create_workflows_for_projects(
    projects: List[Project],
    template: WorkflowTemplate,
    user: User,
    auto_start: bool = False,
    **kwargs
) -> BulkOperationResult:
    """Create workflows for multiple projects"""
    
    request = BulkOperationRequest(
        operation_type=BulkOperationType.CREATE_WORKFLOWS,
        target_objects=projects,
        workflow_template=template,
        user=user,
        parameters=kwargs,
        options={'auto_start': auto_start}
    )
    
    return bulk_operations_manager.execute_bulk_operation(request)


def bulk_start_workflows(
    workflows: List[WorkflowInstance],
    user: User
) -> BulkOperationResult:
    """Start multiple workflows"""
    
    request = BulkOperationRequest(
        operation_type=BulkOperationType.START_WORKFLOWS,
        target_objects=workflows,
        user=user
    )
    
    return bulk_operations_manager.execute_bulk_operation(request)


def bulk_update_workflow_assignments(
    workflows: List[WorkflowInstance],
    new_assignee: User,
    user: User,
    update_unassigned_steps: bool = True
) -> BulkOperationResult:
    """Update assignments for multiple workflows"""
    
    request = BulkOperationRequest(
        operation_type=BulkOperationType.UPDATE_ASSIGNMENTS,
        target_objects=workflows,
        user=user,
        parameters={'assignee': new_assignee},
        options={'update_unassigned_steps': update_unassigned_steps}
    )
    
    return bulk_operations_manager.execute_bulk_operation(request)


def bulk_apply_template_to_projects(
    projects: List[Project],
    template: WorkflowTemplate,
    user: User,
    auto_start: bool = False,
    skip_if_exists: bool = True
) -> BulkOperationResult:
    """Apply a workflow template to multiple projects"""
    
    request = BulkOperationRequest(
        operation_type=BulkOperationType.APPLY_TEMPLATE,
        target_objects=projects,
        workflow_template=template,
        user=user,
        options={
            'auto_start': auto_start,
            'skip_if_exists': skip_if_exists
        }
    )
    
    return bulk_operations_manager.execute_bulk_operation(request)