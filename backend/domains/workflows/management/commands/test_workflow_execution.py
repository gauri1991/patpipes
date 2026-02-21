"""
Management command to test workflow execution
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from domains.projects.models import Project
from domains.workflows.models import WorkflowTemplate
from domains.workflows.services import workflow_engine
from domains.workflows.integrations import ProjectWorkflowIntegration

User = get_user_model()


class Command(BaseCommand):
    help = 'Test workflow execution with sample data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--admin-user',
            type=str,
            help='Username of admin user (default: admin)',
            default='admin'
        )

    def handle(self, *args, **options):
        try:
            admin_user = User.objects.get(username=options['admin_user'])
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f"Admin user '{options['admin_user']}' not found")
            )
            return

        self.stdout.write('Testing workflow execution...')

        # Step 1: Create a test project
        project = self.create_test_project(admin_user)
        
        # Step 2: Test workflow attachment
        workflows = self.test_workflow_attachment(project, admin_user)
        
        # Step 3: Test workflow execution
        if workflows:
            self.test_workflow_execution(workflows[0], admin_user)
        
        # Step 4: Test project integration
        self.test_project_integration(project)

        self.stdout.write(
            self.style.SUCCESS('Workflow execution test completed successfully!')
        )

    def create_test_project(self, user):
        """Create a test project for workflow testing"""
        
        project = Project.objects.create(
            name="Test Patent Drafting Project",
            description="Test project for workflow execution",
            type="Patent Drafting - Utility",
            client_name="Test Client",
            client_email="test@example.com",
            budget=50000.00,
            currency="USD",
            created_by=user,
            lead_attorney=user
        )
        
        self.stdout.write(f"Created test project: {project.id}")
        return project

    def test_workflow_attachment(self, project, user):
        """Test attaching workflows to project"""
        
        # Test automatic workflow attachment
        workflows = ProjectWorkflowIntegration.attach_workflows_to_project(
            project=project,
            user=user,
            workflow_names=['Patent Drafting - Utility Patent'],
            auto_start=False
        )
        
        self.stdout.write(f"Attached {len(workflows)} workflows to project")
        
        for workflow in workflows:
            self.stdout.write(f"  - {workflow.name} (ID: {workflow.id})")
            self.stdout.write(f"    Steps: {workflow.step_instances.count()}")
            self.stdout.write(f"    Status: {workflow.status}")
        
        return workflows

    def test_workflow_execution(self, workflow, user):
        """Test workflow execution flow"""
        
        self.stdout.write(f"\nTesting execution of workflow: {workflow.name}")
        
        # Step 1: Start workflow
        self.stdout.write("Starting workflow...")
        workflow_engine.start_workflow(workflow, user)
        
        # Refresh from database
        workflow.refresh_from_db()
        self.stdout.write(f"Workflow status: {workflow.status}")
        self.stdout.write(f"Progress: {workflow.progress_percentage}%")
        
        # Step 2: Check initial steps
        in_progress_steps = workflow.step_instances.filter(status='in_progress')
        self.stdout.write(f"Steps in progress: {in_progress_steps.count()}")
        
        for step in in_progress_steps:
            self.stdout.write(f"  - {step.workflow_step.name} (Type: {step.workflow_step.step_type})")
            self.stdout.write(f"    Assigned to: {step.assigned_to.get_full_name() if step.assigned_to else 'Unassigned'}")
        
        # Step 3: Complete first step (if it's manual)
        first_step = in_progress_steps.filter(
            workflow_step__step_type='manual'
        ).first()
        
        if first_step:
            self.stdout.write(f"\nCompleting first manual step: {first_step.workflow_step.name}")
            
            try:
                # Complete the step with sample data
                success = workflow_engine.complete_step(
                    step_instance=first_step,
                    user=user,
                    output_data={
                        'completed_by': user.get_full_name(),
                        'completion_notes': 'Test completion via management command'
                    },
                    quality_score=85
                )
                
                if success:
                    self.stdout.write("Step completed successfully")
                    
                    # Check workflow progress
                    workflow.refresh_from_db()
                    self.stdout.write(f"Updated progress: {workflow.progress_percentage}%")
                    
                    # Check next steps
                    next_steps = workflow.step_instances.filter(status='in_progress')
                    self.stdout.write(f"Next steps in progress: {next_steps.count()}")
                    
                else:
                    self.stdout.write("Step completion failed")
                    
            except Exception as e:
                self.stdout.write(f"Error completing step: {e}")
        
        # Step 4: Show workflow audit log
        self.stdout.write(f"\nWorkflow audit log entries: {len(workflow.audit_log)}")
        for entry in workflow.audit_log[-3:]:  # Show last 3 entries
            self.stdout.write(f"  - {entry.get('timestamp', 'N/A')}: {entry.get('action', 'N/A')}")

    def test_project_integration(self, project):
        """Test project-workflow integration features"""
        
        self.stdout.write(f"\nTesting project integration for: {project.name}")
        
        # Get workflow progress summary
        from domains.workflows.integrations import get_workflow_progress_for_project
        progress_data = get_workflow_progress_for_project(project)
        
        self.stdout.write(f"Project workflow summary:")
        self.stdout.write(f"  - Total workflows: {progress_data['total_workflows']}")
        self.stdout.write(f"  - Overall progress: {progress_data['overall_progress']}%")
        self.stdout.write(f"  - Status summary: {progress_data['status_summary']}")
        self.stdout.write(f"  - Next actions: {len(progress_data['next_actions'])}")
        
        # Show next actions
        if progress_data['next_actions']:
            self.stdout.write("Next actions:")
            for action in progress_data['next_actions'][:3]:  # Show first 3
                self.stdout.write(f"  - {action['step_name']} (Assigned: {action['assigned_to']})")

    def cleanup_test_data(self):
        """Clean up test data (optional)"""
        # This would delete test projects and workflows
        # Commented out for safety
        pass