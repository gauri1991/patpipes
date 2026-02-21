"""
Management command to test the advanced quality control system
"""

import json
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from domains.projects.models import Project
from domains.workflows.models import WorkflowTemplate, WorkflowStepInstance, QualityControl
from domains.workflows.services import workflow_engine
from domains.workflows.quality import quality_engine, QualityIssue, QualityRuleSeverity
from domains.workflows.remediation import remediation_engine
from domains.workflows.analytics import quality_analytics
from domains.workflows.integrations import ProjectWorkflowIntegration

User = get_user_model()


class Command(BaseCommand):
    help = 'Test the advanced quality control system'

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

        self.stdout.write('Testing advanced quality control system...')

        # Step 1: Create quality control templates
        self.create_test_quality_controls(admin_user)
        
        # Step 2: Create test project and workflow
        project, workflow = self.create_test_workflow(admin_user)
        
        # Step 3: Test quality control execution
        self.test_quality_execution(workflow, admin_user)
        
        # Step 4: Test remediation system
        self.test_remediation_system(workflow, admin_user)
        
        # Step 5: Test quality analytics
        self.test_quality_analytics(admin_user)

        self.stdout.write(
            self.style.SUCCESS('Quality control system testing completed successfully!')
        )

    def create_test_quality_controls(self, admin_user):
        """Create test quality controls"""
        
        self.stdout.write("Creating test quality controls...")
        
        try:
            template = WorkflowTemplate.objects.get(name="Patent Drafting - Utility Patent")
            first_step = template.steps.first()
            
            # Create a test quality control with various rule types
            test_qc, created = QualityControl.objects.get_or_create(
                name="Test Quality Control - Advanced",
                workflow_step=first_step,
                defaults={
                    'description': 'Comprehensive test quality control with multiple validation types',
                    'type': 'automated',
                    'criteria': {
                        'completeness': {
                            'required_fields': ['invention_title', 'technical_field', 'prior_art_analysis']
                        },
                        'format_rules': {
                            'invention_title': {
                                'type': 'length',
                                'min_length': 10,
                                'max_length': 200
                            },
                            'patent_number': {
                                'type': 'regex',
                                'pattern': r'^\d{7,8}$'
                            }
                        },
                        'business_rules': [
                            {
                                'name': 'Prior Art Count Reasonable',
                                'condition': 'len(prior_art_references or []) >= 3'
                            },
                            {
                                'name': 'Technical Field Valid',
                                'condition': 'len(technical_field or "") >= 20'
                            }
                        ]
                    },
                    'passing_score': 80,
                    'is_required': True,
                    'is_blocking': False,
                    'auto_remediate': True,
                    'reviewer_roles': ['attorney'],
                    'created_by': admin_user
                }
            )
            
            if created:
                self.stdout.write("Created advanced test quality control")
            else:
                self.stdout.write("Test quality control already exists")
                
        except WorkflowTemplate.DoesNotExist:
            self.stdout.write("Patent template not found, creating basic test quality control")

    def create_test_workflow(self, admin_user):
        """Create test project and workflow"""
        
        self.stdout.write("Creating test project and workflow...")
        
        # Create test project
        project = Project.objects.create(
            name="Quality Control Test Project",
            description="Test project for quality control system validation",
            type="Patent Drafting - Utility",
            created_by=admin_user
        )
        
        # Attach workflow
        workflows = ProjectWorkflowIntegration.attach_workflows_to_project(
            project=project,
            user=admin_user,
            workflow_names=['Patent Drafting - Utility Patent']
        )
        
        workflow = workflows[0] if workflows else None
        
        if workflow:
            self.stdout.write(f"Created test workflow: {workflow.id}")
            
            # Start the workflow
            workflow_engine.start_workflow(workflow, admin_user)
            self.stdout.write("Started test workflow")
        
        return project, workflow

    def test_quality_execution(self, workflow, admin_user):
        """Test quality control execution"""
        
        self.stdout.write("\nTesting quality control execution...")
        
        # Get first step instance
        step_instance = workflow.step_instances.filter(status='in_progress').first()
        
        if not step_instance:
            self.stdout.write("No in-progress step found")
            return
        
        self.stdout.write(f"Testing quality on step: {step_instance.workflow_step.name}")
        
        # Add some test output data with quality issues
        step_instance.output_data = {
            'invention_title': 'Test',  # Too short - should fail length check
            'technical_field': 'AI',     # Too short - should fail length check
            'prior_art_analysis': 'Some analysis here',
            'prior_art_references': ['ref1', 'ref2'],  # Only 2 refs, needs 3+ 
            'patent_number': '12345',   # Invalid format
            'completion_notes': 'Test completion'
        }
        step_instance.save()
        
        # Get quality controls for this step
        quality_controls = QualityControl.objects.filter(
            workflow_step=step_instance.workflow_step
        )
        
        for qc in quality_controls:
            self.stdout.write(f"Executing quality control: {qc.name}")
            
            # Execute quality control using advanced engine
            quality_report = quality_engine.execute_quality_control(
                qc, step_instance, admin_user
            )
            
            self.stdout.write(f"  Status: {quality_report.status.value}")
            self.stdout.write(f"  Score: {quality_report.score}/{quality_report.max_score}")
            self.stdout.write(f"  Issues found: {len(quality_report.issues)}")
            self.stdout.write(f"  Execution time: {quality_report.execution_time:.3f}s")
            
            # Show issues by severity
            for severity in ['critical', 'error', 'warning', 'info']:
                issues_of_severity = [
                    issue for issue in quality_report.issues 
                    if issue.severity.value == severity
                ]
                if issues_of_severity:
                    self.stdout.write(f"  {severity.upper()} issues ({len(issues_of_severity)}):")
                    for issue in issues_of_severity[:3]:  # Show first 3
                        self.stdout.write(f"    - {issue.message}")
                        if issue.suggestion:
                            self.stdout.write(f"      Suggestion: {issue.suggestion}")
            
            return quality_report  # Return for remediation testing

    def test_remediation_system(self, workflow, admin_user):
        """Test quality remediation system"""
        
        self.stdout.write("\nTesting quality remediation system...")
        
        step_instance = workflow.step_instances.filter(status='in_progress').first()
        
        if not step_instance:
            self.stdout.write("No step available for remediation testing")
            return
        
        # Get a quality control
        quality_control = QualityControl.objects.filter(
            workflow_step=step_instance.workflow_step
        ).first()
        
        if not quality_control:
            self.stdout.write("No quality control found for remediation testing")
            return
        
        # Create a simulated quality report with various issues
        from domains.workflows.quality import QualityCheckReport, QualityCheckStatus
        
        quality_report = QualityCheckReport(
            check_id=str(quality_control.id),
            check_name=quality_control.name,
            status=QualityCheckStatus.FAILED,
            score=45,
            max_score=100
        )
        
        # Add test issues
        quality_report.issues = [
            QualityIssue(
                rule_id='completeness_invention_title',
                severity=QualityRuleSeverity.ERROR,
                message='Invention title is too short',
                suggestion='Provide a descriptive title of at least 10 characters',
                auto_fixable=False
            ),
            QualityIssue(
                rule_id='business_rule_prior_art',
                severity=QualityRuleSeverity.WARNING,
                message='Insufficient prior art references',
                suggestion='Add at least 3 prior art references',
                auto_fixable=False
            ),
            QualityIssue(
                rule_id='format_patent_number',
                severity=QualityRuleSeverity.ERROR,
                message='Invalid patent number format',
                suggestion='Use 7-8 digit format',
                auto_fixable=True
            ),
            QualityIssue(
                rule_id='critical_compliance_issue',
                severity=QualityRuleSeverity.CRITICAL,
                message='Critical compliance violation detected',
                suggestion='Immediate review required',
                auto_fixable=False
            )
        ]
        
        self.stdout.write(f"Created test quality report with {len(quality_report.issues)} issues")
        
        # Create remediation plan
        remediation_plan = remediation_engine.create_remediation_plan(
            quality_report, quality_control, step_instance
        )
        
        self.stdout.write(f"Created remediation plan with {len(remediation_plan.actions)} actions:")
        
        for i, action in enumerate(remediation_plan.actions):
            self.stdout.write(f"  {i+1}. {action.action_type.value} (Priority: {action.priority})")
            self.stdout.write(f"     Description: {action.description}")
            self.stdout.write(f"     Auto-execute: {action.auto_execute}")
        
        # Execute remediation plan
        self.stdout.write("\nExecuting remediation plan...")
        
        result = remediation_engine.execute_remediation_plan(remediation_plan, admin_user)
        
        self.stdout.write(f"Remediation execution result:")
        self.stdout.write(f"  Status: {result['status']}")
        self.stdout.write(f"  Success: {result['success']}")
        self.stdout.write(f"  Actions executed: {result['actions_executed']}")
        
        # Show execution results
        for i, exec_result in enumerate(remediation_plan.execution_results):
            action_result = exec_result.get('result', {})
            self.stdout.write(f"  Action {i+1}: {action_result.get('success', False)}")
            if not action_result.get('success'):
                self.stdout.write(f"    Error: {action_result.get('error', 'Unknown error')}")

    def test_quality_analytics(self, admin_user):
        """Test quality analytics system"""
        
        self.stdout.write("\nTesting quality analytics system...")
        
        # Test quality overview
        overview = quality_analytics.get_quality_overview()
        
        self.stdout.write("Quality Overview:")
        self.stdout.write(f"  Period: {overview['period']['days']} days")
        self.stdout.write(f"  Total checks: {overview['overview']['total_checks']}")
        self.stdout.write(f"  Pass rate: {overview['overview']['pass_rate']:.1f}%")
        self.stdout.write(f"  Average score: {overview['overview']['average_score']}")
        
        # Show issue breakdown
        issues = overview['issues']
        self.stdout.write("Issue Breakdown:")
        for severity, count in issues.items():
            self.stdout.write(f"  {severity.title()}: {count}")
        
        # Show quality distribution
        distribution = overview['quality_distribution']
        self.stdout.write("Quality Score Distribution:")
        for category, count in distribution.items():
            self.stdout.write(f"  {category.title()}: {count}")
        
        # Show top failing controls
        top_failing = overview['top_failing_controls']
        if top_failing:
            self.stdout.write("Top Failing Controls:")
            for control in top_failing[:3]:
                self.stdout.write(f"  {control['control_name']}: {control['failure_count']} failures")
        
        # Test user quality metrics
        user_metrics = quality_analytics.get_user_quality_metrics(admin_user)
        
        self.stdout.write(f"\nUser Quality Metrics for {admin_user.get_full_name()}:")
        self.stdout.write(f"  Total checks: {user_metrics.total_checks}")
        self.stdout.write(f"  Pass rate: {user_metrics.pass_rate:.1f}%")
        self.stdout.write(f"  Average score: {user_metrics.average_score}")
        self.stdout.write(f"  Improvement trend: {user_metrics.improvement_trend:+.1f}%")
        
        # Test quality dashboard
        dashboard = quality_analytics.get_quality_dashboard_data(admin_user)
        
        self.stdout.write("\nQuality Dashboard:")
        self.stdout.write(f"  Alerts: {len(dashboard['alerts'])}")
        self.stdout.write(f"  Recommendations: {len(dashboard['recommendations'])}")
        self.stdout.write(f"  Pending reviews: {len(dashboard['pending_reviews'])}")
        
        # Show alerts and recommendations
        if dashboard['alerts']:
            self.stdout.write("Active Alerts:")
            for alert in dashboard['alerts']:
                self.stdout.write(f"  [{alert['type'].upper()}] {alert['message']}")
        
        if dashboard['recommendations']:
            self.stdout.write("Recommendations:")
            for rec in dashboard['recommendations']:
                self.stdout.write(f"  - {rec}")

        self.stdout.write("\nQuality analytics testing completed!")