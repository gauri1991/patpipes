"""
Workflow Engine Services
Core workflow execution engine and step handlers
"""

import logging
from typing import Dict, List, Optional, Any
from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError

from .models import (
    WorkflowInstance, WorkflowStepInstance, WorkflowTemplate, WorkflowStep,
    QualityControl, QualityCheckResult,
    WorkflowInstanceStatus, StepStatus, StepType, QualityControlType
)
from .quality import quality_engine, QualityCheckStatus
from .remediation import remediation_engine, RemediationStatus
from .dynamic import dynamic_workflow_engine
from .integrations import (
    trigger_workflow_created_hooks, trigger_workflow_started_hooks, 
    trigger_workflow_completed_hooks, trigger_step_completed_hooks,
    trigger_quality_check_hooks, trigger_deadline_hooks
)

User = get_user_model()
logger = logging.getLogger(__name__)


class WorkflowExecutionEngine:
    """
    Core workflow execution engine that manages workflow lifecycle,
    step progression, and quality control execution
    """
    
    def __init__(self):
        self.step_handlers = {
            StepType.MANUAL: ManualTaskHandler(),
            StepType.AUTOMATED: AutomatedCheckHandler(),
            StepType.APPROVAL: ApprovalHandler(),
            StepType.DOCUMENT: DocumentUploadHandler(),
            StepType.REVIEW: ReviewHandler(),
            StepType.QUALITY_GATE: QualityGateHandler(),
            StepType.NOTIFICATION: NotificationHandler(),
        }
    
    def create_workflow_instance(
        self, 
        template_id: str, 
        target_object, 
        user: User,
        name: Optional[str] = None,
        **kwargs
    ) -> WorkflowInstance:
        """Create new workflow instance from template"""
        
        try:
            template = WorkflowTemplate.objects.get(id=template_id, is_active=True)
        except WorkflowTemplate.DoesNotExist:
            raise ValidationError(f"Active workflow template {template_id} not found")
        
        with transaction.atomic():
            # Create workflow instance
            # Handle assigned_to parameter properly
            assigned_to = kwargs.get('assigned_to')
            if isinstance(assigned_to, str):
                try:
                    assigned_to = User.objects.get(id=assigned_to)
                except User.DoesNotExist:
                    assigned_to = user
            elif not assigned_to:
                assigned_to = user

            instance = WorkflowInstance.objects.create(
                workflow_template=template,
                name=name or f"{template.name} - {target_object}",
                content_object=target_object,
                created_by=user,
                assigned_to=assigned_to,
                organization=kwargs.get('organization', getattr(user, 'profile', None) and getattr(user.profile, 'organization', None)),
                due_date=kwargs.get('due_date'),
                priority=kwargs.get('priority', 'medium'),
                configuration_overrides=kwargs.get('configuration_overrides', {}),
                tags=kwargs.get('tags', []),
                template_version=template.version  # Track template version
            )
            
            # Create step instances from template
            self._create_step_instances(instance, template, user)
            
            # Update template usage count
            template.increment_usage()
            
            # Add audit entry
            instance.add_audit_entry('workflow_created', user, {
                'template_id': str(template.id),
                'template_name': template.name,
                'target_object': str(target_object)
            })
            
            # Trigger integration hooks for workflow creation
            trigger_workflow_created_hooks(instance, user)
            
            logger.info(f"Created workflow instance {instance.id} from template {template.name}")
            return instance
            
    def _create_step_instances(
        self, 
        workflow_instance: WorkflowInstance, 
        template: WorkflowTemplate,
        user: User
    ):
        """Create step instances from template steps"""
        
        template_steps = template.steps.all().order_by('order')
        
        for step in template_steps:
            # Calculate due date based on step timing
            due_date = None
            if workflow_instance.start_date and step.estimated_duration:
                # Add estimated duration to current step's expected start
                days_offset = sum(
                    s.estimated_duration or 0 
                    for s in template_steps.filter(order__lt=step.order)
                )
                due_date = workflow_instance.start_date + timezone.timedelta(
                    days=days_offset + (step.estimated_duration or 0)
                )
            
            # Determine assignee
            assigned_to = step.assigned_user
            if not assigned_to and step.assigned_role:
                # Auto-assign based on role if enabled
                if template.auto_assign:
                    assigned_to = self._find_user_by_role(
                        step.assigned_role,
                        workflow_instance.organization
                    )
            
            WorkflowStepInstance.objects.create(
                workflow_instance=workflow_instance,
                workflow_step=step,
                assigned_to=assigned_to,
                due_date=due_date,
                step_configuration=step.configuration.copy()
            )
    
    def _find_user_by_role(self, role: str, organization) -> Optional[User]:
        """Find available user with specified role"""
        # This is a simplified implementation
        # In real scenario, you'd have more sophisticated assignment logic
        users = User.objects.filter(role=role)
        if organization:
            users = users.filter(profile__organization=organization)
        return users.first()
    
    def start_workflow(self, workflow_instance: WorkflowInstance, user: User) -> bool:
        """Start workflow execution"""
        
        if workflow_instance.status != WorkflowInstanceStatus.PENDING:
            raise ValidationError(f"Cannot start workflow in {workflow_instance.status} status")
        
        with transaction.atomic():
            workflow_instance.start(user)
            
            # Start initial steps
            initial_steps = self._get_ready_steps(workflow_instance)
            for step_instance in initial_steps:
                self._start_step(step_instance, user)
            
            # Trigger integration hooks for workflow started
            trigger_workflow_started_hooks(workflow_instance, user)
            
            logger.info(f"Started workflow {workflow_instance.id} with {len(initial_steps)} initial steps")
            return True
    
    def _get_ready_steps(self, workflow_instance: WorkflowInstance) -> List[WorkflowStepInstance]:
        """Get steps that are ready to start (dependencies satisfied)"""
        
        pending_steps = workflow_instance.step_instances.filter(
            status=StepStatus.PENDING
        ).select_related('workflow_step')
        
        ready_steps = []
        
        for step_instance in pending_steps:
            if self._are_dependencies_satisfied(step_instance):
                # Check if sequential requirement allows this step
                if self._can_start_step(step_instance):
                    ready_steps.append(step_instance)
        
        return ready_steps
    
    def _are_dependencies_satisfied(self, step_instance: WorkflowStepInstance) -> bool:
        """Check if step dependencies are satisfied"""
        
        step = step_instance.workflow_step
        dependencies = step.depends_on.all()
        
        if not dependencies:
            return True
        
        # Check if all dependent steps are completed
        for dep_step in dependencies:
            dep_instance = step_instance.workflow_instance.step_instances.filter(
                workflow_step=dep_step
            ).first()
            
            if not dep_instance or dep_instance.status != StepStatus.COMPLETED:
                return False
        
        return True
    
    def _can_start_step(self, step_instance: WorkflowStepInstance) -> bool:
        """Check if step can start based on workflow configuration"""
        
        workflow = step_instance.workflow_instance
        template = workflow.workflow_template
        
        # If sequential execution required
        if template.require_sequential and not step_instance.workflow_step.is_parallel:
            # Check if previous step is completed
            current_order = step_instance.workflow_step.order
            if current_order > 1:
                prev_step = workflow.step_instances.filter(
                    workflow_step__order=current_order - 1
                ).first()
                
                if prev_step and prev_step.status != StepStatus.COMPLETED:
                    return False
        
        return True
    
    def _start_step(self, step_instance: WorkflowStepInstance, user: User):
        """Start individual step execution"""
        
        step_type = step_instance.workflow_step.step_type
        handler = self.step_handlers.get(step_type)
        
        if not handler:
            logger.error(f"No handler found for step type {step_type}")
            return
        
        try:
            step_instance.start(user)
            handler.start_step(step_instance, user)
            
            logger.info(f"Started step {step_instance.id} ({step_type})")
            
        except Exception as e:
            logger.error(f"Failed to start step {step_instance.id}: {e}")
            step_instance.status = StepStatus.FAILED
            step_instance.notes = f"Failed to start: {str(e)}"
            step_instance.save()
    
    def complete_step(
        self, 
        step_instance: WorkflowStepInstance, 
        user: User,
        output_data: Optional[Dict] = None,
        quality_score: Optional[int] = None
    ) -> bool:
        """Complete step execution with quality checks"""
        
        if step_instance.status not in [StepStatus.IN_PROGRESS, StepStatus.WAITING_APPROVAL]:
            raise ValidationError(f"Cannot complete step in {step_instance.status} status")
        
        with transaction.atomic():
            # Run quality controls
            quality_passed = self._run_quality_controls(step_instance, user)
            
            # Check if quality controls block completion
            if not quality_passed:
                blocking_controls = QualityControl.objects.filter(
                    workflow_step=step_instance.workflow_step,
                    is_blocking=True
                ).exists()
                
                if blocking_controls:
                    step_instance.status = StepStatus.FAILED
                    step_instance.notes = "Failed quality controls"
                    step_instance.save()
                    return False
            
            # Complete the step
            step_instance.complete(user, quality_score, output_data)
            
            # Trigger integration hooks for step completion
            trigger_step_completed_hooks(step_instance, user)
            
            # Execute dynamic workflow logic
            dynamic_result = self._execute_dynamic_logic(step_instance, user)
            if dynamic_result.get('branches_executed', 0) > 0:
                logger.info(f"Dynamic workflow logic executed: {dynamic_result}")
            
            # Progress workflow to next steps
            self._progress_workflow(step_instance.workflow_instance, user)
            
            return True
    
    def _run_quality_controls(self, step_instance: WorkflowStepInstance, user: User) -> bool:
        """Run quality controls for step using advanced quality engine"""
        
        quality_controls = QualityControl.objects.filter(
            workflow_step=step_instance.workflow_step,
            is_required=True
        )
        
        all_passed = True
        
        for qc in quality_controls:
            result = self._execute_quality_control(qc, step_instance, user)
            
            # Trigger integration hooks for quality check results
            trigger_quality_check_hooks(step_instance, result.passed, result.score)
            
            if not result.passed:
                all_passed = False
                
                # Execute remediation if quality control failed
                self._handle_quality_failure(qc, step_instance, result, user)
        
        return all_passed
    
    def _execute_quality_control(
        self, 
        quality_control: QualityControl, 
        step_instance: WorkflowStepInstance,
        user: User
    ) -> QualityCheckResult:
        """Execute individual quality control check using advanced quality engine"""
        
        try:
            # Use advanced quality engine for validation
            quality_report = quality_engine.execute_quality_control(
                quality_control, step_instance, user
            )
            
            # Create QualityCheckResult from report
            check_result = QualityCheckResult.objects.create(
                quality_control=quality_control,
                step_instance=step_instance,
                passed=quality_report.passed,
                score=quality_report.score,
                details={
                    'status': quality_report.status.value,
                    'execution_time': quality_report.execution_time,
                    'issues_found': len(quality_report.issues),
                    'critical_issues': len(quality_report.critical_issues),
                    'error_issues': len(quality_report.error_issues),
                    'issues': [
                        {
                            'rule_id': issue.rule_id,
                            'severity': issue.severity.value,
                            'message': issue.message,
                            'suggestion': issue.suggestion
                        }
                        for issue in quality_report.issues
                    ],
                    'metadata': quality_report.metadata
                },
                reviewer=user,
                requires_remediation=not quality_report.passed and quality_control.is_blocking
            )
            
            # Store the full report for remediation
            check_result._quality_report = quality_report
            
            logger.info(
                f"Quality control {quality_control.name} "
                f"{'PASSED' if quality_report.passed else 'FAILED'} "
                f"(Score: {quality_report.score}/{quality_report.max_score}, "
                f"Issues: {len(quality_report.issues)})"
            )
            
            return check_result
            
        except Exception as e:
            logger.error(f"Error executing quality control {quality_control.name}: {e}")
            
            # Create failed result
            return QualityCheckResult.objects.create(
                quality_control=quality_control,
                step_instance=step_instance,
                passed=False,
                score=0,
                details={'error': str(e)},
                reviewer=user,
                requires_remediation=quality_control.is_blocking
            )
    
    def _handle_quality_failure(
        self,
        quality_control: QualityControl,
        step_instance: WorkflowStepInstance,
        check_result: QualityCheckResult,
        user: User
    ):
        """Handle quality control failure with remediation"""
        
        try:
            # Get the quality report from the check result
            quality_report = getattr(check_result, '_quality_report', None)
            
            if quality_report:
                # Create remediation plan
                remediation_plan = remediation_engine.create_remediation_plan(
                    quality_report, quality_control, step_instance
                )
                
                # Execute automatic remediation actions
                auto_actions = [action for action in remediation_plan.actions if action.auto_execute]
                if auto_actions:
                    remediation_plan.actions = auto_actions
                    remediation_result = remediation_engine.execute_remediation_plan(
                        remediation_plan, user
                    )
                    
                    logger.info(
                        f"Executed {len(auto_actions)} automatic remediation actions "
                        f"for quality failure: {remediation_result['success']}"
                    )
                    
                    # Store remediation results in step notes
                    step_instance.notes += f"\n[QUALITY REMEDIATION] {remediation_result}"
                    step_instance.save()
                
        except Exception as e:
            logger.error(f"Error handling quality failure: {e}")
    
    def _execute_dynamic_logic(self, step_instance: WorkflowStepInstance, user: User) -> Dict[str, Any]:
        """Execute dynamic workflow logic for completed step"""
        
        try:
            # Check if step has dynamic configuration
            dynamic_config = step_instance.workflow_step.configuration.get('dynamic')
            if not dynamic_config:
                return {'branches_evaluated': 0, 'branches_executed': 0}
            
            # Execute dynamic logic
            return dynamic_workflow_engine.execute_dynamic_logic(
                workflow_instance=step_instance.workflow_instance,
                step_instance=step_instance,
                user=user
            )
            
        except Exception as e:
            logger.error(f"Error executing dynamic workflow logic: {e}")
            return {'error': str(e), 'branches_evaluated': 0, 'branches_executed': 0}
    
    def _progress_workflow(self, workflow_instance: WorkflowInstance, user: User):
        """Progress workflow to next available steps"""
        
        # Update workflow progress
        workflow_instance.update_progress()
        
        # Check if workflow is complete
        if self._is_workflow_complete(workflow_instance):
            workflow_instance.complete(user)
            # Trigger integration hooks for workflow completion
            trigger_workflow_completed_hooks(workflow_instance, user)
            return
        
        # Start next available steps
        ready_steps = self._get_ready_steps(workflow_instance)
        for step_instance in ready_steps:
            self._start_step(step_instance, user)
    
    def _is_workflow_complete(self, workflow_instance: WorkflowInstance) -> bool:
        """Check if workflow is complete"""
        
        required_steps = workflow_instance.step_instances.filter(
            workflow_step__is_required=True
        )
        
        completed_required = required_steps.filter(
            status=StepStatus.COMPLETED
        ).count()
        
        return completed_required == required_steps.count()
    
    def pause_workflow(self, workflow_instance: WorkflowInstance, user: User):
        """Pause workflow execution"""
        
        workflow_instance.status = WorkflowInstanceStatus.ON_HOLD
        workflow_instance.save()
        workflow_instance.add_audit_entry('workflow_paused', user)
        
        # Pause in-progress steps
        in_progress_steps = workflow_instance.step_instances.filter(
            status=StepStatus.IN_PROGRESS
        )
        
        for step in in_progress_steps:
            step.status = StepStatus.PENDING
            step.save()
    
    def resume_workflow(self, workflow_instance: WorkflowInstance, user: User):
        """Resume paused workflow"""
        
        workflow_instance.status = WorkflowInstanceStatus.IN_PROGRESS
        workflow_instance.save()
        workflow_instance.add_audit_entry('workflow_resumed', user)
        
        # Restart ready steps
        ready_steps = self._get_ready_steps(workflow_instance)
        for step_instance in ready_steps:
            self._start_step(step_instance, user)


class BaseStepHandler:
    """Base class for step type handlers"""
    
    def start_step(self, step_instance: WorkflowStepInstance, user: User):
        """Start step execution - override in subclasses"""
        pass
    
    def can_complete(self, step_instance: WorkflowStepInstance, user: User) -> bool:
        """Check if step can be completed - override in subclasses"""
        return True
    
    def get_completion_data(self, step_instance: WorkflowStepInstance) -> Dict:
        """Get data required for step completion"""
        return {}


class ManualTaskHandler(BaseStepHandler):
    """Handler for manual tasks"""
    
    def start_step(self, step_instance: WorkflowStepInstance, user: User):
        """Manual tasks are ready for user to work on"""
        # No automatic actions needed - user will manually work on the task
        pass
    
    def can_complete(self, step_instance: WorkflowStepInstance, user: User) -> bool:
        """Manual tasks can be completed by assigned user"""
        return step_instance.assigned_to == user or user.is_staff


class AutomatedCheckHandler(BaseStepHandler):
    """Handler for automated checks"""
    
    def start_step(self, step_instance: WorkflowStepInstance, user: User):
        """Execute automated check immediately"""
        
        try:
            # Get check configuration
            config = step_instance.step_configuration
            check_type = config.get('check_type', 'default')
            
            # Execute check based on type
            result = self._execute_automated_check(step_instance, check_type)
            
            # Complete step with result
            step_instance.complete(
                user=None,  # System completion
                output_data=result,
                quality_score=result.get('score', 100)
            )
            
        except Exception as e:
            step_instance.status = StepStatus.FAILED
            step_instance.notes = f"Automated check failed: {str(e)}"
            step_instance.save()
    
    def _execute_automated_check(self, step_instance: WorkflowStepInstance, check_type: str) -> Dict:
        """Execute specific automated check"""
        
        # This is where you'd implement specific automated checks
        # For now, return a simple success result
        return {
            'check_type': check_type,
            'status': 'passed',
            'score': 95,
            'details': f"Automated {check_type} check passed",
            'timestamp': timezone.now().isoformat()
        }


class ApprovalHandler(BaseStepHandler):
    """Handler for approval steps"""
    
    def start_step(self, step_instance: WorkflowStepInstance, user: User):
        """Set step to waiting approval"""
        step_instance.status = StepStatus.WAITING_APPROVAL
        step_instance.save()
        
        # TODO: Send notification to approvers
        approver_roles = step_instance.workflow_step.approver_roles
        logger.info(f"Approval required from roles: {approver_roles}")
    
    def can_complete(self, step_instance: WorkflowStepInstance, user: User) -> bool:
        """Check if user can approve"""
        approver_roles = step_instance.workflow_step.approver_roles
        return user.role in approver_roles or user.is_staff


class DocumentUploadHandler(BaseStepHandler):
    """Handler for document upload steps"""
    
    def start_step(self, step_instance: WorkflowStepInstance, user: User):
        """Document upload steps wait for user to upload files"""
        pass
    
    def can_complete(self, step_instance: WorkflowStepInstance, user: User) -> bool:
        """Check if required documents are uploaded"""
        # TODO: Check if required documents are present
        return True


class ReviewHandler(BaseStepHandler):
    """Handler for review steps"""
    
    def start_step(self, step_instance: WorkflowStepInstance, user: User):
        """Review steps are ready for reviewer"""
        pass
    
    def can_complete(self, step_instance: WorkflowStepInstance, user: User) -> bool:
        """Check if user can review"""
        return step_instance.assigned_to == user or user.is_staff


class QualityGateHandler(BaseStepHandler):
    """Handler for quality gate steps"""
    
    def start_step(self, step_instance: WorkflowStepInstance, user: User):
        """Execute quality gate checks"""
        
        # Quality gates run all associated quality controls
        step_instance.status = StepStatus.WAITING_APPROVAL
        step_instance.save()
        
        # TODO: Execute quality controls automatically
        logger.info(f"Quality gate {step_instance.workflow_step.name} started")
    
    def can_complete(self, step_instance: WorkflowStepInstance, user: User) -> bool:
        """Quality gates require specific roles to approve"""
        approver_roles = step_instance.workflow_step.approver_roles
        return user.role in approver_roles or user.is_staff


class NotificationHandler(BaseStepHandler):
    """Handler for notification steps"""
    
    def start_step(self, step_instance: WorkflowStepInstance, user: User):
        """Send notification and complete immediately"""
        
        try:
            # Send notification based on configuration
            config = step_instance.step_configuration
            notification_type = config.get('type', 'email')
            recipients = config.get('recipients', [])
            message = config.get('message', 'Workflow notification')
            
            # TODO: Implement actual notification sending
            logger.info(f"Sending {notification_type} notification to {recipients}: {message}")
            
            # Complete immediately
            step_instance.complete(
                user=None,  # System completion
                output_data={'notification_sent': True, 'recipients': recipients}
            )
            
        except Exception as e:
            step_instance.status = StepStatus.FAILED
            step_instance.notes = f"Notification failed: {str(e)}"
            step_instance.save()


class QualityControlHandler:
    """Handler for quality control execution"""
    
    def __init__(self, control_type: str):
        self.control_type = control_type
    
    def execute_check(
        self, 
        quality_control: QualityControl,
        step_instance: WorkflowStepInstance,
        user: User
    ) -> Dict:
        """Execute quality control check"""
        
        if self.control_type == QualityControlType.AUTOMATED:
            return self._execute_automated_check(quality_control, step_instance)
        elif self.control_type == QualityControlType.MANUAL:
            return self._execute_manual_check(quality_control, step_instance, user)
        elif self.control_type == QualityControlType.CHECKLIST:
            return self._execute_checklist_check(quality_control, step_instance)
        else:
            return self._execute_default_check(quality_control, step_instance)
    
    def _execute_automated_check(self, qc: QualityControl, step_instance: WorkflowStepInstance) -> Dict:
        """Execute automated quality check"""
        
        criteria = qc.criteria
        score = 85  # Default score for now
        
        # TODO: Implement actual automated checks based on criteria
        passed = score >= qc.passing_score
        
        return {
            'passed': passed,
            'score': score,
            'details': {
                'check_type': 'automated',
                'criteria_checked': list(criteria.keys()) if criteria else [],
                'timestamp': timezone.now().isoformat()
            }
        }
    
    def _execute_manual_check(self, qc: QualityControl, step_instance: WorkflowStepInstance, user: User) -> Dict:
        """Execute manual quality check"""
        
        # Manual checks require human review - return pending status
        score = 0  # Will be updated by reviewer
        
        return {
            'passed': False,  # Requires manual review
            'score': score,
            'details': {
                'check_type': 'manual',
                'status': 'pending_review',
                'reviewer_required': True,
                'timestamp': timezone.now().isoformat()
            }
        }
    
    def _execute_checklist_check(self, qc: QualityControl, step_instance: WorkflowStepInstance) -> Dict:
        """Execute checklist validation"""
        
        criteria = qc.criteria
        if not criteria:
            return {'passed': True, 'score': 100, 'details': {'items_checked': []}}
        
        # For now, assume all checklist items need manual verification
        score = 0
        
        return {
            'passed': False,
            'score': score,
            'details': {
                'check_type': 'checklist',
                'items': list(criteria.keys()) if criteria else [],
                'status': 'pending_verification',
                'timestamp': timezone.now().isoformat()
            }
        }
    
    def _execute_default_check(self, qc: QualityControl, step_instance: WorkflowStepInstance) -> Dict:
        """Default quality check implementation"""
        
        return {
            'passed': True,
            'score': qc.passing_score,
            'details': {
                'check_type': 'default',
                'message': 'Default quality check passed',
                'timestamp': timezone.now().isoformat()
            }
        }


# Global workflow engine instance
workflow_engine = WorkflowExecutionEngine()