"""
Test Bulk Operations
Tests bulk workflow operations for efficiency and scalability
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from domains.projects.models import Project, ProjectStatus
from domains.workflows.models import WorkflowTemplate, WorkflowInstance, WorkflowInstanceStatus
from domains.workflows.bulk_operations import (
    bulk_operations_manager,
    BulkOperationType,
    BulkOperationRequest,
    bulk_create_workflows_for_projects,
    bulk_start_workflows,
    bulk_update_workflow_assignments,
    bulk_apply_template_to_projects
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Test workflow bulk operations'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--create-test-data',
            action='store_true',
            help='Create test projects and templates'
        )
        parser.add_argument(
            '--test-bulk-create',
            action='store_true',
            help='Test bulk workflow creation'
        )
        parser.add_argument(
            '--test-bulk-start',
            action='store_true',
            help='Test bulk workflow start'
        )
        parser.add_argument(
            '--test-bulk-update',
            action='store_true',
            help='Test bulk workflow updates'
        )
        parser.add_argument(
            '--test-all',
            action='store_true',
            help='Run all bulk operation tests'
        )
    
    def handle(self, *args, **options):
        if options['create_test_data'] or options['test_all']:
            self.create_test_data()
        
        if options['test_bulk_create'] or options['test_all']:
            self.test_bulk_create()
        
        if options['test_bulk_start'] or options['test_all']:
            self.test_bulk_start()
        
        if options['test_bulk_update'] or options['test_all']:
            self.test_bulk_update()
        
        if not any([options['create_test_data'], options['test_bulk_create'], 
                   options['test_bulk_start'], options['test_bulk_update'], 
                   options['test_all']]):
            self.stdout.write("Use --create-test-data, --test-bulk-create, --test-bulk-start, --test-bulk-update, or --test-all")
    
    def create_test_data(self):
        """Create test projects and workflow templates"""
        self.stdout.write("Creating test data...")
        
        # Get or create admin user
        try:
            admin_user = User.objects.get(email='admin@patentplatform.com')
        except User.DoesNotExist:
            admin_user = User.objects.create_user(
                email='admin@patentplatform.com',
                first_name='Admin',
                last_name='User',
                role='admin',
                status='active'
            )
            admin_user.set_password('admin123')
            admin_user.save()
        
        # Create test projects
        projects = []
        for i in range(10):
            project, created = Project.objects.get_or_create(
                name=f"Bulk Test Project {i+1}",
                defaults={
                    'type': 'Patent Drafting - Utility',
                    'status': ProjectStatus.ACTIVE,
                    'priority': ['low', 'medium', 'high', 'urgent'][i % 4],
                    'created_by': admin_user,
                    'lead_attorney': admin_user,
                    'target_date': timezone.now().date() + timedelta(days=30 + i*5),
                    'budget': 10000 + i * 1000,
                    'tags': ['bulk-test', f'batch-{i//3 + 1}']
                }
            )
            projects.append(project)
            if created:
                self.stdout.write(f"  Created project: {project.name}")
        
        # Get or create workflow template
        template, created = WorkflowTemplate.objects.get_or_create(
            name="Bulk Operations Test Template",
            defaults={
                'description': 'Template for testing bulk operations',
                'category': 'Testing',
                'version': '1.0.0',
                'is_active': True,
                'require_sequential': False,
                'auto_assign': True,
                'created_by': admin_user
            }
        )
        
        if created:
            self.stdout.write(f"  Created template: {template.name}")
        
        self.stdout.write(self.style.SUCCESS(f"✅ Test data ready: {len(projects)} projects"))
    
    def test_bulk_create(self):
        """Test bulk workflow creation"""
        self.stdout.write("\n🔄 Testing bulk workflow creation...")
        
        try:
            # Get test data
            admin_user = User.objects.get(email='admin@patentplatform.com')
            template = WorkflowTemplate.objects.get(name="Bulk Operations Test Template")
            projects = Project.objects.filter(name__startswith="Bulk Test Project")[:5]
            
            self.stdout.write(f"  Creating workflows for {projects.count()} projects...")
            
            # Execute bulk creation
            result = bulk_create_workflows_for_projects(
                projects=list(projects),
                template=template,
                user=admin_user,
                auto_start=False,
                priority='high',
                tags=['bulk-created', 'test']
            )
            
            self.stdout.write(f"  Status: {result.status.value}")
            self.stdout.write(f"  Total items: {result.total_items}")
            self.stdout.write(f"  Successful: {result.successful_items}")
            self.stdout.write(f"  Failed: {result.failed_items}")
            self.stdout.write(f"  Execution time: {result.execution_time:.2f}s")
            
            if result.successful_items > 0:
                self.stdout.write(self.style.SUCCESS(f"✅ Successfully created {result.successful_items} workflows"))
                
                # Show created workflows
                for res in result.results[:3]:
                    if res.get('status') == 'created':
                        self.stdout.write(f"    - Workflow {res['workflow_id']} for {res['object']}")
            
            if result.failed_items > 0:
                self.stdout.write(self.style.WARNING(f"⚠️ Failed to create {result.failed_items} workflows"))
                for err in result.errors:
                    self.stdout.write(f"    - {err['object']}: {err['error']}")
        
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error in bulk create test: {e}"))
    
    def test_bulk_start(self):
        """Test bulk workflow start"""
        self.stdout.write("\n🚀 Testing bulk workflow start...")
        
        try:
            admin_user = User.objects.get(email='admin@patentplatform.com')
            
            # Get pending workflows
            pending_workflows = WorkflowInstance.objects.filter(
                status=WorkflowInstanceStatus.PENDING,
                name__contains="Bulk Test Project"
            )[:5]
            
            if not pending_workflows.exists():
                self.stdout.write(self.style.WARNING("No pending workflows found to start"))
                return
            
            self.stdout.write(f"  Starting {pending_workflows.count()} workflows...")
            
            # Execute bulk start
            result = bulk_start_workflows(
                workflows=list(pending_workflows),
                user=admin_user
            )
            
            self.stdout.write(f"  Status: {result.status.value}")
            self.stdout.write(f"  Total items: {result.total_items}")
            self.stdout.write(f"  Successful: {result.successful_items}")
            self.stdout.write(f"  Failed: {result.failed_items}")
            
            if result.successful_items > 0:
                self.stdout.write(self.style.SUCCESS(f"✅ Successfully started {result.successful_items} workflows"))
                
                for res in result.results[:3]:
                    if res.get('status') == 'started':
                        self.stdout.write(f"    - Started: {res['workflow_name']}")
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error in bulk start test: {e}"))
    
    def test_bulk_update(self):
        """Test bulk workflow updates"""
        self.stdout.write("\n✏️ Testing bulk workflow updates...")
        
        try:
            admin_user = User.objects.get(email='admin@patentplatform.com')
            
            # Create another user for assignment testing
            try:
                new_assignee = User.objects.get(email='analyst@patentplatform.com')
            except User.DoesNotExist:
                new_assignee = User.objects.create_user(
                    email='analyst@patentplatform.com',
                    first_name='Test',
                    last_name='Analyst',
                    role='analyst',
                    status='active'
                )
            
            # Get workflows to update
            workflows = WorkflowInstance.objects.filter(
                name__contains="Bulk Test Project"
            )[:5]
            
            if not workflows.exists():
                self.stdout.write(self.style.WARNING("No workflows found to update"))
                return
            
            # Test 1: Bulk update assignments
            self.stdout.write("  Testing bulk assignment update...")
            
            result = bulk_update_workflow_assignments(
                workflows=list(workflows),
                new_assignee=new_assignee,
                user=admin_user,
                update_unassigned_steps=True
            )
            
            self.stdout.write(f"    Assignments updated: {result.successful_items}/{result.total_items}")
            
            # Test 2: Bulk update priorities
            self.stdout.write("  Testing bulk priority update...")
            
            request = BulkOperationRequest(
                operation_type=BulkOperationType.UPDATE_PRIORITIES,
                target_objects=list(workflows),
                user=admin_user,
                parameters={'priority': 'urgent'}
            )
            
            result = bulk_operations_manager.execute_bulk_operation(request)
            
            self.stdout.write(f"    Priorities updated: {result.successful_items}/{result.total_items}")
            
            # Test 3: Bulk update due dates
            self.stdout.write("  Testing bulk due date update...")
            
            new_due_date = timezone.now().date() + timedelta(days=60)
            
            request = BulkOperationRequest(
                operation_type=BulkOperationType.UPDATE_DUE_DATES,
                target_objects=list(workflows),
                user=admin_user,
                parameters={'due_date': new_due_date},
                options={'update_step_due_dates': True}
            )
            
            result = bulk_operations_manager.execute_bulk_operation(request)
            
            self.stdout.write(f"    Due dates updated: {result.successful_items}/{result.total_items}")
            
            self.stdout.write(self.style.SUCCESS("✅ Bulk update tests completed"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error in bulk update test: {e}"))
    
    def test_bulk_clone(self):
        """Test bulk workflow cloning"""
        self.stdout.write("\n📋 Testing bulk workflow cloning...")
        
        try:
            admin_user = User.objects.get(email='admin@patentplatform.com')
            
            # Get workflows to clone
            workflows = WorkflowInstance.objects.filter(
                name__contains="Bulk Test Project"
            )[:3]
            
            if not workflows.exists():
                self.stdout.write(self.style.WARNING("No workflows found to clone"))
                return
            
            self.stdout.write(f"  Cloning {workflows.count()} workflows...")
            
            request = BulkOperationRequest(
                operation_type=BulkOperationType.CLONE_WORKFLOWS,
                target_objects=list(workflows),
                user=admin_user,
                options={'clone_suffix': ' (Bulk Clone)'}
            )
            
            result = bulk_operations_manager.execute_bulk_operation(request)
            
            self.stdout.write(f"  Status: {result.status.value}")
            self.stdout.write(f"  Cloned: {result.successful_items}/{result.total_items}")
            
            if result.successful_items > 0:
                self.stdout.write(self.style.SUCCESS(f"✅ Successfully cloned {result.successful_items} workflows"))
                
                for res in result.results[:3]:
                    if res.get('status') == 'cloned':
                        self.stdout.write(f"    - Cloned: {res['cloned_workflow_name']}")
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error in bulk clone test: {e}"))