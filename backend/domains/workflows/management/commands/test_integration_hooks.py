"""
Test Integration Hooks System
Tests external API calls, notifications, and third-party integrations
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.conf import settings

from domains.workflows.models import WorkflowTemplate, WorkflowInstance, WorkflowStep
from domains.workflows.services import workflow_engine
from domains.workflows.integrations import (
    integration_hooks_manager, IntegrationHook, HookTrigger, IntegrationType
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Test workflow integration hooks system'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--setup-hooks',
            action='store_true',
            help='Setup test integration hooks'
        )
        parser.add_argument(
            '--test-workflow',
            action='store_true',
            help='Test workflow with integration hooks'
        )
        parser.add_argument(
            '--test-all',
            action='store_true',
            help='Run all integration hook tests'
        )
    
    def handle(self, *args, **options):
        if options['setup_hooks'] or options['test_all']:
            self.setup_test_hooks()
        
        if options['test_workflow'] or options['test_all']:
            self.test_workflow_with_hooks()
        
        if not any([options['setup_hooks'], options['test_workflow'], options['test_all']]):
            self.stdout.write("Use --setup-hooks, --test-workflow, or --test-all")
    
    def setup_test_hooks(self):
        """Setup test integration hooks"""
        self.stdout.write("Setting up test integration hooks...")
        
        # Test Email Notification Hook
        email_hook = IntegrationHook(
            id='test_email_notification',
            name='Test Email Notification',
            trigger=HookTrigger.WORKFLOW_COMPLETED,
            integration_type=IntegrationType.EMAIL_NOTIFICATION,
            config={
                'template': 'workflows/email/completion_notification.html',
                'subject': 'Workflow Completed: {workflow_instance.name}',
                'notify_assignee': True,
                'notify_creator': True,
                'additional_recipients': ['admin@patentplatform.com']
            },
            enabled=True,
            conditions=None,
            created_by='test_system'
        )
        integration_hooks_manager.register_hook(email_hook)
        
        # Test Slack Webhook Hook
        slack_hook = IntegrationHook(
            id='test_slack_webhook',
            name='Test Slack Webhook',
            trigger=HookTrigger.QUALITY_CHECK_FAILED,
            integration_type=IntegrationType.SLACK_WEBHOOK,
            config={
                'webhook_url': 'https://hooks.slack.com/services/TEST/TEST/TEST',
                'custom_text': '⚠️ Quality check failed for workflow: {workflow_instance.name}'
            },
            enabled=True,
            conditions={
                'quality_score': {'op': 'lt', 'value': 70}
            },
            created_by='test_system'
        )
        integration_hooks_manager.register_hook(slack_hook)
        
        # Test External API Hook
        api_hook = IntegrationHook(
            id='test_external_api',
            name='Test External API Integration',
            trigger=HookTrigger.WORKFLOW_STARTED,
            integration_type=IntegrationType.EXTERNAL_API,
            config={
                'url': 'https://api.example.com/workflow-started',
                'method': 'POST',
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Source': 'Patent-Analytics-Platform'
                },
                'authentication': {
                    'type': 'api_key',
                    'header': 'X-API-Key',
                    'key': 'test-api-key-12345'
                }
            },
            enabled=True,
            created_by='test_system'
        )
        integration_hooks_manager.register_hook(api_hook)
        
        # Test Custom Webhook Hook for Step Completion
        step_webhook = IntegrationHook(
            id='test_step_webhook',
            name='Test Step Completion Webhook',
            trigger=HookTrigger.STEP_COMPLETED,
            integration_type=IntegrationType.CUSTOM_WEBHOOK,
            config={
                'url': 'https://webhook.example.com/step-completed',
                'headers': {
                    'Authorization': 'Bearer test-token',
                    'X-Webhook-Source': 'patent-platform'
                }
            },
            enabled=True,
            conditions={
                'step_instance.workflow_step.name': 'Legal Review'
            },
            created_by='test_system'
        )
        integration_hooks_manager.register_hook(step_webhook)
        
        # Test Microsoft Teams Hook
        teams_hook = IntegrationHook(
            id='test_teams_webhook',
            name='Test Teams Notification',
            trigger=HookTrigger.DEADLINE_APPROACHING,
            integration_type=IntegrationType.TEAMS_WEBHOOK,
            config={
                'webhook_url': 'https://outlook.office.com/webhook/TEST/TEST'
            },
            enabled=True,
            created_by='test_system'
        )
        integration_hooks_manager.register_hook(teams_hook)
        
        self.stdout.write(
            self.style.SUCCESS(f"✅ Setup {len(integration_hooks_manager._hooks)} integration hooks")
        )
        
        # List all hooks
        for hook in integration_hooks_manager._hooks:
            self.stdout.write(
                f"  - {hook.name} ({hook.trigger.value} → {hook.integration_type.value})"
            )
    
    def test_workflow_with_hooks(self):
        """Test workflow execution with integration hooks"""
        self.stdout.write("Testing workflow with integration hooks...")
        
        try:
            # Get or create admin user
            try:
                admin_user = User.objects.get(email='admin@patentplatform.com')
                created = False
            except User.DoesNotExist:
                admin_user = User.objects.create_user(
                    email='admin@patentplatform.com',
                    first_name='Admin',
                    last_name='User',
                    role='admin',
                    status='active'
                )
                created = True
            
            if created:
                admin_user.set_password('admin123')
                admin_user.save()
                self.stdout.write("Created admin user")
            
            # Get test workflow template
            try:
                template = WorkflowTemplate.objects.get(name='Dynamic Patent Analysis Workflow')
            except WorkflowTemplate.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING("Test workflow template not found. Creating basic template...")
                )
                template = self.create_test_template(admin_user)
            
            # Create a mock content object (using the admin user as a stand-in)
            mock_project = admin_user  # Simplified for testing
            
            # Test 1: Create workflow (should trigger workflow_created hooks)
            self.stdout.write("\n🔄 Testing workflow creation hooks...")
            workflow_instance = workflow_engine.create_workflow_instance(
                template_id=str(template.id),
                target_object=mock_project,
                user=admin_user,
                name="Test Integration Hooks Workflow",
                priority='high',
                tags=['test', 'integration', 'hooks']
            )
            
            self.stdout.write(
                f"✅ Created workflow instance: {workflow_instance.name}"
            )
            
            # Test 2: Start workflow (should trigger workflow_started hooks)
            self.stdout.write("\n🚀 Testing workflow start hooks...")
            workflow_engine.start_workflow(workflow_instance, admin_user)
            
            self.stdout.write(
                f"✅ Started workflow, status: {workflow_instance.status}"
            )
            
            # Test 3: Complete a step (should trigger step_completed hooks)
            self.stdout.write("\n📝 Testing step completion hooks...")
            in_progress_steps = workflow_instance.step_instances.filter(
                status='in_progress'
            ).first()
            
            if in_progress_steps:
                workflow_engine.complete_step(
                    in_progress_steps, 
                    admin_user,
                    output_data={'test': 'data', 'quality_notes': 'Test completion'},
                    quality_score=85
                )
                
                self.stdout.write(
                    f"✅ Completed step: {in_progress_steps.workflow_step.name}"
                )
            else:
                self.stdout.write(
                    self.style.WARNING("No in-progress steps found to complete")
                )
            
            # Test 4: Trigger deadline hooks manually
            self.stdout.write("\n⏰ Testing deadline hooks...")
            from domains.workflows.integrations import trigger_deadline_hooks
            trigger_deadline_hooks(workflow_instance, missed=False)
            
            self.stdout.write("✅ Triggered deadline approaching hooks")
            
            # Test 5: Trigger quality check hooks manually
            self.stdout.write("\n🔍 Testing quality check hooks...")
            from domains.workflows.integrations import trigger_quality_check_hooks
            if in_progress_steps:
                trigger_quality_check_hooks(in_progress_steps, passed=False, score=65.0)
                self.stdout.write("✅ Triggered quality check failed hooks")
            
            self.stdout.write(
                self.style.SUCCESS("\n🎉 Integration hooks testing completed!")
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f"❌ Error testing integration hooks: {e}")
            )
            import traceback
            self.stdout.write(traceback.format_exc())
    
    def create_test_template(self, user: User) -> WorkflowTemplate:
        """Create a basic test template for integration testing"""
        
        template = WorkflowTemplate.objects.create(
            name='Integration Test Workflow',
            description='Test workflow for integration hooks',
            category='Testing',
            version='1.0.0',
            is_active=True,
            require_sequential=False,
            auto_assign=True,
            created_by=user
        )
        
        # Add basic steps
        step1 = WorkflowStep.objects.create(
            workflow_template=template,
            name='Initial Review',
            description='Initial review step for testing',
            step_type='manual',
            order=1,
            is_required=True,
            is_parallel=False,
            assigned_role='analyst',
            created_by=user
        )
        
        step2 = WorkflowStep.objects.create(
            workflow_template=template,
            name='Legal Review',
            description='Legal review step for testing hooks',
            step_type='approval',
            order=2,
            is_required=True,
            is_parallel=False,
            assigned_role='attorney',
            created_by=user
        )
        
        step2.depends_on.add(step1)
        
        return template