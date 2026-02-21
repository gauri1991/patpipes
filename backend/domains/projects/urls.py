"""
Projects Domain URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_nested import routers

from .views import (
    ProjectViewSet, ProjectTaskViewSet, ProjectFileViewSet,
    ProjectMilestoneViewSet, ProjectTemplateViewSet, ProjectTypeViewSet,
    ImportBatchViewSet, ImportedPatentViewSet
)
from .workflow_integration import (
    project_workflows_view, create_project_workflow_view,
    project_workflow_templates_view, project_workflow_metrics_view
)

# Main router
router = DefaultRouter(trailing_slash=False)
router.register(r'projects', ProjectViewSet)
router.register(r'project-types', ProjectTypeViewSet)
router.register(r'templates', ProjectTemplateViewSet)

# Nested routers for project resources
projects_router = routers.NestedDefaultRouter(router, r'projects', lookup='project', trailing_slash=False)
projects_router.register(r'tasks', ProjectTaskViewSet, basename='project-tasks')
projects_router.register(r'files', ProjectFileViewSet, basename='project-files')
projects_router.register(r'milestones', ProjectMilestoneViewSet, basename='project-milestones')
projects_router.register(r'import-batches', ImportBatchViewSet, basename='project-import-batches')
projects_router.register(r'imported-patents', ImportedPatentViewSet, basename='project-imported-patents')

urlpatterns = [
    # Original router patterns
    path('', include(router.urls)),
    path('', include(projects_router.urls)),
    
    # Workflow integration endpoints
    path('projects/<uuid:project_id>/workflows/', project_workflows_view, name='project-workflows'),
    path('projects/<uuid:project_id>/workflows/create/', create_project_workflow_view, name='create-project-workflow'),
    path('projects/<uuid:project_id>/workflows/metrics/', project_workflow_metrics_view, name='project-workflow-metrics'),
    path('workflow-templates/', project_workflow_templates_view, name='project-workflow-templates'),
]