"""
Test Workflow Template Versioning
Tests version management, migration, and evolution
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from domains.workflows.models import WorkflowTemplate, WorkflowStep, WorkflowInstance
from domains.workflows.versioning import (
    versioning_manager,
    VersionChangeType,
    MigrationStrategy,
    WorkflowTemplateVersion
)
from domains.workflows.services import workflow_engine

User = get_user_model()


class Command(BaseCommand):
    help = 'Test workflow template versioning system'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--create-test-template',
            action='store_true',
            help='Create test template for versioning'
        )
        parser.add_argument(
            '--test-versioning',
            action='store_true',
            help='Test version creation and management'
        )
        parser.add_argument(
            '--test-migration',
            action='store_true',
            help='Test workflow instance migration'
        )
        parser.add_argument(
            '--test-all',
            action='store_true',
            help='Run all versioning tests'
        )
    
    def handle(self, *args, **options):
        if options['create_test_template'] or options['test_all']:
            self.create_test_template()
        
        if options['test_versioning'] or options['test_all']:
            self.test_versioning()
        
        if options['test_migration'] or options['test_all']:
            self.test_migration()
        
        if not any([options['create_test_template'], options['test_versioning'], 
                   options['test_migration'], options['test_all']]):
            self.stdout.write("Use --create-test-template, --test-versioning, --test-migration, or --test-all")
    
    def create_test_template(self):
        """Create a test template for versioning"""
        self.stdout.write("Creating test template for versioning...")
        
        try:
            # Get admin user
            admin_user = User.objects.get(email='admin@patentplatform.com')
        except User.DoesNotExist:
            admin_user = User.objects.create_user(
                email='admin@patentplatform.com',
                first_name='Admin',
                last_name='User',
                role='admin',
                status='active'
            )
        
        # Create or get template
        template, created = WorkflowTemplate.objects.get_or_create(
            name="Versioning Test Template",
            defaults={
                'description': 'Template for testing versioning features',
                'category': 'Testing',
                'version': '1.0.0',
                'is_active': True,
                'require_sequential': True,
                'auto_assign': True,
                'created_by': admin_user
            }
        )
        
        if created or not template.steps.exists():
            # Create initial steps
            step1 = WorkflowStep.objects.create(
                workflow_template=template,
                name='Initial Review',
                description='Initial review of the request',
                step_type='manual',
                order=1,
                is_required=True,
                assigned_role='analyst',
                created_by=admin_user
            )
            
            step2 = WorkflowStep.objects.create(
                workflow_template=template,
                name='Technical Analysis',
                description='Technical analysis and evaluation',
                step_type='manual',
                order=2,
                is_required=True,
                assigned_role='analyst',
                created_by=admin_user
            )
            
            step3 = WorkflowStep.objects.create(
                workflow_template=template,
                name='Final Approval',
                description='Final approval step',
                step_type='approval',
                order=3,
                is_required=True,
                assigned_role='attorney',
                created_by=admin_user
            )
            
            step2.depends_on.add(step1)
            step3.depends_on.add(step2)
            
            self.stdout.write(f"  Created template with {template.steps.count()} steps")
        
        # Create initial version
        try:
            initial_version = versioning_manager.create_new_version(
                template=template,
                version_type=VersionChangeType.MAJOR,
                user=admin_user,
                change_summary="Initial template version",
                release_notes="First version of the versioning test template"
            )
            self.stdout.write(f"  Created initial version: {initial_version.version_number}")
        except Exception as e:
            # Version might already exist
            self.stdout.write(f"  Initial version exists or error: {e}")
        
        self.stdout.write(self.style.SUCCESS("✅ Test template ready for versioning"))
    
    def test_versioning(self):
        """Test version creation and management"""
        self.stdout.write("\n📋 Testing version creation...")
        
        try:
            admin_user = User.objects.get(email='admin@patentplatform.com')
            template = WorkflowTemplate.objects.get(name="Versioning Test Template")
            
            # Test 1: Create minor version (add new step)
            self.stdout.write("  Test 1: Creating minor version (new step)...")
            
            # Add a new step
            new_step = WorkflowStep.objects.create(
                workflow_template=template,
                name='Quality Check',
                description='Additional quality verification step',
                step_type='review',
                order=2.5,  # Between technical analysis and final approval
                is_required=False,
                assigned_role='supervisor',
                created_by=admin_user
            )
            
            minor_version = versioning_manager.create_new_version(
                template=template,
                version_type=VersionChangeType.MINOR,
                user=admin_user,
                change_summary="Added quality check step",
                release_notes="Added optional quality verification step for better compliance",
                migration_strategy=MigrationStrategy.OPTIONAL
            )
            
            self.stdout.write(f"    ✅ Created minor version: {minor_version.version_number}")
            self.stdout.write(f"    Change summary: {minor_version.change_summary}")
            
            # Test 2: Create patch version (modify step)
            self.stdout.write("  Test 2: Creating patch version (modify step)...")
            
            # Modify existing step
            tech_step = template.steps.get(name='Technical Analysis')
            tech_step.description = "Enhanced technical analysis with additional validation"
            tech_step.save()
            
            patch_version = versioning_manager.create_new_version(
                template=template,
                version_type=VersionChangeType.PATCH,
                user=admin_user,
                change_summary="Updated technical analysis step description",
                release_notes="Clarified technical analysis requirements"
            )
            
            self.stdout.write(f"    ✅ Created patch version: {patch_version.version_number}")
            
            # Test 3: Create major version (breaking change)
            self.stdout.write("  Test 3: Creating major version (breaking change)...")
            
            # Remove a required step (breaking change)
            initial_step = template.steps.get(name='Initial Review')
            initial_step.delete()
            
            major_version = versioning_manager.create_new_version(
                template=template,
                version_type=VersionChangeType.MAJOR,
                user=admin_user,
                change_summary="Removed initial review step",
                release_notes="Streamlined process by removing redundant initial review",
                migration_strategy=MigrationStrategy.REQUIRED
            )
            
            self.stdout.write(f"    ✅ Created major version: {major_version.version_number}")
            self.stdout.write(f"    Breaking changes: {major_version.breaking_changes}")
            
            # Test 4: Get version history
            self.stdout.write("  Test 4: Getting version history...")
            
            versions = versioning_manager.get_version_history(template)
            self.stdout.write(f"    Template has {len(versions)} versions:")
            
            for v in versions:
                latest_marker = " (LATEST)" if v.is_latest else ""
                self.stdout.write(f"      - v{v.version_number}{latest_marker}: {v.change_summary}")
            
            # Test 5: Compare versions
            if len(versions) >= 2:
                self.stdout.write("  Test 5: Comparing versions...")
                
                comparison = versioning_manager.compare_versions(versions[1], versions[0])
                self.stdout.write(f"    Comparing v{versions[1].version_number} → v{versions[0].version_number}")
                self.stdout.write(f"    Changes found: {comparison['change_count']}")
                self.stdout.write(f"    Has breaking changes: {comparison['has_breaking_changes']}")
            
            self.stdout.write(self.style.SUCCESS("✅ Version management tests completed"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error in versioning test: {e}"))
            import traceback
            self.stdout.write(traceback.format_exc())
    
    def test_migration(self):
        """Test workflow instance migration"""
        self.stdout.write("\n🔄 Testing workflow migration...")
        
        try:
            admin_user = User.objects.get(email='admin@patentplatform.com')
            template = WorkflowTemplate.objects.get(name="Versioning Test Template")
            
            # Create test workflow instance using an older version
            self.stdout.write("  Creating test workflow instance...")
            
            # Create a mock project (using admin user as target for simplicity)
            mock_target = admin_user
            
            workflow_instance = workflow_engine.create_workflow_instance(
                template_id=str(template.id),
                target_object=mock_target,
                user=admin_user,
                name="Migration Test Workflow",
                priority='medium'
            )
            
            # Manually set to older version
            workflow_instance.template_version = "1.0.0"
            workflow_instance.save()
            
            self.stdout.write(f"    Created workflow: {workflow_instance.name}")
            self.stdout.write(f"    Current version: {workflow_instance.template_version}")
            
            # Get latest version to migrate to
            latest_version = WorkflowTemplateVersion.objects.filter(
                workflow_template=template,
                is_latest=True
            ).first()
            
            if latest_version:
                self.stdout.write(f"    Target version: {latest_version.version_number}")
                
                # Test migration
                self.stdout.write("  Testing migration...")
                
                success, messages = versioning_manager.migrate_workflow_instance(
                    workflow_instance=workflow_instance,
                    target_version=latest_version,
                    user=admin_user,
                    force=False
                )
                
                self.stdout.write(f"    Migration success: {success}")
                for message in messages:
                    self.stdout.write(f"    - {message}")
                
                if success:
                    workflow_instance.refresh_from_db()
                    self.stdout.write(f"    New version: {workflow_instance.template_version}")
                
                # Test rollback
                self.stdout.write("  Testing template rollback...")
                
                # Get an older version
                older_versions = WorkflowTemplateVersion.objects.filter(
                    workflow_template=template,
                    is_latest=False
                ).order_by('-created_at')
                
                if older_versions.exists():
                    rollback_version = older_versions.first()
                    self.stdout.write(f"    Rolling back to: {rollback_version.version_number}")
                    
                    rollback_success = versioning_manager.rollback_version(
                        template=template,
                        target_version=rollback_version,
                        user=admin_user
                    )
                    
                    if rollback_success:
                        template.refresh_from_db()
                        self.stdout.write(f"    ✅ Rollback successful, template now at: {template.version}")
                    else:
                        self.stdout.write("    ❌ Rollback failed")
                
            else:
                self.stdout.write("    No versions found for migration test")
            
            self.stdout.write(self.style.SUCCESS("✅ Migration tests completed"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Error in migration test: {e}"))
            import traceback
            self.stdout.write(traceback.format_exc())