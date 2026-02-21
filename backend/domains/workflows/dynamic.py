"""
Dynamic Workflow System
Conditional steps, branching logic, and dynamic workflow execution
"""

import logging
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
from enum import Enum
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.exceptions import ValidationError

from .models import (
    WorkflowTemplate, WorkflowStep, WorkflowInstance, WorkflowStepInstance,
    StepStatus, WorkflowInstanceStatus
)

User = get_user_model()
logger = logging.getLogger(__name__)


class ConditionType(models.TextChoices):
    """Types of conditions for dynamic workflows"""
    DATA_VALUE = 'data_value', 'Data Value Condition'
    USER_ROLE = 'user_role', 'User Role Condition'
    TIME_BASED = 'time_based', 'Time-Based Condition'
    QUALITY_SCORE = 'quality_score', 'Quality Score Condition'
    STEP_OUTCOME = 'step_outcome', 'Step Outcome Condition'
    EXTERNAL_API = 'external_api', 'External API Condition'
    CUSTOM_FUNCTION = 'custom_function', 'Custom Function Condition'


class ConditionOperator(models.TextChoices):
    """Operators for condition evaluation"""
    EQUALS = 'eq', 'Equals'
    NOT_EQUALS = 'ne', 'Not Equals'
    GREATER_THAN = 'gt', 'Greater Than'
    GREATER_EQUAL = 'gte', 'Greater Than or Equal'
    LESS_THAN = 'lt', 'Less Than'
    LESS_EQUAL = 'lte', 'Less Than or Equal'
    CONTAINS = 'contains', 'Contains'
    IN_LIST = 'in', 'In List'
    NOT_IN_LIST = 'not_in', 'Not In List'
    REGEX_MATCH = 'regex', 'Regex Match'
    IS_NULL = 'is_null', 'Is Null'
    IS_NOT_NULL = 'is_not_null', 'Is Not Null'


class BranchAction(models.TextChoices):
    """Actions when branch conditions are met"""
    GOTO_STEP = 'goto_step', 'Go to Step'
    SKIP_STEPS = 'skip_steps', 'Skip Steps'
    CREATE_PARALLEL = 'create_parallel', 'Create Parallel Branch'
    MERGE_BRANCHES = 'merge_branches', 'Merge Branches'
    END_WORKFLOW = 'end_workflow', 'End Workflow'
    PAUSE_WORKFLOW = 'pause_workflow', 'Pause Workflow'
    ESCALATE = 'escalate', 'Escalate'
    CALL_EXTERNAL = 'call_external', 'Call External Service'


class LogicalOperator(models.TextChoices):
    """Logical operators for combining conditions"""
    AND = 'and', 'AND'
    OR = 'or', 'OR'
    NOT = 'not', 'NOT'


@dataclass
class WorkflowCondition:
    """Individual condition for workflow branching"""
    condition_type: ConditionType
    field_name: str
    operator: ConditionOperator
    expected_value: Any
    description: str = ""
    
    def evaluate(self, context: Dict[str, Any]) -> bool:
        """Evaluate condition against current context"""
        try:
            return self._evaluate_condition(context)
        except Exception as e:
            logger.error(f"Error evaluating condition {self.description}: {e}")
            return False
    
    def _evaluate_condition(self, context: Dict[str, Any]) -> bool:
        """Internal condition evaluation logic"""
        
        if self.condition_type == ConditionType.DATA_VALUE:
            return self._evaluate_data_condition(context)
        elif self.condition_type == ConditionType.USER_ROLE:
            return self._evaluate_user_role_condition(context)
        elif self.condition_type == ConditionType.TIME_BASED:
            return self._evaluate_time_condition(context)
        elif self.condition_type == ConditionType.QUALITY_SCORE:
            return self._evaluate_quality_condition(context)
        elif self.condition_type == ConditionType.STEP_OUTCOME:
            return self._evaluate_step_outcome_condition(context)
        elif self.condition_type == ConditionType.EXTERNAL_API:
            return self._evaluate_external_api_condition(context)
        elif self.condition_type == ConditionType.CUSTOM_FUNCTION:
            return self._evaluate_custom_function_condition(context)
        else:
            logger.warning(f"Unknown condition type: {self.condition_type}")
            return False
    
    def _evaluate_data_condition(self, context: Dict[str, Any]) -> bool:
        """Evaluate data value condition"""
        
        # Get value from context data
        data = context.get('data', {})
        actual_value = data.get(self.field_name)
        
        return self._apply_operator(actual_value, self.expected_value)
    
    def _evaluate_user_role_condition(self, context: Dict[str, Any]) -> bool:
        """Evaluate user role condition"""
        
        user = context.get('user')
        if not user:
            return False
        
        user_role = getattr(user, 'role', None)
        return self._apply_operator(user_role, self.expected_value)
    
    def _evaluate_time_condition(self, context: Dict[str, Any]) -> bool:
        """Evaluate time-based condition"""
        
        current_time = timezone.now()
        
        if self.field_name == 'current_hour':
            actual_value = current_time.hour
        elif self.field_name == 'current_day':
            actual_value = current_time.weekday()
        elif self.field_name == 'days_since_start':
            start_time = context.get('workflow_start_time')
            if start_time:
                actual_value = (current_time - start_time).days
            else:
                return False
        else:
            return False
        
        return self._apply_operator(actual_value, self.expected_value)
    
    def _evaluate_quality_condition(self, context: Dict[str, Any]) -> bool:
        """Evaluate quality score condition"""
        
        quality_scores = context.get('quality_scores', {})
        actual_value = quality_scores.get(self.field_name)
        
        if actual_value is None:
            return self.operator in [ConditionOperator.IS_NULL]
        
        return self._apply_operator(actual_value, self.expected_value)
    
    def _evaluate_step_outcome_condition(self, context: Dict[str, Any]) -> bool:
        """Evaluate step outcome condition"""
        
        step_outcomes = context.get('step_outcomes', {})
        actual_value = step_outcomes.get(self.field_name)
        
        return self._apply_operator(actual_value, self.expected_value)
    
    def _evaluate_external_api_condition(self, context: Dict[str, Any]) -> bool:
        """Evaluate external API condition"""
        
        # This would make an external API call
        # For now, return False as placeholder
        logger.info(f"External API condition evaluation not implemented: {self.field_name}")
        return False
    
    def _evaluate_custom_function_condition(self, context: Dict[str, Any]) -> bool:
        """Evaluate custom function condition"""
        
        # This would execute custom Python code
        # For security, only allow predefined functions
        custom_functions = context.get('custom_functions', {})
        func = custom_functions.get(self.field_name)
        
        if func and callable(func):
            try:
                result = func(context)
                return self._apply_operator(result, self.expected_value)
            except Exception as e:
                logger.error(f"Error executing custom function {self.field_name}: {e}")
                return False
        
        return False
    
    def _apply_operator(self, actual_value: Any, expected_value: Any) -> bool:
        """Apply comparison operator"""
        
        try:
            if self.operator == ConditionOperator.EQUALS:
                return actual_value == expected_value
            elif self.operator == ConditionOperator.NOT_EQUALS:
                return actual_value != expected_value
            elif self.operator == ConditionOperator.GREATER_THAN:
                return actual_value > expected_value
            elif self.operator == ConditionOperator.GREATER_EQUAL:
                return actual_value >= expected_value
            elif self.operator == ConditionOperator.LESS_THAN:
                return actual_value < expected_value
            elif self.operator == ConditionOperator.LESS_EQUAL:
                return actual_value <= expected_value
            elif self.operator == ConditionOperator.CONTAINS:
                return str(expected_value) in str(actual_value)
            elif self.operator == ConditionOperator.IN_LIST:
                return actual_value in expected_value
            elif self.operator == ConditionOperator.NOT_IN_LIST:
                return actual_value not in expected_value
            elif self.operator == ConditionOperator.REGEX_MATCH:
                import re
                return bool(re.match(expected_value, str(actual_value)))
            elif self.operator == ConditionOperator.IS_NULL:
                return actual_value is None
            elif self.operator == ConditionOperator.IS_NOT_NULL:
                return actual_value is not None
            else:
                logger.warning(f"Unknown operator: {self.operator}")
                return False
                
        except Exception as e:
            logger.error(f"Error applying operator {self.operator}: {e}")
            return False


@dataclass
class WorkflowBranch:
    """Workflow branch definition with conditions and actions"""
    branch_id: str
    name: str
    conditions: List[WorkflowCondition]
    logical_operator: LogicalOperator
    action: BranchAction
    action_parameters: Dict[str, Any]
    priority: int = 1
    description: str = ""
    
    def evaluate(self, context: Dict[str, Any]) -> bool:
        """Evaluate if branch conditions are met"""
        
        if not self.conditions:
            return True
        
        if len(self.conditions) == 1:
            return self.conditions[0].evaluate(context)
        
        # Evaluate multiple conditions with logical operator
        results = [condition.evaluate(context) for condition in self.conditions]
        
        if self.logical_operator == LogicalOperator.AND:
            return all(results)
        elif self.logical_operator == LogicalOperator.OR:
            return any(results)
        elif self.logical_operator == LogicalOperator.NOT:
            # NOT operator applies to all conditions
            return not any(results)
        else:
            logger.warning(f"Unknown logical operator: {self.logical_operator}")
            return False
    
    def execute_action(self, workflow_instance: WorkflowInstance, context: Dict[str, Any]) -> Dict[str, Any]:
        """Execute branch action"""
        
        try:
            if self.action == BranchAction.GOTO_STEP:
                return self._goto_step(workflow_instance, context)
            elif self.action == BranchAction.SKIP_STEPS:
                return self._skip_steps(workflow_instance, context)
            elif self.action == BranchAction.CREATE_PARALLEL:
                return self._create_parallel_branch(workflow_instance, context)
            elif self.action == BranchAction.MERGE_BRANCHES:
                return self._merge_branches(workflow_instance, context)
            elif self.action == BranchAction.END_WORKFLOW:
                return self._end_workflow(workflow_instance, context)
            elif self.action == BranchAction.PAUSE_WORKFLOW:
                return self._pause_workflow(workflow_instance, context)
            elif self.action == BranchAction.ESCALATE:
                return self._escalate(workflow_instance, context)
            elif self.action == BranchAction.CALL_EXTERNAL:
                return self._call_external(workflow_instance, context)
            else:
                return {'success': False, 'error': f'Unknown action: {self.action}'}
                
        except Exception as e:
            logger.error(f"Error executing branch action {self.action}: {e}")
            return {'success': False, 'error': str(e)}
    
    def _goto_step(self, workflow_instance: WorkflowInstance, context: Dict[str, Any]) -> Dict[str, Any]:
        """Go to specific step"""
        
        target_step_id = self.action_parameters.get('step_id')
        target_step_order = self.action_parameters.get('step_order')
        
        if target_step_id:
            # Find step by ID
            target_step = workflow_instance.step_instances.filter(
                workflow_step__id=target_step_id
            ).first()
        elif target_step_order:
            # Find step by order
            target_step = workflow_instance.step_instances.filter(
                workflow_step__order=target_step_order
            ).first()
        else:
            return {'success': False, 'error': 'No target step specified'}
        
        if not target_step:
            return {'success': False, 'error': 'Target step not found'}
        
        # Mark target step as ready to start
        if target_step.status == StepStatus.PENDING:
            target_step.status = StepStatus.IN_PROGRESS
            target_step.save()
        
        return {
            'success': True,
            'action': 'goto_step',
            'target_step': str(target_step.id),
            'step_name': target_step.workflow_step.name
        }
    
    def _skip_steps(self, workflow_instance: WorkflowInstance, context: Dict[str, Any]) -> Dict[str, Any]:
        """Skip specified steps"""
        
        skip_step_ids = self.action_parameters.get('step_ids', [])
        skip_step_orders = self.action_parameters.get('step_orders', [])
        
        skipped_steps = []
        
        # Skip steps by ID
        for step_id in skip_step_ids:
            step_instance = workflow_instance.step_instances.filter(
                workflow_step__id=step_id,
                status=StepStatus.PENDING
            ).first()
            
            if step_instance:
                step_instance.status = StepStatus.SKIPPED
                step_instance.skipped_at = timezone.now()
                step_instance.notes += f"\n[DYNAMIC] Step skipped by branch condition: {self.name}"
                step_instance.save()
                skipped_steps.append(step_instance.workflow_step.name)
        
        # Skip steps by order
        for step_order in skip_step_orders:
            step_instance = workflow_instance.step_instances.filter(
                workflow_step__order=step_order,
                status=StepStatus.PENDING
            ).first()
            
            if step_instance:
                step_instance.status = StepStatus.SKIPPED
                step_instance.skipped_at = timezone.now()
                step_instance.notes += f"\n[DYNAMIC] Step skipped by branch condition: {self.name}"
                step_instance.save()
                skipped_steps.append(step_instance.workflow_step.name)
        
        return {
            'success': True,
            'action': 'skip_steps',
            'skipped_steps': skipped_steps,
            'total_skipped': len(skipped_steps)
        }
    
    def _create_parallel_branch(self, workflow_instance: WorkflowInstance, context: Dict[str, Any]) -> Dict[str, Any]:
        """Create parallel workflow branch"""
        
        # This would create parallel execution paths
        # For now, log the action
        branch_name = self.action_parameters.get('branch_name', f'Parallel Branch {self.branch_id}')
        
        logger.info(f"Creating parallel branch: {branch_name} for workflow {workflow_instance.id}")
        
        return {
            'success': True,
            'action': 'create_parallel',
            'branch_name': branch_name,
            'note': 'Parallel branch creation logged (not yet implemented)'
        }
    
    def _merge_branches(self, workflow_instance: WorkflowInstance, context: Dict[str, Any]) -> Dict[str, Any]:
        """Merge workflow branches"""
        
        logger.info(f"Merging branches for workflow {workflow_instance.id}")
        
        return {
            'success': True,
            'action': 'merge_branches',
            'note': 'Branch merging logged (not yet implemented)'
        }
    
    def _end_workflow(self, workflow_instance: WorkflowInstance, context: Dict[str, Any]) -> Dict[str, Any]:
        """End workflow early"""
        
        reason = self.action_parameters.get('reason', 'Branch condition triggered early completion')
        
        workflow_instance.status = WorkflowInstanceStatus.COMPLETED
        workflow_instance.completed_date = timezone.now()
        workflow_instance.notes += f"\n[DYNAMIC] Workflow ended early: {reason}"
        workflow_instance.save()
        
        return {
            'success': True,
            'action': 'end_workflow',
            'reason': reason
        }
    
    def _pause_workflow(self, workflow_instance: WorkflowInstance, context: Dict[str, Any]) -> Dict[str, Any]:
        """Pause workflow"""
        
        reason = self.action_parameters.get('reason', 'Branch condition triggered pause')
        
        workflow_instance.status = WorkflowInstanceStatus.ON_HOLD
        workflow_instance.notes += f"\n[DYNAMIC] Workflow paused: {reason}"
        workflow_instance.save()
        
        return {
            'success': True,
            'action': 'pause_workflow',
            'reason': reason
        }
    
    def _escalate(self, workflow_instance: WorkflowInstance, context: Dict[str, Any]) -> Dict[str, Any]:
        """Escalate workflow"""
        
        escalation_level = self.action_parameters.get('level', 'normal')
        recipients = self.action_parameters.get('recipients', [])
        
        logger.warning(f"WORKFLOW ESCALATION [{escalation_level.upper()}] for workflow {workflow_instance.id}")
        
        return {
            'success': True,
            'action': 'escalate',
            'level': escalation_level,
            'recipients_notified': len(recipients)
        }
    
    def _call_external(self, workflow_instance: WorkflowInstance, context: Dict[str, Any]) -> Dict[str, Any]:
        """Call external service"""
        
        service_url = self.action_parameters.get('url')
        method = self.action_parameters.get('method', 'POST')
        payload = self.action_parameters.get('payload', {})
        
        # This would make actual external API calls
        # For now, just log the action
        logger.info(f"External service call: {method} {service_url} for workflow {workflow_instance.id}")
        
        return {
            'success': True,
            'action': 'call_external',
            'service_url': service_url,
            'method': method,
            'note': 'External call logged (not yet implemented)'
        }


class DynamicWorkflowEngine:
    """
    Engine for executing dynamic workflows with conditional logic and branching
    """
    
    def __init__(self):
        self.condition_evaluators = {}
        self.action_executors = {}
    
    def evaluate_step_conditions(
        self,
        step_instance: WorkflowStepInstance,
        context: Dict[str, Any]
    ) -> List[WorkflowBranch]:
        """Evaluate conditions for a workflow step"""
        
        # Get dynamic configuration from step
        dynamic_config = step_instance.workflow_step.configuration.get('dynamic', {})
        branches_config = dynamic_config.get('branches', [])
        
        matching_branches = []
        
        for branch_config in branches_config:
            branch = self._create_branch_from_config(branch_config)
            if branch.evaluate(context):
                matching_branches.append(branch)
        
        # Sort by priority (lower number = higher priority)
        matching_branches.sort(key=lambda x: x.priority)
        
        return matching_branches
    
    def execute_dynamic_logic(
        self,
        workflow_instance: WorkflowInstance,
        step_instance: WorkflowStepInstance,
        user: User,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute dynamic workflow logic for a step"""
        
        context = context or {}
        context.update({
            'workflow_instance': workflow_instance,
            'step_instance': step_instance,
            'user': user,
            'workflow_start_time': workflow_instance.start_date,
            'data': step_instance.output_data or {}
        })
        
        # Evaluate step conditions
        matching_branches = self.evaluate_step_conditions(step_instance, context)
        
        results = []
        
        for branch in matching_branches:
            logger.info(f"Executing dynamic branch: {branch.name} for step {step_instance.id}")
            result = branch.execute_action(workflow_instance, context)
            results.append({
                'branch_id': branch.branch_id,
                'branch_name': branch.name,
                'result': result
            })
        
        return {
            'branches_evaluated': len(matching_branches),
            'branches_executed': len([r for r in results if r['result'].get('success')]),
            'execution_results': results
        }
    
    def _create_branch_from_config(self, branch_config: Dict[str, Any]) -> WorkflowBranch:
        """Create WorkflowBranch from configuration dictionary"""
        
        # Parse conditions
        conditions = []
        for cond_config in branch_config.get('conditions', []):
            condition = WorkflowCondition(
                condition_type=ConditionType(cond_config.get('type', ConditionType.DATA_VALUE)),
                field_name=cond_config.get('field_name', ''),
                operator=ConditionOperator(cond_config.get('operator', ConditionOperator.EQUALS)),
                expected_value=cond_config.get('expected_value'),
                description=cond_config.get('description', '')
            )
            conditions.append(condition)
        
        # Create branch
        branch = WorkflowBranch(
            branch_id=branch_config.get('id', ''),
            name=branch_config.get('name', ''),
            conditions=conditions,
            logical_operator=LogicalOperator(branch_config.get('logical_operator', LogicalOperator.AND)),
            action=BranchAction(branch_config.get('action', BranchAction.GOTO_STEP)),
            action_parameters=branch_config.get('action_parameters', {}),
            priority=branch_config.get('priority', 1),
            description=branch_config.get('description', '')
        )
        
        return branch


# Add new status for skipped steps
class ExtendedStepStatus(models.TextChoices):
    """Extended step statuses including skipped"""
    PENDING = 'pending', 'Pending'
    IN_PROGRESS = 'in_progress', 'In Progress'
    WAITING_APPROVAL = 'waiting_approval', 'Waiting for Approval'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'
    CANCELLED = 'cancelled', 'Cancelled'
    SKIPPED = 'skipped', 'Skipped'  # New status for dynamic workflows


# Global dynamic workflow engine instance
dynamic_workflow_engine = DynamicWorkflowEngine()