#!/usr/bin/env python
"""
Full system test for intelligent column mapping with dynamic migrations
"""

import os
import sys
import django
import pandas as pd
from pathlib import Path

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from domains.analytics.column_mapping_service import column_mapping_service, ColumnMatch
from domains.analytics.dynamic_migration_service import dynamic_migration_service
from domains.analytics.models import (
    ColumnMappingRule, PatentDataset, AnalyticsProject, 
    DynamicPatentField, DatasetColumnMapping
)
from django.contrib.auth import get_user_model

User = get_user_model()

def test_full_intelligent_mapping_system():
    """Test the complete intelligent column mapping system with dynamic migrations"""
    
    print("🚀 Testing Complete Intelligent Column Mapping System")
    print("=" * 60)
    
    # Test 1: Create test project and dataset
    print("\n1. Setting up test environment...")
    
    # Create or get test user
    user, created = User.objects.get_or_create(
        email='test@example.com',
        defaults={
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'admin'
        }
    )
    
    # Create or get test project
    project, created = AnalyticsProject.objects.get_or_create(
        name='Intelligent Mapping Test Project',
        defaults={
            'description': 'Test project for intelligent column mapping',
            'created_by': user,
            'status': 'active'
        }
    )
    
    # Create test dataset
    dataset = PatentDataset.objects.create(
        name='Test Dataset with Custom Fields',
        description='Dataset to test intelligent mapping with custom fields',
        project=project,
        data_source='manual_upload',
        processing_status='pending',
        created_by=user
    )
    
    print(f"   ✅ Created test project: {project.name}")
    print(f"   ✅ Created test dataset: {dataset.name}")
    
    # Test 2: Test complex column mapping with custom fields
    print("\n2. Testing intelligent column mapping with custom fields...")
    
    test_columns = [
        # Standard fields that should map to core fields
        "Patent Number",
        "Title", 
        "Assignee",
        "Filing Date",
        "IPC Classification",
        
        # Custom fields that should create dynamic fields
        "Technology Score",
        "Market Value",
        "Innovation Level", 
        "Patent Family Size",
        "Commercial Potential"
    ]
    
    sample_data = {
        "Patent Number": ["US12345678", "EP9876543", "JP5555555"],
        "Title": ["AI-based method", "Quantum processor", "Bio-sensor device"],
        "Assignee": ["Apple Inc.", "Google LLC", "Microsoft Corp."],
        "Filing Date": ["2023-01-15", "2022-12-20", "2024-02-10"],
        "IPC Classification": ["G06F15/16", "H01L29/786", "G01N27/327"],
        "Technology Score": [8.5, 7.2, 9.1],
        "Market Value": [250000, 180000, 320000],
        "Innovation Level": ["High", "Medium", "High"],
        "Patent Family Size": [12, 8, 15],
        "Commercial Potential": ["Excellent", "Good", "Outstanding"]
    }
    
    # Analyze columns
    mapping_result = column_mapping_service.analyze_columns(test_columns, sample_data, dataset)
    
    print(f"   📊 Analysis Results:")
    print(f"   • Total columns analyzed: {len(test_columns)}")
    print(f"   • High confidence matches: {len(mapping_result.high_confidence_matches)}")
    print(f"   • Medium confidence matches: {len(mapping_result.medium_confidence_matches)}")
    print(f"   • Low confidence matches: {len(mapping_result.low_confidence_matches)}")
    print(f"   • Dynamic fields needed: {sum(1 for m in mapping_result.matches if not m.is_core_field)}")
    
    # Show mapping details
    print(f"\n   🎯 Detailed Mappings:")
    for match in mapping_result.matches:
        field_type = "Core" if match.is_core_field else "Dynamic"
        confidence_icon = "🎯" if match.confidence_score >= 90 else "🎲" if match.confidence_score >= 70 else "❓"
        print(f"   {confidence_icon} {match.source_column} → {match.target_field} ({field_type}, {match.confidence_score:.1f}%)")
    
    # Test 3: Apply mappings with dynamic field creation and migration
    print("\n3. Applying mappings with dynamic field creation...")
    
    # Check dynamic fields before
    dynamic_fields_before = DynamicPatentField.objects.filter(is_active=True).count()
    print(f"   📊 Dynamic fields before: {dynamic_fields_before}")
    
    # Apply mappings
    application_result = column_mapping_service.apply_mappings(
        dataset=dataset,
        mappings=mapping_result.matches,
        user=user
    )
    
    print(f"   📊 Application Results:")
    print(f"   • Mappings applied: {application_result['applied_mappings']}")
    print(f"   • Dynamic fields created: {application_result['dynamic_fields_created']}")
    print(f"   • Migration applied: {application_result['migration_applied']}")
    print(f"   • Migration name: {application_result.get('migration_name', 'None')}")
    print(f"   • Errors: {len(application_result['errors'])}")
    
    if application_result['errors']:
        print(f"   ❌ Errors encountered:")
        for error in application_result['errors']:
            print(f"      • {error}")
    
    if application_result['created_fields']:
        print(f"   ✨ Created dynamic fields:")
        for field in application_result['created_fields']:
            print(f"      • {field['field_name']} ({field['field_type']})")
    
    # Test 4: Verify dynamic field migration status
    print("\n4. Verifying dynamic field migration status...")
    
    dynamic_fields_after = DynamicPatentField.objects.filter(is_active=True).count()
    migrated_fields = DynamicPatentField.objects.filter(migration_applied=True).count()
    pending_fields = dynamic_migration_service.get_pending_fields()
    
    print(f"   📊 Migration Status:")
    print(f"   • Total dynamic fields: {dynamic_fields_after}")
    print(f"   • Migrated fields: {migrated_fields}")
    print(f"   • Pending fields: {len(pending_fields)}")
    
    if pending_fields:
        print(f"   ⏳ Pending fields:")
        for field in pending_fields:
            print(f"      • {field.field_name} ({field.field_type})")
    
    # Test 5: Verify dataset mapping records
    print("\n5. Verifying dataset mapping records...")
    
    dataset_mappings = DatasetColumnMapping.objects.filter(dataset=dataset)
    print(f"   📊 Dataset Mappings: {dataset_mappings.count()}")
    
    for mapping in dataset_mappings:
        field_type = "Core" if not mapping.target_field in [f.field_name for f in DynamicPatentField.objects.all()] else "Dynamic"
        status_icon = "✅" if mapping.status == 'confirmed' else "⏳"
        print(f"   {status_icon} {mapping.source_column} → {mapping.target_field} ({field_type}, {mapping.confidence_score:.1f}%)")
    
    # Test 6: Test migration management commands
    print("\n6. Testing migration management...")
    
    if pending_fields:
        print(f"   🔧 Auto-migrating {len(pending_fields)} pending fields...")
        migration_result = dynamic_migration_service.auto_migrate_pending_fields()
        
        print(f"   📊 Auto-migration Result:")
        print(f"   • Success: {migration_result['success']}")
        print(f"   • Message: {migration_result['message']}")
        print(f"   • Fields migrated: {migration_result['fields_migrated']}")
        print(f"   • Migration name: {migration_result.get('migration_name', 'None')}")
    else:
        print(f"   ✅ No pending fields to migrate")
    
    # Test 7: Verify final state
    print("\n7. Final system verification...")
    
    final_pending = len(dynamic_migration_service.get_pending_fields())
    final_migrated = DynamicPatentField.objects.filter(migration_applied=True).count()
    
    print(f"   📊 Final State:")
    print(f"   • Pending migrations: {final_pending}")
    print(f"   • Successfully migrated: {final_migrated}")
    print(f"   • Total dataset mappings: {DatasetColumnMapping.objects.filter(dataset=dataset).count()}")
    
    # Check if migrations were created
    if application_result.get('migration_name'):
        migration_file_path = Path(f"domains/analytics/migrations/{application_result['migration_name']}.py")
        if migration_file_path.exists():
            print(f"   ✅ Migration file created: {application_result['migration_name']}.py")
        else:
            print(f"   ⚠️  Migration file not found: {migration_file_path}")
    
    print(f"\n✅ Complete Intelligent Column Mapping System Test Finished!")
    print(f"=" * 60)
    
    # Summary
    success_rate = (len(mapping_result.matches) / len(test_columns)) * 100
    print(f"\n📈 SYSTEM PERFORMANCE SUMMARY:")
    print(f"   🎯 Column Mapping Success Rate: {success_rate:.1f}%")
    print(f"   ⚡ Dynamic Fields Created: {application_result['dynamic_fields_created']}")
    print(f"   🔧 Database Migration Applied: {'Yes' if application_result['migration_applied'] else 'No'}")
    print(f"   ✅ System Status: {'Production Ready' if final_pending == 0 else 'Needs Migration'}")

if __name__ == "__main__":
    test_full_intelligent_mapping_system()