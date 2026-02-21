"""
Dynamic Migration Generation Service
Automatically generates and applies Django migrations for dynamic patent fields
"""

import os
import re
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from django.db import connection, transaction
from django.core.management import call_command
from django.conf import settings
from django.apps import apps

from .models import DynamicPatentField, PatentRecord

logger = logging.getLogger(__name__)


class DynamicMigrationService:
    """
    Service for generating and applying Django migrations for dynamic patent fields
    """
    
    def __init__(self):
        self.app_name = 'analytics'
        self.migrations_dir = os.path.join(
            settings.BASE_DIR, 
            'domains', 
            'analytics', 
            'migrations'
        )
        
    def generate_migration_for_fields(self, field_definitions: List[DynamicPatentField]) -> Optional[str]:
        """
        Generate a Django migration file for dynamic fields
        
        Args:
            field_definitions: List of DynamicPatentField instances to include
            
        Returns:
            Migration file name if successful, None otherwise
        """
        try:
            with transaction.atomic():
                # Create migration content
                migration_content = self._build_migration_content(field_definitions)
                
                # Generate unique migration name
                migration_name = self._get_next_migration_name()
                migration_file_path = os.path.join(self.migrations_dir, f"{migration_name}.py")
                
                # Write migration file
                with open(migration_file_path, 'w', encoding='utf-8') as f:
                    f.write(migration_content)
                
                # Update DynamicPatentField records
                for field_def in field_definitions:
                    field_def.migration_name = migration_name
                    field_def.migration_applied = False
                    field_def.save()
                
                logger.info(f"Generated migration file: {migration_name}")
                return migration_name
                
        except Exception as e:
            logger.error(f"Error generating migration: {e}")
            return None
    
    def apply_migration(self, migration_name: str) -> bool:
        """
        Apply a generated migration
        
        Args:
            migration_name: Name of the migration to apply
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Apply the specific migration using Django's built-in mechanism
            # Django handles SQLite foreign key constraints internally
            call_command('migrate', self.app_name, migration_name, verbosity=0)
            
            # Mark fields as migrated
            fields_updated = DynamicPatentField.objects.filter(
                migration_name=migration_name
            ).update(migration_applied=True)
            
            logger.info(f"Applied migration {migration_name}, updated {fields_updated} fields")
            return True
            
        except Exception as e:
            logger.error(f"Error applying migration {migration_name}: {e}")
            return False
    
    def generate_and_apply_migration(self, field_definitions: List[DynamicPatentField]) -> Tuple[bool, Optional[str]]:
        """
        Generate and immediately apply migration for dynamic fields
        
        Args:
            field_definitions: List of fields to migrate
            
        Returns:
            Tuple of (success, migration_name)
        """
        migration_name = self.generate_migration_for_fields(field_definitions)
        if not migration_name:
            return False, None
            
        success = self.apply_migration(migration_name)
        return success, migration_name
    
    def check_field_exists_in_db(self, field_name: str) -> bool:
        """
        Check if a field already exists in the PatentRecord table
        
        Args:
            field_name: Name of the field to check
            
        Returns:
            True if field exists, False otherwise
        """
        try:
            with connection.cursor() as cursor:
                # Use PRAGMA for SQLite, information_schema for PostgreSQL/MySQL
                if connection.vendor == 'sqlite':
                    cursor.execute("PRAGMA table_info(analytics_patent_records)")
                    columns = [row[1] for row in cursor.fetchall()]  # Column names are in index 1
                    return field_name in columns
                else:
                    # For PostgreSQL/MySQL
                    cursor.execute("""
                        SELECT COUNT(*) 
                        FROM information_schema.columns 
                        WHERE table_name = 'analytics_patent_records' 
                        AND column_name = %s
                    """, [field_name])
                    count = cursor.fetchone()[0]
                    return count > 0
                
        except Exception as e:
            logger.error(f"Error checking field existence: {e}")
            return False
    
    def get_pending_fields(self) -> List[DynamicPatentField]:
        """
        Get dynamic fields that need migration
        
        Returns:
            List of DynamicPatentField instances pending migration
        """
        return list(DynamicPatentField.objects.filter(
            is_active=True,
            migration_applied=False
        ))
    
    def auto_migrate_pending_fields(self) -> Dict[str, any]:
        """
        Automatically migrate all pending dynamic fields
        
        Returns:
            Dictionary with migration results
        """
        pending_fields = self.get_pending_fields()
        
        if not pending_fields:
            return {
                'success': True,
                'message': 'No pending fields to migrate',
                'fields_migrated': 0,
                'migration_name': None
            }
        
        # Filter out fields that already exist in database
        fields_to_migrate = []
        for field in pending_fields:
            if not self.check_field_exists_in_db(field.field_name):
                fields_to_migrate.append(field)
            else:
                # Mark as migrated if already exists
                field.migration_applied = True
                field.save()
                logger.info(f"Field {field.field_name} already exists, marked as migrated")
        
        if not fields_to_migrate:
            return {
                'success': True,
                'message': 'All pending fields already exist in database',
                'fields_migrated': 0,
                'migration_name': None
            }
        
        success, migration_name = self.generate_and_apply_migration(fields_to_migrate)
        
        return {
            'success': success,
            'message': f"Successfully migrated {len(fields_to_migrate)} fields" if success else "Migration failed",
            'fields_migrated': len(fields_to_migrate) if success else 0,
            'migration_name': migration_name,
            'field_names': [f.field_name for f in fields_to_migrate]
        }
    
    def _build_migration_content(self, field_definitions: List[DynamicPatentField]) -> str:
        """
        Build the content of a Django migration file
        
        Args:
            field_definitions: List of fields to include in migration
            
        Returns:
            Complete migration file content as string
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M')
        
        # Build field operations
        operations = []
        for field_def in field_definitions:
            field_code = self._generate_field_code(field_def)
            operations.append(f"""
        migrations.AddField(
            model_name='patentrecord',
            name='{field_def.field_name}',
            field={field_code},
        ),""")
        
        migration_content = f"""# Generated by Intelligent Column Mapping System on {datetime.now().isoformat()}

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '{self._get_last_migration_name()}'),
    ]

    operations = [{''.join(operations)}
    ]
"""
        
        return migration_content
    
    def _generate_field_code(self, field_def: DynamicPatentField) -> str:
        """
        Generate Django field code for a dynamic field
        
        Args:
            field_def: DynamicPatentField instance
            
        Returns:
            Django field code as string
        """
        field_type = field_def.field_type
        params = field_def.field_params or {}
        
        # Build parameter parts
        param_parts = []
        
        # Add field-specific parameters first
        if field_type == 'CharField':
            max_length = params.get('max_length', 255)
            param_parts.append(f"max_length={max_length}")
        elif field_type == 'DecimalField':
            max_digits = params.get('max_digits', 10)
            decimal_places = params.get('decimal_places', 2)
            param_parts.append(f"max_digits={max_digits}")
            param_parts.append(f"decimal_places={decimal_places}")
        elif field_type == 'JSONField':
            param_parts.append("default=dict")
        
        # Add standard parameters
        param_parts.append("null=True")
        param_parts.append("blank=True")
        # Escape quotes properly in help text
        help_text = field_def.display_name.replace("'", "\\'")
        param_parts.append(f"help_text='Dynamic field: {help_text}'")
        
        # Add any custom parameters (excluding ones we already handled)
        skip_params = {'max_length', 'max_digits', 'decimal_places', 'default', 'null', 'blank', 'help_text'}
        for key, value in params.items():
            if key not in skip_params:
                if isinstance(value, str):
                    param_parts.append(f"{key}='{value}'")
                elif isinstance(value, bool):
                    param_parts.append(f"{key}={str(value)}")
                elif isinstance(value, (int, float)):
                    param_parts.append(f"{key}={value}")
                else:
                    param_parts.append(f"{key}={repr(value)}")
        
        param_string = ', '.join(param_parts)
        
        # Generate field code
        return f"models.{field_type}({param_string})"
    
    def _get_next_migration_name(self) -> str:
        """
        Generate the next migration name in sequence
        
        Returns:
            Migration name in format: 0001_add_dynamic_fields_TIMESTAMP
        """
        # Get existing migration numbers
        migration_files = []
        if os.path.exists(self.migrations_dir):
            for filename in os.listdir(self.migrations_dir):
                if filename.endswith('.py') and re.match(r'^\d{4}_', filename):
                    migration_files.append(filename)
        
        # Determine next number
        if migration_files:
            numbers = []
            for filename in migration_files:
                match = re.match(r'^(\d{4})_', filename)
                if match:
                    numbers.append(int(match.group(1)))
            next_number = max(numbers) + 1
        else:
            next_number = 1
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        return f"{next_number:04d}_add_dynamic_fields_{timestamp}"
    
    def _get_last_migration_name(self) -> str:
        """
        Get the name of the last migration (for dependency)
        
        Returns:
            Last migration name without .py extension
        """
        migration_files = []
        if os.path.exists(self.migrations_dir):
            for filename in os.listdir(self.migrations_dir):
                if filename.endswith('.py') and re.match(r'^\d{4}_', filename):
                    migration_files.append(filename[:-3])  # Remove .py
        
        if migration_files:
            migration_files.sort()
            return migration_files[-1]
        else:
            return '0001_initial'
    
    def rollback_migration(self, migration_name: str) -> bool:
        """
        Rollback a specific migration (for testing/emergency use)
        
        Args:
            migration_name: Name of migration to rollback
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Get previous migration
            migration_files = []
            if os.path.exists(self.migrations_dir):
                for filename in os.listdir(self.migrations_dir):
                    if filename.endswith('.py') and re.match(r'^\d{4}_', filename):
                        migration_files.append(filename[:-3])
            
            migration_files.sort()
            current_index = migration_files.index(migration_name)
            
            if current_index > 0:
                previous_migration = migration_files[current_index - 1]
                call_command('migrate', self.app_name, previous_migration, verbosity=0)
                
                # Mark fields as not migrated
                DynamicPatentField.objects.filter(
                    migration_name=migration_name
                ).update(migration_applied=False)
                
                logger.info(f"Rolled back migration {migration_name}")
                return True
            else:
                logger.warning(f"Cannot rollback {migration_name}: no previous migration")
                return False
                
        except Exception as e:
            logger.error(f"Error rolling back migration {migration_name}: {e}")
            return False
    
    def cleanup_unused_migrations(self) -> Dict[str, any]:
        """
        Clean up migration files for fields that are no longer active
        
        Returns:
            Cleanup results
        """
        try:
            # Get inactive dynamic fields
            inactive_fields = DynamicPatentField.objects.filter(is_active=False)
            migrations_to_cleanup = set()
            
            for field in inactive_fields:
                if field.migration_name:
                    migrations_to_cleanup.add(field.migration_name)
            
            cleaned_count = 0
            for migration_name in migrations_to_cleanup:
                migration_file = os.path.join(self.migrations_dir, f"{migration_name}.py")
                if os.path.exists(migration_file):
                    # Instead of deleting, rename with .disabled suffix
                    disabled_file = f"{migration_file}.disabled"
                    os.rename(migration_file, disabled_file)
                    cleaned_count += 1
                    logger.info(f"Disabled migration file: {migration_name}")
            
            return {
                'success': True,
                'cleaned_migrations': cleaned_count,
                'disabled_files': list(migrations_to_cleanup)
            }
            
        except Exception as e:
            logger.error(f"Error cleaning up migrations: {e}")
            return {
                'success': False,
                'error': str(e),
                'cleaned_migrations': 0
            }


# Global service instance
dynamic_migration_service = DynamicMigrationService()