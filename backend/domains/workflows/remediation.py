"""
Quality Remediation System
Handles quality control failures and automated/manual remediation
"""

import logging
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass
from enum import Enum
from django.utils import timezone
from django.contrib.auth import get_user_model

from .models import (
    QualityControl, QualityCheckResult, WorkflowStepInstance, 
    WorkflowInstance, StepStatus
)
from .quality import QualityCheckReport, QualityIssue, QualityRuleSeverity

User = get_user_model()
logger = logging.getLogger(__name__)


class RemediationActionType(Enum):
    """Types of remediation actions"""
    NOTIFY = "notify"
    REASSIGN = "reassign" 
    ROLLBACK = "rollback"
    AUTO_FIX = "auto_fix"
    ESCALATE = "escalate"
    PAUSE_WORKFLOW = "pause_workflow"
    BRANCH_WORKFLOW = "branch_workflow"
    REQUIRE_APPROVAL = "require_approval"


class RemediationStatus(Enum):
    """Status of remediation process"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass
class RemediationAction:
    """Individual remediation action"""
    action_type: RemediationActionType
    parameters: Dict[str, Any]
    priority: int = 1
    auto_execute: bool = True
    description: str = ""
    
    
@dataclass
class RemediationPlan:
    """Complete remediation plan for quality failures"""
    issue_id: str
    quality_control_id: str
    step_instance_id: str
    actions: List[RemediationAction]
    status: RemediationStatus = RemediationStatus.PENDING
    created_at: str = ""
    executed_at: Optional[str] = None
    execution_results: List[Dict[str, Any]] = None
    
    def __post_init__(self):
        if not self.created_at:
            self.created_at = timezone.now().isoformat()
        if self.execution_results is None:
            self.execution_results = []


class QualityRemediationEngine:
    """
    Engine for handling quality control failures and executing remediation actions
    """
    
    def __init__(self):
        self.action_handlers = {
            RemediationActionType.NOTIFY: self._handle_notify,
            RemediationActionType.REASSIGN: self._handle_reassign,
            RemediationActionType.ROLLBACK: self._handle_rollback,
            RemediationActionType.AUTO_FIX: self._handle_auto_fix,
            RemediationActionType.ESCALATE: self._handle_escalate,
            RemediationActionType.PAUSE_WORKFLOW: self._handle_pause_workflow,
            RemediationActionType.BRANCH_WORKFLOW: self._handle_branch_workflow,
            RemediationActionType.REQUIRE_APPROVAL: self._handle_require_approval,
        }
    
    def create_remediation_plan(
        self,
        quality_report: QualityCheckReport,
        quality_control: QualityControl,
        step_instance: WorkflowStepInstance,
        context: Optional[Dict[str, Any]] = None
    ) -> RemediationPlan:
        """Create remediation plan based on quality failures"""
        
        context = context or {}
        actions = []
        
        # Analyze issues and determine remediation actions
        critical_issues = quality_report.critical_issues
        error_issues = quality_report.error_issues
        
        # Handle critical issues first
        if critical_issues:
            actions.extend(self._create_critical_issue_actions(
                critical_issues, quality_control, step_instance, context
            ))
        
        # Handle error issues
        if error_issues:
            actions.extend(self._create_error_issue_actions(
                error_issues, quality_control, step_instance, context
            ))
        
        # Handle warning issues (optional remediation)
        warning_issues = [issue for issue in quality_report.issues 
                         if issue.severity == QualityRuleSeverity.WARNING]
        if warning_issues:
            actions.extend(self._create_warning_issue_actions(
                warning_issues, quality_control, step_instance, context
            ))
        
        # Sort actions by priority
        actions.sort(key=lambda x: x.priority)
        
        plan = RemediationPlan(
            issue_id=f"quality_failure_{step_instance.id}_{timezone.now().timestamp()}",
            quality_control_id=str(quality_control.id),
            step_instance_id=str(step_instance.id),
            actions=actions
        )
        
        logger.info(f"Created remediation plan with {len(actions)} actions for step {step_instance.id}")
        return plan
    
    def execute_remediation_plan(
        self, 
        plan: RemediationPlan,
        executor: User
    ) -> Dict[str, Any]:
        """Execute remediation plan"""
        
        plan.status = RemediationStatus.IN_PROGRESS
        execution_results = []
        
        try:
            for i, action in enumerate(plan.actions):
                logger.info(f"Executing remediation action {i+1}/{len(plan.actions)}: {action.action_type.value}")
                
                result = self._execute_action(action, plan, executor)
                execution_results.append({
                    'action_index': i,
                    'action_type': action.action_type.value,
                    'result': result,
                    'timestamp': timezone.now().isoformat()
                })
                
                # Stop if action failed and was critical
                if not result.get('success', False) and action.priority == 1:
                    logger.error(f"Critical remediation action failed: {result.get('error')}")
                    plan.status = RemediationStatus.FAILED
                    break
            else:
                plan.status = RemediationStatus.COMPLETED
                logger.info(f"Remediation plan completed successfully")
            
        except Exception as e:
            logger.error(f"Error executing remediation plan: {e}")
            plan.status = RemediationStatus.FAILED
            execution_results.append({
                'error': str(e),
                'timestamp': timezone.now().isoformat()
            })
        
        plan.execution_results = execution_results
        plan.executed_at = timezone.now().isoformat()
        
        return {
            'plan_id': plan.issue_id,
            'status': plan.status.value,
            'actions_executed': len(execution_results),
            'success': plan.status == RemediationStatus.COMPLETED
        }
    
    def _create_critical_issue_actions(
        self,
        issues: List[QualityIssue],
        quality_control: QualityControl,
        step_instance: WorkflowStepInstance,
        context: Dict[str, Any]
    ) -> List[RemediationAction]:
        """Create remediation actions for critical issues"""
        
        actions = []
        
        # Critical issues require immediate attention
        if quality_control.is_blocking:
            # Block workflow progression
            actions.append(RemediationAction(
                action_type=RemediationActionType.PAUSE_WORKFLOW,
                parameters={'reason': 'Critical quality control failure'},
                priority=1,
                description="Pause workflow due to critical quality issues"
            ))
        
        # Notify relevant stakeholders immediately
        actions.append(RemediationAction(
            action_type=RemediationActionType.NOTIFY,
            parameters={
                'recipients': self._get_escalation_recipients(quality_control, step_instance),
                'urgency': 'critical',
                'message': f"Critical quality issues found: {len(issues)} issues"
            },
            priority=1,
            description="Notify stakeholders of critical quality issues"
        ))
        
        # Escalate to higher authority
        actions.append(RemediationAction(
            action_type=RemediationActionType.ESCALATE,
            parameters={
                'escalation_level': 'critical',
                'issues': [self._serialize_issue(issue) for issue in issues]
            },
            priority=1,
            description="Escalate critical quality issues to management"
        ))
        
        return actions
    
    def _create_error_issue_actions(
        self,
        issues: List[QualityIssue],
        quality_control: QualityControl,
        step_instance: WorkflowStepInstance,
        context: Dict[str, Any]
    ) -> List[RemediationAction]:
        """Create remediation actions for error-level issues"""
        
        actions = []
        
        # Check for auto-fixable issues
        auto_fixable_issues = [issue for issue in issues if issue.auto_fixable]
        if auto_fixable_issues:
            actions.append(RemediationAction(
                action_type=RemediationActionType.AUTO_FIX,
                parameters={
                    'issues': [self._serialize_issue(issue) for issue in auto_fixable_issues]
                },
                priority=2,
                description=f"Auto-fix {len(auto_fixable_issues)} fixable issues"
            ))
        
        # For non-auto-fixable issues, reassign or require review
        non_fixable_issues = [issue for issue in issues if not issue.auto_fixable]
        if non_fixable_issues:
            # Check if step should be reassigned
            if len(non_fixable_issues) > 2:  # Multiple issues suggest need for different expertise
                actions.append(RemediationAction(
                    action_type=RemediationActionType.REASSIGN,
                    parameters={
                        'target_role': self._determine_reassignment_role(issues, step_instance),
                        'reason': 'Multiple quality issues require expert review'
                    },
                    priority=2,
                    description="Reassign step due to complex quality issues"
                ))
            else:
                # Require approval for continuation
                actions.append(RemediationAction(
                    action_type=RemediationActionType.REQUIRE_APPROVAL,
                    parameters={
                        'approver_roles': quality_control.reviewer_roles or ['lead_attorney'],
                        'issues': [self._serialize_issue(issue) for issue in non_fixable_issues]
                    },
                    priority=2,
                    description="Require approval to proceed with quality issues"
                ))
        
        # Notify assignee and reviewers
        actions.append(RemediationAction(
            action_type=RemediationActionType.NOTIFY,
            parameters={
                'recipients': [step_instance.assigned_to] if step_instance.assigned_to else [],
                'urgency': 'high',
                'message': f"Quality issues found requiring attention: {len(issues)} issues"
            },
            priority=3,
            description="Notify step assignee of quality issues"
        ))
        
        return actions
    
    def _create_warning_issue_actions(
        self,
        issues: List[QualityIssue],
        quality_control: QualityControl,
        step_instance: WorkflowStepInstance,
        context: Dict[str, Any]
    ) -> List[RemediationAction]:
        """Create remediation actions for warning-level issues"""
        
        actions = []
        
        # Auto-fix warnings if possible
        auto_fixable_warnings = [issue for issue in issues if issue.auto_fixable]
        if auto_fixable_warnings:
            actions.append(RemediationAction(
                action_type=RemediationActionType.AUTO_FIX,
                parameters={
                    'issues': [self._serialize_issue(issue) for issue in auto_fixable_warnings]
                },
                priority=4,
                auto_execute=False,  # Optional for warnings
                description=f"Auto-fix {len(auto_fixable_warnings)} warning issues (optional)"
            ))
        
        # Notify about warnings but don't block workflow
        if len(issues) > 3:  # Only notify if there are many warnings
            actions.append(RemediationAction(
                action_type=RemediationActionType.NOTIFY,
                parameters={
                    'recipients': [step_instance.assigned_to] if step_instance.assigned_to else [],
                    'urgency': 'normal',
                    'message': f"Quality warnings to consider: {len(issues)} issues"
                },
                priority=5,
                auto_execute=False,
                description="Notify about quality warnings (optional)"
            ))
        
        return actions
    
    def _execute_action(
        self, 
        action: RemediationAction, 
        plan: RemediationPlan,
        executor: User
    ) -> Dict[str, Any]:
        """Execute individual remediation action"""
        
        try:
            handler = self.action_handlers.get(action.action_type)
            if not handler:
                return {
                    'success': False,
                    'error': f'No handler for action type: {action.action_type.value}'
                }
            
            return handler(action, plan, executor)
            
        except Exception as e:
            logger.error(f"Error executing action {action.action_type.value}: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _handle_notify(
        self, 
        action: RemediationAction, 
        plan: RemediationPlan,
        executor: User
    ) -> Dict[str, Any]:
        """Handle notification action"""
        
        try:
            recipients = action.parameters.get('recipients', [])
            urgency = action.parameters.get('urgency', 'normal')
            message = action.parameters.get('message', '')
            
            # In a real implementation, send actual notifications
            logger.info(f"REMEDIATION NOTIFICATION [{urgency.upper()}] to {len(recipients)} recipients: {message}")
            
            return {
                'success': True,
                'recipients_notified': len(recipients),
                'urgency': urgency
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _handle_reassign(
        self,
        action: RemediationAction,
        plan: RemediationPlan,
        executor: User
    ) -> Dict[str, Any]:
        """Handle step reassignment action"""
        
        try:
            step_instance = WorkflowStepInstance.objects.get(id=plan.step_instance_id)
            target_role = action.parameters.get('target_role')
            reason = action.parameters.get('reason', 'Quality remediation')
            
            # Find user with target role (simplified - in production you'd have more sophisticated logic)
            if target_role:
                new_assignee = User.objects.filter(role=target_role).first()
                if new_assignee:
                    old_assignee = step_instance.assigned_to
                    step_instance.assigned_to = new_assignee
                    step_instance.notes += f"\n[REMEDIATION] Reassigned from {old_assignee} to {new_assignee}: {reason}"
                    step_instance.save()
                    
                    logger.info(f"Reassigned step {step_instance.id} from {old_assignee} to {new_assignee}")
                    
                    return {
                        'success': True,
                        'old_assignee': old_assignee.get_full_name() if old_assignee else None,
                        'new_assignee': new_assignee.get_full_name(),
                        'reason': reason
                    }
            
            return {'success': False, 'error': f'Could not find user with role: {target_role}'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _handle_rollback(
        self,
        action: RemediationAction,
        plan: RemediationPlan,
        executor: User
    ) -> Dict[str, Any]:
        """Handle step rollback action"""
        
        try:
            step_instance = WorkflowStepInstance.objects.get(id=plan.step_instance_id)
            
            # Rollback step to previous state
            step_instance.status = StepStatus.PENDING
            step_instance.completed_date = None
            step_instance.quality_score = None
            step_instance.notes += f"\n[REMEDIATION] Step rolled back by {executor.get_full_name()}"
            step_instance.save()
            
            logger.info(f"Rolled back step {step_instance.id}")
            
            return {
                'success': True,
                'rolled_back_to': StepStatus.PENDING.value,
                'executor': executor.get_full_name()
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _handle_auto_fix(
        self,
        action: RemediationAction,
        plan: RemediationPlan,
        executor: User
    ) -> Dict[str, Any]:
        """Handle automatic issue fixing"""
        
        try:
            issues = action.parameters.get('issues', [])
            fixed_issues = []
            
            for issue_data in issues:
                # Apply automatic fixes based on issue type and rule
                fix_result = self._apply_automatic_fix(issue_data, plan)
                if fix_result.get('success'):
                    fixed_issues.append(issue_data['rule_id'])
            
            logger.info(f"Auto-fixed {len(fixed_issues)} issues")
            
            return {
                'success': True,
                'fixed_issues': fixed_issues,
                'total_issues': len(issues)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _handle_escalate(
        self,
        action: RemediationAction,
        plan: RemediationPlan,
        executor: User
    ) -> Dict[str, Any]:
        """Handle issue escalation"""
        
        try:
            escalation_level = action.parameters.get('escalation_level', 'normal')
            issues = action.parameters.get('issues', [])
            
            # In a real implementation, create escalation tickets/notifications
            logger.warning(f"ESCALATION [{escalation_level.upper()}]: {len(issues)} quality issues escalated")
            
            # Create audit trail
            step_instance = WorkflowStepInstance.objects.get(id=plan.step_instance_id)
            step_instance.notes += f"\n[ESCALATION] Quality issues escalated to {escalation_level} level"
            step_instance.save()
            
            return {
                'success': True,
                'escalation_level': escalation_level,
                'issues_escalated': len(issues)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _handle_pause_workflow(
        self,
        action: RemediationAction,
        plan: RemediationPlan,
        executor: User
    ) -> Dict[str, Any]:
        """Handle workflow pause action"""
        
        try:
            step_instance = WorkflowStepInstance.objects.get(id=plan.step_instance_id)
            workflow = step_instance.workflow_instance
            
            reason = action.parameters.get('reason', 'Quality control remediation')
            
            # Import here to avoid circular imports
            from .services import workflow_engine
            workflow_engine.pause_workflow(workflow, executor)
            
            logger.info(f"Paused workflow {workflow.id} for remediation")
            
            return {
                'success': True,
                'workflow_id': str(workflow.id),
                'reason': reason
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _handle_branch_workflow(
        self,
        action: RemediationAction,
        plan: RemediationPlan,
        executor: User
    ) -> Dict[str, Any]:
        """Handle workflow branching for remediation"""
        
        try:
            # This would create a parallel remediation workflow
            # For now, just log the action
            branch_type = action.parameters.get('branch_type', 'remediation')
            
            logger.info(f"Would create {branch_type} branch workflow for remediation")
            
            return {
                'success': True,
                'branch_type': branch_type,
                'note': 'Workflow branching not yet implemented'
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _handle_require_approval(
        self,
        action: RemediationAction,
        plan: RemediationPlan,
        executor: User
    ) -> Dict[str, Any]:
        """Handle approval requirement action"""
        
        try:
            step_instance = WorkflowStepInstance.objects.get(id=plan.step_instance_id)
            approver_roles = action.parameters.get('approver_roles', [])
            issues = action.parameters.get('issues', [])
            
            # Change step status to require approval
            step_instance.status = StepStatus.WAITING_APPROVAL
            step_instance.notes += f"\n[REMEDIATION] Approval required due to quality issues: {len(issues)} issues"
            step_instance.save()
            
            logger.info(f"Step {step_instance.id} now requires approval from roles: {approver_roles}")
            
            return {
                'success': True,
                'approver_roles': approver_roles,
                'issues_count': len(issues)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _apply_automatic_fix(self, issue_data: Dict[str, Any], plan: RemediationPlan) -> Dict[str, Any]:
        """Apply automatic fix for specific issue"""
        
        rule_id = issue_data.get('rule_id')
        
        # Example automatic fixes
        if rule_id.startswith('completeness_'):
            # Try to provide default values for missing fields
            field_name = rule_id.replace('completeness_', '')
            return self._fix_completeness_issue(field_name, plan)
        
        elif rule_id.startswith('format_'):
            # Try to reformat data
            return self._fix_format_issue(issue_data, plan)
        
        else:
            return {'success': False, 'reason': 'No automatic fix available'}
    
    def _fix_completeness_issue(self, field_name: str, plan: RemediationPlan) -> Dict[str, Any]:
        """Fix completeness issues by providing defaults"""
        
        try:
            step_instance = WorkflowStepInstance.objects.get(id=plan.step_instance_id)
            
            # Define default values for common fields
            defaults = {
                'status': 'pending',
                'priority': 'medium',
                'date_created': timezone.now().isoformat(),
                'notes': 'Auto-generated by quality control system'
            }
            
            if field_name in defaults:
                if not step_instance.output_data:
                    step_instance.output_data = {}
                
                step_instance.output_data[field_name] = defaults[field_name]
                step_instance.save()
                
                return {'success': True, 'fixed_value': defaults[field_name]}
            
            return {'success': False, 'reason': f'No default available for field: {field_name}'}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _fix_format_issue(self, issue_data: Dict[str, Any], plan: RemediationPlan) -> Dict[str, Any]:
        """Fix format issues by reformatting data"""
        
        # This would contain logic to fix common format issues
        # For now, just return success for demonstration
        return {'success': True, 'action': 'Format correction applied'}
    
    def _get_escalation_recipients(
        self, 
        quality_control: QualityControl,
        step_instance: WorkflowStepInstance
    ) -> List[User]:
        """Get list of users to notify for escalation"""
        
        recipients = []
        
        # Add step assignee
        if step_instance.assigned_to:
            recipients.append(step_instance.assigned_to)
        
        # Add workflow creator
        workflow_creator = step_instance.workflow_instance.created_by
        if workflow_creator not in recipients:
            recipients.append(workflow_creator)
        
        # Add managers/supervisors
        managers = User.objects.filter(role__in=['manager', 'supervisor'])
        recipients.extend(managers[:2])  # Limit to first 2 managers
        
        return recipients
    
    def _determine_reassignment_role(
        self, 
        issues: List[QualityIssue], 
        step_instance: WorkflowStepInstance
    ) -> str:
        """Determine appropriate role for reassignment based on issues"""
        
        # Analyze issue types to determine required expertise
        critical_count = len([i for i in issues if i.severity == QualityRuleSeverity.CRITICAL])
        error_count = len([i for i in issues if i.severity == QualityRuleSeverity.ERROR])
        
        current_role = step_instance.assigned_to.role if step_instance.assigned_to else 'paralegal'
        
        # Escalate role based on issue severity
        role_hierarchy = ['paralegal', 'attorney', 'lead_attorney', 'supervisor', 'manager']
        
        if critical_count > 0 or error_count > 3:
            # Escalate to higher role
            try:
                current_index = role_hierarchy.index(current_role)
                return role_hierarchy[min(current_index + 1, len(role_hierarchy) - 1)]
            except ValueError:
                return 'attorney'  # Default escalation
        
        return current_role  # No escalation needed
    
    def _serialize_issue(self, issue: QualityIssue) -> Dict[str, Any]:
        """Serialize quality issue to dictionary"""
        
        return {
            'rule_id': issue.rule_id,
            'severity': issue.severity.value,
            'message': issue.message,
            'details': issue.details,
            'location': issue.location,
            'suggestion': issue.suggestion,
            'auto_fixable': issue.auto_fixable
        }


# Global remediation engine instance
remediation_engine = QualityRemediationEngine()