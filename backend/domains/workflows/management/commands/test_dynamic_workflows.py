"""
Management command to test dynamic workflow system
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from domains.projects.models import Project
from domains.workflows.models import WorkflowTemplate, WorkflowStep, StepType
from domains.workflows.services import workflow_engine
from domains.workflows.integrations import ProjectWorkflowIntegration
from domains.workflows.dynamic import (
    ConditionType, ConditionOperator, BranchAction, LogicalOperator
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Test dynamic workflow system with conditional logic'

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

        self.stdout.write('Testing dynamic workflow system...')

        # Step 1: Create workflow template with dynamic logic
        template = self.create_dynamic_workflow_template(admin_user)
        
        # Step 2: Create test project and workflow instance
        project, workflow = self.create_test_workflow_instance(template, admin_user)
        
        # Step 3: Test different dynamic scenarios
        self.test_dynamic_scenarios(workflow, admin_user)

        self.stdout.write(
            self.style.SUCCESS('Dynamic workflow testing completed!')
        )

    def create_dynamic_workflow_template(self, admin_user):
        """Create workflow template with dynamic conditional logic"""
        
        self.stdout.write("Creating dynamic workflow template...")

        # Create template (delete existing one for testing)
        WorkflowTemplate.objects.filter(name="Dynamic Patent Analysis Workflow").delete()
        
        template = WorkflowTemplate.objects.create(
            name="Dynamic Patent Analysis Workflow",
            description='Patent analysis workflow with conditional branching based on complexity',
            category='Patent Analysis',
            is_active=True,
            require_sequential=True,
            auto_assign=True,
            created_by=admin_user
        )
        created = True

        if created:
            # Step 1: Initial Assessment (with dynamic logic)
            initial_step = WorkflowStep.objects.create(
                workflow_template=template,
                name="Initial Patent Assessment",
                description="Assess patent complexity and determine path",
                step_type=StepType.MANUAL,
                order=1,
                is_required=True,
                estimated_duration=2,
                created_by=admin_user,
                configuration={
                    'required_fields': ['patent_type', 'complexity_score', 'prior_art_count'],
                    'dynamic': {
                        'branches': [
                            {
                                'id': 'high_complexity',
                                'name': 'High Complexity Branch',
                                'conditions': [
                                    {
                                        'type': 'data_value',
                                        'field_name': 'complexity_score',
                                        'operator': 'gte',
                                        'expected_value': 8,
                                        'description': 'Complexity score >= 8'
                                    }
                                ],
                                'logical_operator': 'and',
                                'action': 'goto_step',
                                'action_parameters': {
                                    'step_order': 4  # Skip to expert review
                                },
                                'priority': 1,
                                'description': 'Route high complexity patents to expert review'
                            },
                            {
                                'id': 'simple_patent',
                                'name': 'Simple Patent Branch',
                                'conditions': [
                                    {
                                        'type': 'data_value',
                                        'field_name': 'complexity_score',
                                        'operator': 'lte',
                                        'expected_value': 3,
                                        'description': 'Complexity score <= 3'
                                    },
                                    {
                                        'type': 'data_value',
                                        'field_name': 'patent_type',
                                        'operator': 'eq',
                                        'expected_value': 'utility',
                                        'description': 'Utility patent type'
                                    }
                                ],
                                'logical_operator': 'and',
                                'action': 'skip_steps',
                                'action_parameters': {
                                    'step_orders': [3]  # Skip detailed analysis
                                },
                                'priority': 2,
                                'description': 'Skip detailed analysis for simple patents'
                            }
                        ]
                    }
                }
            )

            # Step 2: Prior Art Search
            WorkflowStep.objects.create(
                workflow_template=template,
                name="Prior Art Search",
                description="Search for relevant prior art",
                step_type=StepType.MANUAL,
                order=2,
                is_required=True,
                estimated_duration=3,
                created_by=admin_user
            )

            # Step 3: Detailed Technical Analysis (can be skipped)
            WorkflowStep.objects.create(
                workflow_template=template,
                name="Detailed Technical Analysis",
                description="In-depth technical analysis of the patent",
                step_type=StepType.MANUAL,
                order=3,
                is_required=False,
                estimated_duration=5,
                created_by=admin_user,
                configuration={
                    'skippable': True,
                    'skip_conditions': ['simple_patent']
                }
            )

            # Step 4: Expert Review (for complex patents)
            WorkflowStep.objects.create(
                workflow_template=template,
                name="Expert Legal Review",
                description="Expert review for complex patents",
                step_type=StepType.APPROVAL,
                order=4,
                is_required=False,
                estimated_duration=2,
                approver_roles=['lead_attorney', 'supervisor'],
                created_by=admin_user,
                configuration={
                    'dynamic': {
                        'branches': [
                            {
                                'id': 'escalate_critical',
                                'name': 'Escalate Critical Issues',
                                'conditions': [
                                    {
                                        'type': 'quality_score',
                                        'field_name': 'overall_quality',
                                        'operator': 'lt',
                                        'expected_value': 70,
                                        'description': 'Quality score < 70%'
                                    }
                                ],
                                'logical_operator': 'and',
                                'action': 'escalate',
                                'action_parameters': {
                                    'level': 'critical',
                                    'recipients': ['supervisor', 'manager']
                                },
                                'priority': 1,
                                'description': 'Escalate patents with quality issues'
                            }
                        ]
                    }
                }
            )

            # Step 5: Final Report Generation
            final_step = WorkflowStep.objects.create(
                workflow_template=template,
                name="Generate Final Report",
                description="Compile final analysis report",
                step_type=StepType.AUTOMATED,
                order=5,
                is_required=True,
                estimated_duration=1,
                created_by=admin_user,
                configuration={
                    'dynamic': {
                        'branches': [
                            {
                                'id': 'user_role_branch',
                                'name': 'Role-Based Completion',
                                'conditions': [
                                    {
                                        'type': 'user_role',
                                        'field_name': 'role',
                                        'operator': 'in',
                                        'expected_value': ['lead_attorney', 'supervisor'],
                                        'description': 'User is senior role'
                                    }
                                ],
                                'logical_operator': 'and',
                                'action': 'end_workflow',
                                'action_parameters': {
                                    'reason': 'Workflow completed by senior role'
                                },
                                'priority': 1,
                                'description': 'Allow senior roles to complete workflow early'
                            }
                        ]
                    }
                }
            )

            self.stdout.write(f"Created dynamic workflow template with {template.steps.count()} steps")
        else:
            self.stdout.write("Dynamic workflow template already exists")

        return template

    def create_test_workflow_instance(self, template, admin_user):
        """Create test project and workflow instance"""
        
        self.stdout.write("Creating test workflow instance...")

        # Create test project
        project = Project.objects.create(
            name="Dynamic Workflow Test Patent",
            description="Test patent for dynamic workflow system",
            type="Patent Analysis",
            created_by=admin_user
        )

        # Attach dynamic workflow
        workflows = ProjectWorkflowIntegration.attach_workflows_to_project(
            project=project,
            user=admin_user,
            workflow_names=[template.name]
        )

        workflow = workflows[0] if workflows else None

        if workflow:
            self.stdout.write(f"Created workflow instance: {workflow.id}")
            
            # Start the workflow
            workflow_engine.start_workflow(workflow, admin_user)
            self.stdout.write("Started dynamic workflow")
        
        return project, workflow

    def test_dynamic_scenarios(self, workflow, admin_user):
        """Test different dynamic workflow scenarios"""
        
        self.stdout.write("\nTesting dynamic workflow scenarios...")

        # Refresh workflow to get step instances
        workflow.refresh_from_db()
        
        # Get all step instances
        all_steps = workflow.step_instances.all().order_by('workflow_step__order')
        self.stdout.write(f"Found {all_steps.count()} step instances:")
        for step in all_steps:
            self.stdout.write(f"  - {step.workflow_step.name} (Order: {step.workflow_step.order}, Status: {step.status})")

        # Get the initial assessment step
        initial_step = workflow.step_instances.filter(
            workflow_step__order=1
        ).first()

        if not initial_step:
            self.stdout.write(self.style.ERROR("Initial step not found - checking if steps were created"))
            # Check template steps
            template_steps = workflow.workflow_template.steps.all().order_by('order')
            self.stdout.write(f"Template has {template_steps.count()} steps:")
            for step in template_steps:
                self.stdout.write(f"  - {step.name} (Order: {step.order})")
            return

        # Scenario 1: High complexity patent (should go to expert review)
        self.stdout.write("\n--- Scenario 1: High Complexity Patent ---")
        
        initial_step.output_data = {
            'patent_type': 'utility',
            'complexity_score': 9,  # High complexity
            'prior_art_count': 15,
            'assessment_complete': True
        }
        initial_step.save()

        # Complete the step to trigger dynamic logic
        result = workflow_engine.complete_step(
            initial_step, 
            admin_user, 
            output_data=initial_step.output_data,
            quality_score=95
        )

        self.stdout.write(f"Step completion result: {result}")

        # Check if branching occurred
        self._check_workflow_state(workflow, "After high complexity scenario")

        # Create new workflow for next scenario
        workflow2 = self._create_fresh_workflow_instance(workflow.workflow_template, admin_user)
        
        # Scenario 2: Simple patent (should skip detailed analysis)
        self.stdout.write("\n--- Scenario 2: Simple Patent ---")
        
        simple_step = workflow2.step_instances.filter(
            workflow_step__order=1
        ).first()

        simple_step.output_data = {
            'patent_type': 'utility',
            'complexity_score': 2,  # Low complexity
            'prior_art_count': 3,
            'assessment_complete': True
        }
        simple_step.save()

        # Complete the step
        result2 = workflow_engine.complete_step(
            simple_step,
            admin_user,
            output_data=simple_step.output_data,
            quality_score=88
        )

        self.stdout.write(f"Step completion result: {result2}")
        self._check_workflow_state(workflow2, "After simple patent scenario")

        # Scenario 3: Quality-based escalation
        self.stdout.write("\n--- Scenario 3: Quality-Based Escalation ---")
        
        workflow3 = self._create_fresh_workflow_instance(workflow.workflow_template, admin_user)
        
        # Progress to expert review step manually for testing
        expert_step = workflow3.step_instances.filter(
            workflow_step__order=4
        ).first()

        if expert_step:
            expert_step.status = 'in_progress'
            expert_step.save()

            # Set low quality score to trigger escalation
            expert_step.output_data = {
                'review_complete': True,
                'overall_quality': 65  # Low quality score
            }
            expert_step.save()

            result3 = workflow_engine.complete_step(
                expert_step,
                admin_user,
                output_data=expert_step.output_data,
                quality_score=65
            )

            self.stdout.write(f"Expert review result: {result3}")
            self._check_workflow_state(workflow3, "After quality escalation scenario")

    def _create_fresh_workflow_instance(self, template, admin_user):
        """Create a fresh workflow instance for testing"""
        
        project = Project.objects.create(
            name=f"Dynamic Test Patent {timezone.now().timestamp()}",
            description="Additional test for dynamic workflows",
            type="Patent Analysis", 
            created_by=admin_user
        )

        workflows = ProjectWorkflowIntegration.attach_workflows_to_project(
            project=project,
            user=admin_user,
            workflow_names=[template.name]
        )

        workflow = workflows[0]
        workflow_engine.start_workflow(workflow, admin_user)
        
        return workflow

    def _check_workflow_state(self, workflow, scenario_name):
        """Check and report workflow state"""
        
        self.stdout.write(f"\n{scenario_name}:")
        self.stdout.write(f"  Workflow Status: {workflow.status}")
        
        for step in workflow.step_instances.all().order_by('workflow_step__order'):
            self.stdout.write(
                f"  Step {step.workflow_step.order}: {step.workflow_step.name} - {step.status}"
            )
            
            if step.notes and '[DYNAMIC]' in step.notes:
                dynamic_notes = [line for line in step.notes.split('\n') if '[DYNAMIC]' in line]
                for note in dynamic_notes:
                    self.stdout.write(f"    {note}")