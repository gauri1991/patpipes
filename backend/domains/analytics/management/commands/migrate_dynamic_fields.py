"""
Django management command to handle dynamic field migrations
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from domains.analytics.dynamic_migration_service import dynamic_migration_service
from domains.analytics.models import DynamicPatentField


class Command(BaseCommand):
    help = 'Manage dynamic patent field migrations'

    def add_arguments(self, parser):
        parser.add_argument(
            '--action',
            type=str,
            choices=['migrate', 'status', 'cleanup', 'rollback'],
            default='migrate',
            help='Action to perform: migrate (default), status, cleanup, or rollback'
        )
        parser.add_argument(
            '--migration-name',
            type=str,
            help='Specific migration name (for rollback action)'
        )
        parser.add_argument(
            '--auto-apply',
            action='store_true',
            help='Automatically apply generated migrations'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes'
        )

    def handle(self, *args, **options):
        action = options['action']
        
        try:
            if action == 'migrate':
                self.handle_migrate(options)
            elif action == 'status':
                self.handle_status(options)
            elif action == 'cleanup':
                self.handle_cleanup(options)
            elif action == 'rollback':
                self.handle_rollback(options)
                
        except Exception as e:
            raise CommandError(f'Error executing {action}: {e}')

    def handle_migrate(self, options):
        """Handle migration of pending dynamic fields"""
        self.stdout.write('🔍 Checking for pending dynamic fields...')
        
        pending_fields = dynamic_migration_service.get_pending_fields()
        
        if not pending_fields:
            self.stdout.write(
                self.style.SUCCESS('✅ No pending dynamic fields to migrate')
            )
            return
        
        self.stdout.write(f'📋 Found {len(pending_fields)} pending fields:')
        for field in pending_fields:
            self.stdout.write(f'   • {field.field_name} ({field.field_type})')
        
        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING('🔶 Dry run mode - no changes made')
            )
            return
        
        # Auto-migrate all pending fields
        with transaction.atomic():
            result = dynamic_migration_service.auto_migrate_pending_fields()
            
            if result['success']:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"✅ {result['message']}\n"
                        f"   📊 Fields migrated: {result['fields_migrated']}\n"
                        f"   📝 Migration: {result['migration_name'] or 'None'}"
                    )
                )
                
                if result['field_names']:
                    self.stdout.write('🎯 Migrated fields:')
                    for field_name in result['field_names']:
                        self.stdout.write(f'   • {field_name}')
            else:
                self.stdout.write(
                    self.style.ERROR(f"❌ Migration failed: {result['message']}")
                )

    def handle_status(self, options):
        """Show status of dynamic fields and migrations"""
        self.stdout.write('📊 Dynamic Fields Status Report')
        self.stdout.write('=' * 40)
        
        # Get field statistics
        total_fields = DynamicPatentField.objects.count()
        active_fields = DynamicPatentField.objects.filter(is_active=True).count()
        migrated_fields = DynamicPatentField.objects.filter(migration_applied=True).count()
        pending_fields = DynamicPatentField.objects.filter(
            is_active=True, 
            migration_applied=False
        ).count()
        
        self.stdout.write(f'📈 Total dynamic fields: {total_fields}')
        self.stdout.write(f'🟢 Active fields: {active_fields}')
        self.stdout.write(f'✅ Migrated fields: {migrated_fields}')
        self.stdout.write(f'⏳ Pending migration: {pending_fields}')
        
        # Show pending fields in detail
        if pending_fields > 0:
            self.stdout.write('\n📋 Pending Fields:')
            pending_field_objects = dynamic_migration_service.get_pending_fields()
            
            for field in pending_field_objects:
                datasets_count = field.datasets_using.count()
                self.stdout.write(
                    f'   • {field.field_name} ({field.field_type}) - '
                    f'Used by {datasets_count} datasets'
                )
        
        # Show recent migrations
        recent_migrations = DynamicPatentField.objects.filter(
            migration_applied=True,
            migration_name__isnull=False
        ).values('migration_name').distinct()[:5]
        
        if recent_migrations:
            self.stdout.write('\n📝 Recent Migrations:')
            for migration in recent_migrations:
                migration_name = migration['migration_name']
                field_count = DynamicPatentField.objects.filter(
                    migration_name=migration_name
                ).count()
                self.stdout.write(f'   • {migration_name} ({field_count} fields)')

    def handle_cleanup(self, options):
        """Clean up unused migration files"""
        self.stdout.write('🧹 Cleaning up unused migrations...')
        
        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING('🔶 Dry run mode - showing what would be cleaned')
            )
            
            inactive_fields = DynamicPatentField.objects.filter(is_active=False)
            migrations_to_cleanup = set()
            
            for field in inactive_fields:
                if field.migration_name:
                    migrations_to_cleanup.add(field.migration_name)
            
            if migrations_to_cleanup:
                self.stdout.write(f'Would clean up {len(migrations_to_cleanup)} migrations:')
                for migration_name in migrations_to_cleanup:
                    self.stdout.write(f'   • {migration_name}')
            else:
                self.stdout.write('No migrations to clean up')
            
            return
        
        result = dynamic_migration_service.cleanup_unused_migrations()
        
        if result['success']:
            self.stdout.write(
                self.style.SUCCESS(
                    f"✅ Cleaned up {result['cleaned_migrations']} migration files"
                )
            )
            
            if result['disabled_files']:
                self.stdout.write('🔒 Disabled migration files:')
                for filename in result['disabled_files']:
                    self.stdout.write(f'   • {filename}')
        else:
            self.stdout.write(
                self.style.ERROR(f"❌ Cleanup failed: {result.get('error', 'Unknown error')}")
            )

    def handle_rollback(self, options):
        """Rollback a specific migration"""
        migration_name = options.get('migration_name')
        
        if not migration_name:
            raise CommandError('--migration-name is required for rollback action')
        
        self.stdout.write(f'⏪ Rolling back migration: {migration_name}')
        
        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING('🔶 Dry run mode - no changes made')
            )
            return
        
        success = dynamic_migration_service.rollback_migration(migration_name)
        
        if success:
            self.stdout.write(
                self.style.SUCCESS(f'✅ Successfully rolled back migration: {migration_name}')
            )
        else:
            self.stdout.write(
                self.style.ERROR(f'❌ Failed to rollback migration: {migration_name}')
            )