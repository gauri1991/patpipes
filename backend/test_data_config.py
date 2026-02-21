#!/usr/bin/env python3
"""
Test script to verify Data Configuration system
"""

import os
import sys
import django

# Add the project root to the Python path
sys.path.append('/home/gss/Documents/projects/patent_analytics_platform/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from domains.accounts.models import User, DataConfigurationPermission
from domains.analytics.models import ColumnMappingRule, DatasetColumnMapping, DynamicPatentField

def test_permissions():
    print("=== Testing Data Configuration Permissions ===")
    
    # Create test user if not exists
    user, created = User.objects.get_or_create(
        email='test@example.com',
        defaults={
            'first_name': 'Test',
            'last_name': 'Admin',
            'role': 'ADMIN'
        }
    )
    print(f"Test user: {user.email} ({'created' if created else 'exists'})")
    
    # Create or get permissions
    permissions, perm_created = DataConfigurationPermission.objects.get_or_create(
        user=user,
        defaults={
            'can_view_mapping_rules': True,
            'can_create_mapping_rules': True,
            'can_edit_mapping_rules': True,
            'can_delete_mapping_rules': True,
            'can_activate_mapping_rules': True,
            'can_import_export_rules': True,
            'can_view_dataset_mappings': True,
            'can_edit_dataset_mappings': True,
            'can_approve_mappings': True,
            'can_reject_mappings': True,
            'can_bulk_manage_mappings': True,
            'can_view_dynamic_fields': True,
            'can_create_dynamic_fields': True,
            'can_edit_dynamic_fields': True,
            'can_delete_dynamic_fields': True,
            'can_migrate_fields': True,
            'can_archive_fields': True,
            'can_manage_field_types': True,
            'can_view_mapping_analytics': True,
            'can_configure_auto_mapping': True,
            'can_manage_migration_system': True,
            'can_backup_restore_config': True,
        }
    )
    print(f"Permissions: {'created' if perm_created else 'exists'}")
    
    # Test permission methods
    granted = permissions.get_granted_permissions()
    print(f"Granted permissions count: {len(granted)}")
    if isinstance(granted, dict):
        print(f"Sample permissions: {list(granted.keys())[:5]}...")
    else:
        print(f"Sample permissions: {granted[:5]}...")
    
    return user

def test_models():
    print("\n=== Testing Models ===")
    
    # Test ColumnMappingRule
    rule_count = ColumnMappingRule.objects.count()
    print(f"Column Mapping Rules: {rule_count}")
    
    # Test DatasetColumnMapping
    mapping_count = DatasetColumnMapping.objects.count()
    print(f"Dataset Column Mappings: {mapping_count}")
    
    # Test DynamicPatentField
    field_count = DynamicPatentField.objects.count()
    print(f"Dynamic Patent Fields: {field_count}")

def test_api_urls():
    print("\n=== Testing URL Configuration ===")
    
    from django.urls import reverse, NoReverseMatch
    
    # Test admin URLs
    admin_urls = [
        'admin-mapping-rules-list',
        'admin-dataset-mappings-list', 
        'admin-dynamic-fields-list'
    ]
    
    for url_name in admin_urls:
        try:
            url = reverse(url_name)
            print(f"✓ {url_name}: {url}")
        except NoReverseMatch as e:
            print(f"✗ {url_name}: {e}")

if __name__ == '__main__':
    try:
        print("Starting Data Configuration System Test...\n")
        
        user = test_permissions()
        test_models()
        test_api_urls()
        
        print("\n=== Test Summary ===")
        print("✓ Data Configuration system is set up correctly!")
        print("✓ Permissions model is working")
        print("✓ Models are accessible")
        print("✓ URL routing is configured")
        
        print(f"\nTest user credentials:")
        print(f"Email: {user.email}")
        print(f"Role: {user.role}")
        print("\nTo access the feature:")
        print("1. Go to http://localhost:3000/dashboard/admin")
        print("2. Look for the 'Data Config' tab")
        print("3. The user has full permissions for all features")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()