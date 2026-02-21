"""
Project-Workflow Integration Module
Connects projects with workflow management system
"""

from typing import List, Dict, Optional, Any
from django.db import models
from django.contrib.contenttypes.models import ContentType
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import Project, ProjectTask
from ..workflows.models import WorkflowInstance, WorkflowTemplate, WorkflowStepInstance


class ProjectWorkflowIntegration:
    """Service class for project-workflow integration"""
    
    @classmethod
    def get_project_workflows(cls, project: Project) -> List[Dict[str, Any]]:
        """Get all workflows associated with a project"""
        
        project_content_type = ContentType.objects.get_for_model(Project)
        workflows = WorkflowInstance.objects.filter(
            content_type=project_content_type,
            object_id=project.id
        ).select_related('workflow_template', 'assigned_to').prefetch_related(
            'step_instances',
            'step_instances__assigned_to'
        )
        
        workflow_data = []
        for workflow in workflows:
            # Calculate step progress
            total_steps = workflow.step_instances.count()
            completed_steps = workflow.step_instances.filter(status='completed').count()
            
            workflow_data.append({
                'id': str(workflow.id),
                'name': workflow.name,
                'template_name': workflow.workflow_template.name,
                'status': workflow.status,
                'priority': workflow.priority,
                'progress_percentage': workflow.progress_percentage,
                'start_date': workflow.start_date,
                'due_date': workflow.due_date,
                'completed_date': workflow.completed_date,
                'assigned_to': {
                    'id': str(workflow.assigned_to.id),
                    'name': workflow.assigned_to.get_full_name(),
                    'email': workflow.assigned_to.email
                } if workflow.assigned_to else None,
                'quality_score': workflow.quality_score,
                'step_progress': {
                    'total_steps': total_steps,
                    'completed_steps': completed_steps,
                    'current_step': cls._get_current_step(workflow)
                },
                'created_at': workflow.created_at,
                'updated_at': workflow.updated_at
            })
        
        return workflow_data
    
    @classmethod
    def _get_current_step(cls, workflow: WorkflowInstance) -> Optional[str]:
        """Get the current active step name"""
        current_step = workflow.step_instances.filter(
            status='in_progress'
        ).select_related('workflow_step').first()
        
        return current_step.workflow_step.name if current_step else None
    
    @classmethod
    def create_workflow_from_project(
        cls, 
        project: Project, 
        workflow_template_id: str,
        assigned_to_user_id: Optional[str] = None
    ) -> WorkflowInstance:
        """Create a new workflow instance for a project"""
        
        workflow_template = WorkflowTemplate.objects.get(id=workflow_template_id)
        project_content_type = ContentType.objects.get_for_model(Project)
        
        # Create workflow instance
        workflow = WorkflowInstance.objects.create(
            workflow_template=workflow_template,
            name=f"{workflow_template.name} - {project.name}",
            description=f"Workflow for project: {project.name}",
            content_type=project_content_type,
            object_id=project.id,
            priority=project.priority,
            assigned_to_id=assigned_to_user_id or project.lead_attorney_id,
            organization=project.organization,
            created_by=project.created_by,
            template_version=workflow_template.version
        )
        
        # Create step instances from template
        for step in workflow_template.steps.all().order_by('order'):
            WorkflowStepInstance.objects.create(
                workflow_instance=workflow,
                workflow_step=step,
                assigned_to_id=assigned_to_user_id or step.assigned_user_id,
                due_date=cls._calculate_step_due_date(workflow, step),
            )
        
        # Update template usage count
        workflow_template.increment_usage()
        
        return workflow
    
    @classmethod
    def _calculate_step_due_date(cls, workflow: WorkflowInstance, step):
        """Calculate due date for a step based on workflow timeline"""
        if not workflow.start_date or not step.estimated_duration:
            return None
        
        from datetime import timedelta
        return workflow.start_date + timedelta(hours=step.estimated_duration)
    
    @classmethod
    def get_available_workflow_templates(cls, project_type: str = None) -> List[Dict[str, Any]]:
        """Get workflow templates suitable for projects"""
        
        templates = WorkflowTemplate.objects.filter(is_active=True)
        
        # Filter by project type if provided
        if project_type:
            # This could be enhanced to have more sophisticated matching
            templates = templates.filter(
                models.Q(category__icontains=project_type) |
                models.Q(name__icontains=project_type) |
                models.Q(tags__icontains=project_type)
            )
        
        template_data = []
        for template in templates:
            step_count = template.steps.count()
            usage_stats = template.instances.aggregate(
                total_instances=models.Count('id'),
                completed_instances=models.Count('id', filter=models.Q(status='completed')),
                avg_duration=models.Avg('actual_duration')
            )
            
            template_data.append({
                'id': str(template.id),
                'name': template.name,
                'description': template.description,
                'category': template.category,
                'version': template.version,
                'estimated_duration': template.estimated_duration,
                'step_count': step_count,
                'usage_count': template.usage_count,
                'success_rate': float(template.success_rate) if template.success_rate else 0,
                'usage_stats': usage_stats,
                'auto_assign': template.auto_assign,
                'require_sequential': template.require_sequential,
                'allow_parallel': template.allow_parallel,
                'quality_threshold': template.quality_threshold,
                'require_approval': template.require_approval
            })
        
        return template_data
    
    @classmethod
    def sync_project_task_with_workflow_step(cls, task: ProjectTask, step_instance: WorkflowStepInstance):
        """Synchronize project task with workflow step"""
        
        # Update task from step
        if step_instance.status == 'completed' and task.status != 'done':
            task.status = 'done'
            task.completed_date = step_instance.completed_date
            task.actual_hours = step_instance.actual_hours
            task.save()
        
        # Update step from task
        elif task.status == 'done' and step_instance.status != 'completed':
            step_instance.complete(
                user=task.assigned_to,
                quality_score=None,  # Could be enhanced to sync quality metrics
                output_data={'synced_from_task': True}
            )
    
    @classmethod
    def get_project_workflow_metrics(cls, project: Project) -> Dict[str, Any]:
        """Get workflow metrics for a project"""
        
        project_content_type = ContentType.objects.get_for_model(Project)
        workflows = WorkflowInstance.objects.filter(
            content_type=project_content_type,
            object_id=project.id
        )
        
        if not workflows.exists():
            return {
                'total_workflows': 0,
                'active_workflows': 0,
                'completed_workflows': 0,
                'average_completion_rate': 0,
                'overdue_workflows': 0,
                'quality_scores': []
            }
        
        # Calculate metrics
        total_workflows = workflows.count()
        active_workflows = workflows.filter(
            status__in=['pending', 'in_progress', 'on_hold']
        ).count()
        completed_workflows = workflows.filter(status='completed').count()
        
        # Calculate completion rate
        completion_rates = [w.progress_percentage for w in workflows]
        avg_completion_rate = sum(completion_rates) / len(completion_rates) if completion_rates else 0
        
        # Count overdue workflows
        from django.utils import timezone
        overdue_workflows = workflows.filter(
            due_date__lt=timezone.now().date(),
            status__in=['pending', 'in_progress', 'on_hold']
        ).count()
        
        # Collect quality scores
        quality_scores = [w.quality_score for w in workflows if w.quality_score is not None]
        
        return {
            'total_workflows': total_workflows,
            'active_workflows': active_workflows,
            'completed_workflows': completed_workflows,
            'average_completion_rate': round(avg_completion_rate, 2),
            'overdue_workflows': overdue_workflows,
            'quality_scores': quality_scores,
            'average_quality_score': round(sum(quality_scores) / len(quality_scores), 2) if quality_scores else None
        }


# API Views for project-workflow integration
@api_view(['GET'])
def project_workflows_view(request, project_id):
    """Get workflows for a specific project"""
    try:
        project = Project.objects.get(id=project_id)
        workflows = ProjectWorkflowIntegration.get_project_workflows(project)
        
        return Response({
            'project_id': str(project.id),
            'project_name': project.name,
            'workflows': workflows
        })
    except Project.DoesNotExist:
        return Response(
            {'error': 'Project not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
def create_project_workflow_view(request, project_id):
    """Create a new workflow for a project"""
    try:
        project = Project.objects.get(id=project_id)
        workflow_template_id = request.data.get('workflow_template_id')
        assigned_to_user_id = request.data.get('assigned_to_user_id')
        
        if not workflow_template_id:
            return Response(
                {'error': 'workflow_template_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        workflow = ProjectWorkflowIntegration.create_workflow_from_project(
            project=project,
            workflow_template_id=workflow_template_id,
            assigned_to_user_id=assigned_to_user_id
        )
        
        return Response({
            'workflow_id': str(workflow.id),
            'workflow_name': workflow.name,
            'message': 'Workflow created successfully'
        }, status=status.HTTP_201_CREATED)
        
    except Project.DoesNotExist:
        return Response(
            {'error': 'Project not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except WorkflowTemplate.DoesNotExist:
        return Response(
            {'error': 'Workflow template not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def project_workflow_templates_view(request):
    """Get available workflow templates for projects"""
    project_type = request.GET.get('project_type')
    templates = ProjectWorkflowIntegration.get_available_workflow_templates(project_type)
    
    return Response({
        'templates': templates,
        'count': len(templates)
    })


@api_view(['GET'])
def project_workflow_metrics_view(request, project_id):
    """Get workflow metrics for a project"""
    try:
        project = Project.objects.get(id=project_id)
        metrics = ProjectWorkflowIntegration.get_project_workflow_metrics(project)
        
        return Response({
            'project_id': str(project.id),
            'project_name': project.name,
            'workflow_metrics': metrics
        })
    except Project.DoesNotExist:
        return Response(
            {'error': 'Project not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )