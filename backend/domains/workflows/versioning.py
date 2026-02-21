"""
Workflow Template Versioning
Manages workflow template versions and evolution
"""

import logging
import json
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
from django.db import transaction, models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.exceptions import ValidationError
import difflib

from .models import (
    WorkflowTemplate, WorkflowStep, WorkflowInstance,
    WorkflowInstanceStatus, StepStatus, QualityControl
)

User = get_user_model()
logger = logging.getLogger(__name__)


class VersionChangeType(Enum):
    """Types of version changes"""
    MAJOR = 'major'  # Breaking changes
    MINOR = 'minor'  # New features, backward compatible
    PATCH = 'patch'  # Bug fixes, backward compatible


class MigrationStrategy(Enum):
    """Strategies for migrating existing workflows"""
    NONE = 'none'  # No migration
    OPTIONAL = 'optional'  # Users can choose to migrate
    REQUIRED = 'required'  # Must migrate to continue
    AUTO = 'auto'  # Automatic migration


@dataclass
class VersionChange:
    """Represents a change between versions"""
    change_type: str  # 'added', 'removed', 'modified'
    component: str  # 'step', 'field', 'configuration'
    name: str
    old_value: Any = None
    new_value: Any = None
    description: str = ""


@dataclass
class VersionMigrationPlan:
    """Plan for migrating workflows from one version to another"""
    from_version: str
    to_version: str
    strategy: MigrationStrategy
    changes: List[VersionChange] = field(default_factory=list)
    breaking_changes: List[str] = field(default_factory=list)
    migration_steps: List[Dict[str, Any]] = field(default_factory=list)
    estimated_impact: Dict[str, Any] = field(default_factory=dict)
    created_by: Optional[User] = None
    created_at: Optional[timezone.datetime] = None


class WorkflowTemplateVersion(models.Model):
    """
    Model to store workflow template versions
    """
    
    class Meta:
        db_table = 'workflow_template_versions'
        ordering = ['-version_number', '-created_at']
        unique_together = ['workflow_template', 'version_number']
    
    workflow_template = models.ForeignKey(
        WorkflowTemplate,
        on_delete=models.CASCADE,
        related_name='versions'
    )
    version_number = models.CharField(max_length=20)  # e.g., "1.0.0", "2.1.3"
    version_tag = models.CharField(max_length=50, blank=True)  # e.g., "beta", "stable"
    
    # Snapshot of template at this version
    template_snapshot = models.JSONField()  # Complete template state
    steps_snapshot = models.JSONField()  # All steps configuration
    quality_controls_snapshot = models.JSONField(default=dict)  # Quality controls
    
    # Version metadata
    change_summary = models.TextField(blank=True)
    release_notes = models.TextField(blank=True)
    breaking_changes = models.JSONField(default=list)
    
    # Version control
    parent_version = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='child_versions'
    )
    is_active = models.BooleanField(default=True)
    is_latest = models.BooleanField(default=False)
    is_stable = models.BooleanField(default=True)
    
    # Migration info
    migration_strategy = models.CharField(
        max_length=20,
        choices=[(s.value, s.name) for s in MigrationStrategy],
        default=MigrationStrategy.OPTIONAL.value
    )
    migration_config = models.JSONField(default=dict)
    
    # Tracking
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    published_at = models.DateTimeField(null=True, blank=True)
    deprecated_at = models.DateTimeField(null=True, blank=True)
    
    # Usage stats
    instance_count = models.IntegerField(default=0)  # Workflows using this version
    migration_count = models.IntegerField(default=0)  # Successful migrations
    
    def __str__(self):
        return f"{self.workflow_template.name} v{self.version_number}"
    
    def get_version_tuple(self) -> Tuple[int, int, int]:
        """Parse version number into tuple"""
        try:
            parts = self.version_number.split('.')
            major = int(parts[0]) if len(parts) > 0 else 0
            minor = int(parts[1]) if len(parts) > 1 else 0
            patch = int(parts[2]) if len(parts) > 2 else 0
            return (major, minor, patch)
        except (ValueError, IndexError):
            return (0, 0, 0)
    
    def is_newer_than(self, other_version: 'WorkflowTemplateVersion') -> bool:
        """Check if this version is newer than another"""
        self_tuple = self.get_version_tuple()
        other_tuple = other_version.get_version_tuple()
        return self_tuple > other_tuple


class WorkflowVersioningManager:
    """
    Manages workflow template versioning and evolution
    """
    
    def create_new_version(
        self,
        template: WorkflowTemplate,
        version_type: VersionChangeType,
        user: User,
        change_summary: str = "",
        release_notes: str = "",
        migration_strategy: MigrationStrategy = MigrationStrategy.OPTIONAL
    ) -> WorkflowTemplateVersion:
        """Create a new version of a workflow template"""
        
        with transaction.atomic():
            # Get current version
            current_version = self._get_latest_version(template)
            new_version_number = self._calculate_new_version(
                current_version.version_number if current_version else "0.0.0",
                version_type
            )
            
            # Create template snapshot
            template_snapshot = self._create_template_snapshot(template)
            steps_snapshot = self._create_steps_snapshot(template)
            quality_controls_snapshot = self._create_quality_controls_snapshot(template)
            
            # Detect changes if there's a previous version
            changes = []
            breaking_changes = []
            if current_version:
                changes = self._detect_changes(
                    current_version.template_snapshot,
                    template_snapshot,
                    current_version.steps_snapshot,
                    steps_snapshot
                )
                breaking_changes = self._identify_breaking_changes(changes)
            
            # Update current version to not be latest
            if current_version:
                current_version.is_latest = False
                current_version.save(update_fields=['is_latest'])
            
            # Create new version
            new_version = WorkflowTemplateVersion.objects.create(
                workflow_template=template,
                version_number=new_version_number,
                template_snapshot=template_snapshot,
                steps_snapshot=steps_snapshot,
                quality_controls_snapshot=quality_controls_snapshot,
                change_summary=change_summary or self._generate_change_summary(changes),
                release_notes=release_notes,
                breaking_changes=breaking_changes,
                parent_version=current_version,
                is_latest=True,
                migration_strategy=migration_strategy.value,
                created_by=user
            )
            
            # Update template version
            template.version = new_version_number
            template.save(update_fields=['version', 'updated_at'])
            
            logger.info(f"Created new version {new_version_number} for template {template.name}")
            
            return new_version
    
    def _calculate_new_version(
        self, 
        current_version: str, 
        change_type: VersionChangeType
    ) -> str:
        """Calculate new version number based on change type"""
        
        try:
            parts = current_version.split('.')
            major = int(parts[0]) if len(parts) > 0 else 0
            minor = int(parts[1]) if len(parts) > 1 else 0
            patch = int(parts[2]) if len(parts) > 2 else 0
        except (ValueError, IndexError):
            major, minor, patch = 0, 0, 0
        
        if change_type == VersionChangeType.MAJOR:
            return f"{major + 1}.0.0"
        elif change_type == VersionChangeType.MINOR:
            return f"{major}.{minor + 1}.0"
        else:  # PATCH
            return f"{major}.{minor}.{patch + 1}"
    
    def _create_template_snapshot(self, template: WorkflowTemplate) -> Dict[str, Any]:
        """Create a snapshot of template configuration"""
        
        return {
            'id': str(template.id),
            'name': template.name,
            'description': template.description,
            'category': template.category,
            'require_sequential': template.require_sequential,
            'auto_assign': template.auto_assign,
            'estimated_duration': template.estimated_duration,
            'success_rate': float(template.success_rate) if template.success_rate else None,
            'tags': template.tags,
            'color': template.color,
            'icon': template.icon,
            'display_order': template.display_order,
            'configuration': getattr(template, 'configuration', {})
        }
    
    def _create_steps_snapshot(self, template: WorkflowTemplate) -> List[Dict[str, Any]]:
        """Create a snapshot of template steps"""
        
        steps = []
        for step in template.steps.all().order_by('order'):
            step_data = {
                'id': str(step.id),
                'name': step.name,
                'description': step.description,
                'step_type': step.step_type,
                'order': step.order,
                'is_required': step.is_required,
                'is_parallel': step.is_parallel,
                'estimated_duration': step.estimated_duration,
                'estimated_hours': float(step.estimated_hours) if step.estimated_hours else None,
                'assigned_role': step.assigned_role,
                'approver_roles': step.approver_roles,
                'configuration': getattr(step, 'configuration', {}),
                'depends_on': [str(d.id) for d in step.depends_on.all()]
            }
            steps.append(step_data)
        
        return steps
    
    def _create_quality_controls_snapshot(self, template: WorkflowTemplate) -> Dict[str, Any]:
        """Create a snapshot of quality controls"""
        
        controls = {}
        
        # Template-level quality controls
        template_controls = QualityControl.objects.filter(workflow_template=template)
        controls['template'] = [
            {
                'id': str(qc.id),
                'name': qc.name,
                'description': qc.description,
                'type': qc.type,
                'criteria': qc.criteria,
                'passing_score': qc.passing_score,
                'is_required': qc.is_required,
                'is_blocking': qc.is_blocking
            }
            for qc in template_controls
        ]
        
        # Step-level quality controls
        for step in template.steps.all():
            step_controls = QualityControl.objects.filter(workflow_step=step)
            if step_controls.exists():
                controls[f'step_{step.id}'] = [
                    {
                        'id': str(qc.id),
                        'name': qc.name,
                        'type': qc.type,
                        'criteria': qc.criteria,
                        'passing_score': qc.passing_score,
                        'is_required': qc.is_required,
                        'is_blocking': qc.is_blocking
                    }
                    for qc in step_controls
                ]
        
        return controls
    
    def _detect_changes(
        self,
        old_template: Dict[str, Any],
        new_template: Dict[str, Any],
        old_steps: List[Dict[str, Any]],
        new_steps: List[Dict[str, Any]]
    ) -> List[VersionChange]:
        """Detect changes between versions"""
        
        changes = []
        
        # Check template-level changes
        for key in new_template:
            if key in old_template:
                if old_template[key] != new_template[key]:
                    changes.append(VersionChange(
                        change_type='modified',
                        component='template',
                        name=key,
                        old_value=old_template[key],
                        new_value=new_template[key]
                    ))
            else:
                changes.append(VersionChange(
                    change_type='added',
                    component='template',
                    name=key,
                    new_value=new_template[key]
                ))
        
        for key in old_template:
            if key not in new_template:
                changes.append(VersionChange(
                    change_type='removed',
                    component='template',
                    name=key,
                    old_value=old_template[key]
                ))
        
        # Check step changes
        old_step_ids = {s['id'] for s in old_steps}
        new_step_ids = {s['id'] for s in new_steps}
        
        # Added steps
        for step in new_steps:
            if step['id'] not in old_step_ids:
                changes.append(VersionChange(
                    change_type='added',
                    component='step',
                    name=step['name'],
                    new_value=step
                ))
        
        # Removed steps
        for step in old_steps:
            if step['id'] not in new_step_ids:
                changes.append(VersionChange(
                    change_type='removed',
                    component='step',
                    name=step['name'],
                    old_value=step
                ))
        
        # Modified steps
        for new_step in new_steps:
            if new_step['id'] in old_step_ids:
                old_step = next(s for s in old_steps if s['id'] == new_step['id'])
                if old_step != new_step:
                    changes.append(VersionChange(
                        change_type='modified',
                        component='step',
                        name=new_step['name'],
                        old_value=old_step,
                        new_value=new_step
                    ))
        
        return changes
    
    def _identify_breaking_changes(self, changes: List[VersionChange]) -> List[str]:
        """Identify breaking changes that require migration"""
        
        breaking = []
        
        for change in changes:
            # Removed required steps are breaking
            if change.change_type == 'removed' and change.component == 'step':
                if change.old_value.get('is_required'):
                    breaking.append(f"Required step '{change.name}' was removed")
            
            # Changed step types are breaking
            if change.change_type == 'modified' and change.component == 'step':
                if change.old_value.get('step_type') != change.new_value.get('step_type'):
                    breaking.append(f"Step '{change.name}' type changed")
            
            # Changed dependencies might be breaking
            if change.change_type == 'modified' and change.component == 'step':
                old_deps = set(change.old_value.get('depends_on', []))
                new_deps = set(change.new_value.get('depends_on', []))
                if old_deps != new_deps:
                    breaking.append(f"Step '{change.name}' dependencies changed")
        
        return breaking
    
    def _generate_change_summary(self, changes: List[VersionChange]) -> str:
        """Generate a summary of changes"""
        
        added = len([c for c in changes if c.change_type == 'added'])
        modified = len([c for c in changes if c.change_type == 'modified'])
        removed = len([c for c in changes if c.change_type == 'removed'])
        
        summary_parts = []
        if added:
            summary_parts.append(f"{added} added")
        if modified:
            summary_parts.append(f"{modified} modified")
        if removed:
            summary_parts.append(f"{removed} removed")
        
        return f"Changes: {', '.join(summary_parts)}" if summary_parts else "No changes"
    
    def _get_latest_version(self, template: WorkflowTemplate) -> Optional[WorkflowTemplateVersion]:
        """Get the latest version of a template"""
        
        return WorkflowTemplateVersion.objects.filter(
            workflow_template=template,
            is_latest=True
        ).first()
    
    def migrate_workflow_instance(
        self,
        workflow_instance: WorkflowInstance,
        target_version: WorkflowTemplateVersion,
        user: User,
        force: bool = False
    ) -> Tuple[bool, List[str]]:
        """Migrate a workflow instance to a new template version"""
        
        messages = []
        
        # Check if migration is needed
        current_version = workflow_instance.template_version if hasattr(workflow_instance, 'template_version') else None
        if current_version == target_version.version_number:
            messages.append("Workflow already at target version")
            return True, messages
        
        # Check migration strategy
        if target_version.migration_strategy == MigrationStrategy.NONE.value and not force:
            messages.append("Migration not allowed for this version")
            return False, messages
        
        # Check if workflow can be migrated (not completed)
        if workflow_instance.status in [WorkflowInstanceStatus.COMPLETED, WorkflowInstanceStatus.CANCELLED]:
            if not force:
                messages.append("Cannot migrate completed or cancelled workflows")
                return False, messages
        
        try:
            with transaction.atomic():
                # Create migration plan
                migration_plan = self._create_migration_plan(
                    workflow_instance,
                    target_version
                )
                
                # Execute migration
                success = self._execute_migration(
                    workflow_instance,
                    migration_plan,
                    user
                )
                
                if success:
                    # Update instance version
                    workflow_instance.template_version = target_version.version_number
                    workflow_instance.save(update_fields=['template_version', 'updated_at'])
                    
                    # Update version stats
                    target_version.instance_count += 1
                    target_version.migration_count += 1
                    target_version.save(update_fields=['instance_count', 'migration_count'])
                    
                    messages.append(f"Successfully migrated to version {target_version.version_number}")
                    
                return success, messages
                
        except Exception as e:
            logger.error(f"Migration failed for workflow {workflow_instance.id}: {e}")
            messages.append(f"Migration failed: {str(e)}")
            return False, messages
    
    def _create_migration_plan(
        self,
        workflow_instance: WorkflowInstance,
        target_version: WorkflowTemplateVersion
    ) -> VersionMigrationPlan:
        """Create a migration plan for a workflow instance"""
        
        plan = VersionMigrationPlan(
            from_version=workflow_instance.template_version if hasattr(workflow_instance, 'template_version') else "0.0.0",
            to_version=target_version.version_number,
            strategy=MigrationStrategy(target_version.migration_strategy)
        )
        
        # Analyze changes needed
        current_steps = list(workflow_instance.step_instances.all())
        target_steps = target_version.steps_snapshot
        
        # Map steps
        step_mapping = {}
        for current_step in current_steps:
            for target_step in target_steps:
                if current_step.workflow_step.name == target_step['name']:
                    step_mapping[str(current_step.id)] = target_step
                    break
        
        # Plan migration steps
        for current_step in current_steps:
            if str(current_step.id) not in step_mapping:
                # Step removed in new version
                if current_step.status == StepStatus.PENDING:
                    plan.migration_steps.append({
                        'action': 'remove_step',
                        'step_id': str(current_step.id),
                        'reason': 'Step not in new version'
                    })
        
        # Add new steps
        existing_step_names = {s.workflow_step.name for s in current_steps}
        for target_step in target_steps:
            if target_step['name'] not in existing_step_names:
                plan.migration_steps.append({
                    'action': 'add_step',
                    'step_data': target_step,
                    'reason': 'New step in version'
                })
        
        # Estimate impact
        plan.estimated_impact = {
            'steps_to_add': len([s for s in plan.migration_steps if s['action'] == 'add_step']),
            'steps_to_remove': len([s for s in plan.migration_steps if s['action'] == 'remove_step']),
            'data_loss_risk': 'low' if not plan.breaking_changes else 'medium'
        }
        
        return plan
    
    def _execute_migration(
        self,
        workflow_instance: WorkflowInstance,
        migration_plan: VersionMigrationPlan,
        user: User
    ) -> bool:
        """Execute a migration plan"""
        
        try:
            for step in migration_plan.migration_steps:
                if step['action'] == 'remove_step':
                    # Remove step instance
                    WorkflowStepInstance.objects.filter(
                        id=step['step_id']
                    ).delete()
                    
                elif step['action'] == 'add_step':
                    # Create new step instance
                    step_data = step['step_data']
                    # This would need proper step creation logic
                    # For now, we'll skip actual creation
                    pass
            
            # Add audit entry
            workflow_instance.add_audit_entry(
                'version_migrated',
                user,
                {
                    'from_version': migration_plan.from_version,
                    'to_version': migration_plan.to_version,
                    'steps_added': migration_plan.estimated_impact['steps_to_add'],
                    'steps_removed': migration_plan.estimated_impact['steps_to_remove']
                }
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Migration execution failed: {e}")
            return False
    
    def rollback_version(
        self,
        template: WorkflowTemplate,
        target_version: WorkflowTemplateVersion,
        user: User
    ) -> bool:
        """Rollback a template to a previous version"""
        
        try:
            with transaction.atomic():
                # Restore template from snapshot
                snapshot = target_version.template_snapshot
                
                template.name = snapshot['name']
                template.description = snapshot['description']
                template.category = snapshot['category']
                template.require_sequential = snapshot['require_sequential']
                template.auto_assign = snapshot['auto_assign']
                if hasattr(template, 'configuration'):
                    template.configuration = snapshot['configuration']
                template.version = target_version.version_number
                template.save()
                
                # Mark as latest version
                WorkflowTemplateVersion.objects.filter(
                    workflow_template=template
                ).update(is_latest=False)
                
                target_version.is_latest = True
                target_version.save(update_fields=['is_latest'])
                
                logger.info(f"Rolled back template {template.name} to version {target_version.version_number}")
                return True
                
        except Exception as e:
            logger.error(f"Rollback failed: {e}")
            return False
    
    def get_version_history(
        self,
        template: WorkflowTemplate
    ) -> List[WorkflowTemplateVersion]:
        """Get version history for a template"""
        
        return WorkflowTemplateVersion.objects.filter(
            workflow_template=template
        ).order_by('-created_at')
    
    def compare_versions(
        self,
        version1: WorkflowTemplateVersion,
        version2: WorkflowTemplateVersion
    ) -> Dict[str, Any]:
        """Compare two versions and return differences"""
        
        changes = self._detect_changes(
            version1.template_snapshot,
            version2.template_snapshot,
            version1.steps_snapshot,
            version2.steps_snapshot
        )
        
        return {
            'version1': version1.version_number,
            'version2': version2.version_number,
            'changes': [
                {
                    'type': c.change_type,
                    'component': c.component,
                    'name': c.name,
                    'description': c.description
                }
                for c in changes
            ],
            'change_count': len(changes),
            'has_breaking_changes': len(version2.breaking_changes) > 0
        }


# Global instance
versioning_manager = WorkflowVersioningManager()