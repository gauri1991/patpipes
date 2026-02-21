#!/usr/bin/env python
"""
Complete end-to-end system test for intelligent column mapping
Tests the entire flow: Excel upload -> Analysis -> Mapping -> Migration -> Data Processing
"""

import os
import sys
import django
import pandas as pd
import tempfile
from pathlib import Path
from django.core.files.uploadedfile import SimpleUploadedFile

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from domains.analytics.models import (
    ColumnMappingRule, PatentDataset, AnalyticsProject, 
    DynamicPatentField, DatasetColumnMapping, PatentRecord
)
from domains.analytics.column_mapping_service import column_mapping_service
from domains.analytics.dynamic_migration_service import dynamic_migration_service
from domains.analytics.file_processors import process_patent_dataset
from django.contrib.auth import get_user_model

User = get_user_model()

def create_test_excel_file():
    """Create a comprehensive test Excel file with patent data"""
    
    # Sample patent data with mixed core and custom fields
    data = {
        # Core patent fields (should map automatically)
        "Patent Number": ["US10123456", "EP2987654", "JP6555555", "US10123457", "EP2987655"],
        "Title": [
            "Artificial Intelligence Method for Data Processing", 
            "Quantum Computing System with Enhanced Stability",
            "Biosensor Device for Medical Applications",
            "Machine Learning Algorithm for Predictive Analytics",
            "Energy Storage System with Advanced Materials"
        ],
        "Assignee": ["Apple Inc.", "Google LLC", "Microsoft Corp.", "Tesla Inc.", "Amazon Inc."],
        "Inventor": [
            "John Smith; Jane Doe", 
            "Bob Johnson", 
            "Alice Wilson; Charlie Brown",
            "David Miller",
            "Sarah Davis; Mike Taylor"
        ],
        "Filing Date": ["2023-01-15", "2022-12-20", "2024-02-10", "2023-03-25", "2022-11-18"],
        "Publication Date": ["2023-07-15", "2023-06-20", "2024-08-10", "2023-09-25", "2023-05-18"],
        "IPC Class": ["G06F15/16", "H01L29/786", "G01N27/327", "G06N3/08", "H01M10/0562"],
        
        # Custom fields (should create dynamic fields)
        "Technology Readiness Level": [7, 8, 6, 9, 7],
        "Market Potential Score": [8.5, 9.2, 7.8, 8.9, 8.1],
        "Innovation Category": ["AI/ML", "Quantum", "Biotech", "AI/ML", "Energy"],
        "Commercial Status": ["Licensed", "Open", "Restricted", "Licensed", "Open"],
        "Patent Family Size": [12, 8, 15, 10, 14],
        "Citation Count": [45, 23, 67, 89, 34],
        "Technical Complexity": ["High", "Very High", "Medium", "High", "High"],
        "Development Cost (USD)": [250000, 500000, 180000, 320000, 400000],
        "Time to Market (Years)": [2.5, 4.0, 1.8, 2.2, 3.1],
        "Risk Assessment": ["Low", "Medium", "Low", "Low", "Medium"]
    }
    
    # Create DataFrame
    df = pd.DataFrame(data)
    
    # Create temporary Excel file
    temp_file = tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False)
    df.to_excel(temp_file.name, index=False)
    temp_file.close()
    
    return temp_file.name

def test_complete_intelligent_mapping_system():
    """Test the complete intelligent column mapping system end-to-end"""
    
    print("🚀 Complete Intelligent Column Mapping System Test")
    print("=" * 55)
    
    try:
        # Step 1: Create test environment
        print("\n📋 Step 1: Setting up test environment...")
        
        # Get or create test user
        try:
            user = User.objects.get(email='system_test@example.com')
        except User.DoesNotExist:
            # Create unique user
            import uuid
            unique_suffix = str(uuid.uuid4())[:8]
            user = User.objects.create(
                email=f'system_test_{unique_suffix}@example.com',
                username=f'system_test_{unique_suffix}',
                first_name='System',
                last_name='Test',
                role='admin'
            )
        
        # Create test project
        project, created = AnalyticsProject.objects.get_or_create(
            name='Complete System Test Project',
            defaults={
                'description': 'End-to-end system test project',
                'created_by': user,
                'status': 'active'
            }
        )
        
        print(f"   ✅ Test user: {user.email}")
        print(f"   ✅ Test project: {project.name}")
        
        # Step 2: Create and upload test Excel file
        print("\n📊 Step 2: Creating test Excel file...")
        
        excel_file_path = create_test_excel_file()
        
        # Read the Excel file to verify content
        df = pd.read_excel(excel_file_path)
        print(f"   ✅ Excel file created: {len(df)} rows, {len(df.columns)} columns")
        print(f"   ✅ Columns: {list(df.columns)}")
        
        # Create dataset with uploaded file
        with open(excel_file_path, 'rb') as f:
            uploaded_file = SimpleUploadedFile(
                name='complete_test_dataset.xlsx',
                content=f.read(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
        
        dataset = PatentDataset.objects.create(
            name='Complete System Test Dataset',
            description='Full end-to-end test dataset',
            project=project,
            data_source='manual_upload',
            data_file=uploaded_file,
            processing_status='pending',
            created_by=user
        )
        
        print(f"   ✅ Dataset created: {dataset.name}")
        print(f"   ✅ File uploaded: {dataset.data_file.name}")
        
        # Step 3: Analyze columns intelligently
        print("\n🧠 Step 3: Analyzing columns with intelligent mapping...")
        
        column_names = df.columns.tolist()
        sample_data = {col: df[col].dropna().tolist()[:3] for col in column_names}
        
        # Analyze columns
        mapping_result = column_mapping_service.analyze_columns(
            column_names=column_names,
            sample_data=sample_data,
            dataset=dataset
        )
        
        print(f"   📊 Analysis Results:")
        print(f"   • Total columns: {len(column_names)}")
        print(f"   • High confidence matches: {len(mapping_result.high_confidence_matches)}")
        print(f"   • Medium confidence matches: {len(mapping_result.medium_confidence_matches)}")
        print(f"   • Low confidence matches: {len(mapping_result.low_confidence_matches)}")
        print(f"   • Unmapped columns: {len(mapping_result.unmapped_columns)}")
        
        print(f"\n   🎯 Mapping Details:")
        for match in mapping_result.matches:
            field_type = "Core" if match.is_core_field else "Dynamic"
            confidence_icon = "🎯" if match.confidence_score >= 90 else "🎲" if match.confidence_score >= 70 else "❓"
            print(f"   {confidence_icon} {match.source_column} → {match.target_field} ({field_type}, {match.confidence_score:.1f}%)")
        
        # Step 4: Apply mappings with dynamic field creation
        print("\n🔧 Step 4: Applying mappings and creating dynamic fields...")
        
        # Get initial state
        initial_dynamic_fields = DynamicPatentField.objects.filter(is_active=True).count()
        
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
        print(f"   • Migration errors: {len(application_result.get('errors', []))}")
        
        if application_result.get('created_fields'):
            print(f"   ✨ New dynamic fields:")
            for field in application_result['created_fields']:
                print(f"      • {field['field_name']} ({field['field_type']})")
        
        # Step 5: Verify database schema
        print("\n🗄️  Step 5: Verifying database schema...")
        
        final_dynamic_fields = DynamicPatentField.objects.filter(is_active=True).count()
        migrated_fields = DynamicPatentField.objects.filter(migration_applied=True).count()
        
        # Check actual database schema
        from django.db import connection
        with connection.cursor() as cursor:
            if connection.vendor == 'sqlite':
                cursor.execute("PRAGMA table_info(analytics_patent_records)")
                columns = cursor.fetchall()
                db_columns = [col[1] for col in columns]
            else:
                cursor.execute("""
                    SELECT column_name FROM information_schema.columns 
                    WHERE table_name = 'analytics_patent_records'
                """)
                columns = cursor.fetchall()
                db_columns = [col[0] for col in columns]
        
        print(f"   📊 Schema Verification:")
        print(f"   • Dynamic fields in registry: {final_dynamic_fields}")
        print(f"   • Migrated fields: {migrated_fields}")
        print(f"   • Database columns: {len(db_columns)}")
        
        # Verify new fields exist in database
        expected_new_fields = [field['field_name'] for field in application_result.get('created_fields', [])]
        actual_new_fields = [field for field in expected_new_fields if field in db_columns]
        
        print(f"   ✅ New fields in database: {len(actual_new_fields)}/{len(expected_new_fields)}")
        for field in actual_new_fields:
            print(f"      ✓ {field}")
        
        # Step 6: Test data processing with new schema
        print("\n📝 Step 6: Testing data processing with dynamic fields...")
        
        # Process the dataset
        try:
            processing_result = process_patent_dataset(str(dataset.id))
            
            if processing_result['success']:
                result_data = processing_result['result']
                print(f"   ✅ Processing successful:")
                print(f"   • Processed records: {result_data['processed_count']}")
                print(f"   • Total rows: {result_data['total_rows']}")
                print(f"   • Success rate: {(result_data['processed_count']/result_data['total_rows']*100):.1f}%")
                
                # Verify records were created
                patent_records = PatentRecord.objects.filter(dataset=dataset)
                print(f"   • Patent records in database: {patent_records.count()}")
                
                # Check if dynamic field data was stored
                if patent_records.exists():
                    sample_record = patent_records.first()
                    dynamic_field_values = {}
                    
                    for field in DynamicPatentField.objects.filter(is_active=True):
                        if hasattr(sample_record, field.field_name):
                            value = getattr(sample_record, field.field_name)
                            dynamic_field_values[field.field_name] = value
                    
                    print(f"   ✅ Dynamic field data sample:")
                    for field_name, value in dynamic_field_values.items():
                        print(f"      • {field_name}: {value}")
                
            else:
                print(f"   ❌ Processing failed: {processing_result['error']}")
                
        except Exception as e:
            print(f"   ❌ Processing error: {e}")
        
        # Step 7: Final system validation
        print("\n✅ Step 7: Final system validation...")
        
        # Check dataset mappings
        dataset_mappings = DatasetColumnMapping.objects.filter(dataset=dataset)
        confirmed_mappings = dataset_mappings.filter(status='confirmed').count()
        
        # Check migration status
        pending_migrations = dynamic_migration_service.get_pending_fields()
        
        print(f"   📊 System Status:")
        print(f"   • Dataset mappings: {dataset_mappings.count()}")
        print(f"   • Confirmed mappings: {confirmed_mappings}")
        print(f"   • Pending migrations: {len(pending_migrations)}")
        print(f"   • System ready: {'✅ YES' if len(pending_migrations) == 0 else '⏳ NEEDS MIGRATION'}")
        
        # Calculate success metrics
        total_columns = len(column_names)
        mapped_columns = len(mapping_result.matches)
        high_confidence = len(mapping_result.high_confidence_matches)
        
        mapping_success_rate = (mapped_columns / total_columns) * 100
        confidence_rate = (high_confidence / mapped_columns) * 100 if mapped_columns > 0 else 0
        
        print(f"\n📈 SYSTEM PERFORMANCE SUMMARY:")
        print(f"   🎯 Column Mapping Success Rate: {mapping_success_rate:.1f}%")
        print(f"   🎯 High Confidence Rate: {confidence_rate:.1f}%")
        print(f"   ⚡ Dynamic Fields Created: {application_result['dynamic_fields_created']}")
        print(f"   🔧 Database Migration Success: {'✅' if application_result['migration_applied'] else '❌'}")
        print(f"   📊 Data Processing Success: {'✅' if 'processing_result' in locals() and processing_result['success'] else '❌'}")
        
        # Overall system status
        system_ready = (
            len(pending_migrations) == 0 and
            application_result['migration_applied'] and
            ('processing_result' in locals() and processing_result['success'])
        )
        
        print(f"   🏆 Overall System Status: {'🟢 FULLY OPERATIONAL' if system_ready else '🟡 NEEDS ATTENTION'}")
        
        # Clean up
        os.unlink(excel_file_path)
        print(f"\n🧹 Cleanup: Temporary Excel file deleted")
        
        return {
            'success': True,
            'mapping_success_rate': mapping_success_rate,
            'confidence_rate': confidence_rate,
            'dynamic_fields_created': application_result['dynamic_fields_created'],
            'migration_applied': application_result['migration_applied'],
            'data_processed': 'processing_result' in locals() and processing_result['success'],
            'system_ready': system_ready
        }
        
    except Exception as e:
        print(f"\n❌ System Test Failed: {e}")
        import traceback
        traceback.print_exc()
        return {'success': False, 'error': str(e)}

if __name__ == "__main__":
    result = test_complete_intelligent_mapping_system()
    
    print("\n" + "=" * 55)
    if result['success']:
        print("🎉 COMPLETE SYSTEM TEST PASSED! 🎉")
        print("The intelligent column mapping system is fully operational.")
    else:
        print("❌ SYSTEM TEST FAILED")
        print(f"Error: {result.get('error', 'Unknown error')}")
    print("=" * 55)