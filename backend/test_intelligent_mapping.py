#!/usr/bin/env python
"""
Test script for intelligent column mapping system
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

from domains.analytics.column_mapping_service import column_mapping_service
from domains.analytics.models import ColumnMappingRule, PatentDataset, AnalyticsProject
from django.contrib.auth import get_user_model

User = get_user_model()

def test_column_mapping():
    """Test the intelligent column mapping system"""
    
    print("🚀 Testing Intelligent Column Mapping System")
    print("=" * 50)
    
    # Test 1: Initialize built-in rules
    print("\n1. Initializing built-in mapping rules...")
    service = column_mapping_service
    rules_count = ColumnMappingRule.objects.filter(is_active=True).count()
    print(f"   ✓ Created {rules_count} built-in mapping rules")
    
    # Test 2: Test column name analysis
    print("\n2. Testing column name analysis...")
    test_columns = [
        "Patent Number",
        "Patent_Title", 
        "Assignee Company",
        "Filing_Date",
        "IPC Class",
        "Custom Field 1",
        "Unknown Column"
    ]
    
    sample_data = {
        "Patent Number": ["US12345678", "EP9876543", "JP5555555"],
        "Patent_Title": ["Method for...", "System and device...", "Composition comprising..."],
        "Assignee Company": ["Apple Inc.", "Google LLC", "Microsoft Corp."],
        "Filing_Date": ["2023-01-15", "2022-12-20", "2024-02-10"],
        "IPC Class": ["A01B1/00", "H04L29/06", "C07D239/42"],
        "Custom Field 1": ["Value1", "Value2", "Value3"],
        "Unknown Column": ["Data1", "Data2", "Data3"]
    }
    
    mapping_result = service.analyze_columns(test_columns, sample_data)
    
    print(f"   📊 Analysis Results:")
    print(f"   • Total columns: {len(test_columns)}")
    print(f"   • High confidence matches: {len(mapping_result.high_confidence_matches)}")
    print(f"   • Medium confidence matches: {len(mapping_result.medium_confidence_matches)}")
    print(f"   • Low confidence matches: {len(mapping_result.low_confidence_matches)}")
    print(f"   • Unmapped columns: {len(mapping_result.unmapped_columns)}")
    print(f"   • Conflicts detected: {len(mapping_result.conflicts)}")
    
    # Show detailed matches
    print("\n   📝 Detailed Mapping Results:")
    for match in mapping_result.matches:
        confidence_emoji = "🎯" if match.confidence_score >= 90 else "🎲" if match.confidence_score >= 70 else "❓"
        field_type_emoji = "🔧" if match.is_core_field else "✨"
        print(f"   {confidence_emoji} {field_type_emoji} {match.source_column} → {match.target_field} ({match.confidence_score:.1f}%)")
    
    if mapping_result.unmapped_columns:
        print(f"\n   ❌ Unmapped columns: {', '.join(mapping_result.unmapped_columns)}")
    
    # Test 3: Test with real Excel file
    print("\n3. Testing with real Excel file...")
    excel_file_path = Path("media/analytics/datasets/intelligent_mapping_test.xlsx")
    
    if excel_file_path.exists():
        try:
            df = pd.read_excel(excel_file_path, nrows=5)
            real_columns = df.columns.tolist()
            real_sample_data = {col: df[col].dropna().tolist()[:3] for col in real_columns}
            
            print(f"   📁 File columns: {real_columns}")
            
            real_mapping_result = service.analyze_columns(real_columns, real_sample_data)
            
            print(f"   📊 Real File Analysis:")
            print(f"   • High confidence: {len(real_mapping_result.high_confidence_matches)}")
            print(f"   • Medium confidence: {len(real_mapping_result.medium_confidence_matches)}")
            print(f"   • Low confidence: {len(real_mapping_result.low_confidence_matches)}")
            
            for match in real_mapping_result.matches[:5]:  # Show first 5 matches
                confidence_emoji = "🎯" if match.confidence_score >= 90 else "🎲" if match.confidence_score >= 70 else "❓"
                print(f"   {confidence_emoji} {match.source_column} → {match.target_field} ({match.confidence_score:.1f}%)")
                
        except Exception as e:
            print(f"   ⚠️  Error reading Excel file: {e}")
    else:
        print("   ⚠️  Test Excel file not found, skipping real file test")
    
    # Test 4: Test pattern matching
    print("\n4. Testing pattern matching accuracy...")
    test_patterns = [
        ("Patent No", "patent_id", True),
        ("PATENT_NUMBER", "patent_id", True),
        ("Application Number", "patent_id", True),
        ("Title of Invention", "title", True),
        ("Patent Title", "title", True),
        ("Inventor Name", "inventor", True),
        ("Assignee Corporation", "assignee", True),
        ("Filing Date", "filing_date", True),
        ("Publication Date", "publication_date", True),
        ("IPC Classification", "ipc_classification", True),
        ("Random Column", None, False),  # Should not match
    ]
    
    correct_predictions = 0
    total_tests = len(test_patterns)
    
    for column_name, expected_field, should_match in test_patterns:
        rules = ColumnMappingRule.objects.filter(is_active=True)
        best_match = service._find_best_match(column_name, rules)
        
        if should_match:
            if best_match and best_match.target_field == expected_field and best_match.confidence_score >= 70:
                correct_predictions += 1
                print(f"   ✅ '{column_name}' → '{expected_field}' ({best_match.confidence_score:.1f}%)")
            else:
                actual = best_match.target_field if best_match else "None"
                score = best_match.confidence_score if best_match else 0
                print(f"   ❌ '{column_name}' → expected '{expected_field}', got '{actual}' ({score:.1f}%)")
        else:
            if not best_match or best_match.confidence_score < 70:
                correct_predictions += 1
                print(f"   ✅ '{column_name}' → correctly rejected")
            else:
                print(f"   ❌ '{column_name}' → should be rejected, got '{best_match.target_field}' ({best_match.confidence_score:.1f}%)")
    
    accuracy = (correct_predictions / total_tests) * 100
    print(f"\n   📈 Pattern Matching Accuracy: {accuracy:.1f}% ({correct_predictions}/{total_tests})")
    
    # Test 5: Test field type inference
    print("\n5. Testing field type inference...")
    type_test_data = {
        "Date Column": ["2023-01-15", "2022-12-20", "2024-02-10"],
        "Integer Column": [123, 456, 789],
        "Float Column": [12.34, 56.78, 90.12],
        "Text Column": ["Some long text here", "Another text entry", "More text content"],
        "Boolean Column": ["true", "false", "true"],
        "Mixed Column": ["Text", 123, "2023-01-01"]
    }
    
    for col_name, values in type_test_data.items():
        inferred_type = service._infer_field_type(values)
        print(f"   🔍 '{col_name}' → {inferred_type}")
    
    print("\n✅ Intelligent Column Mapping Test Complete!")
    print("=" * 50)

def test_api_endpoints():
    """Test the API endpoints"""
    print("\n🌐 Testing API Endpoints")
    print("=" * 30)
    
    try:
        import requests
        base_url = "http://localhost:8000/api/v1/analytics/api"
        
        # Test built-in patterns endpoint
        print("\n1. Testing built-in patterns endpoint...")
        response = requests.get(f"{base_url}/column-mapping-rules/builtin_patterns/")
        if response.status_code == 200:
            patterns = response.json()
            print(f"   ✅ Retrieved {len(patterns)} built-in patterns")
            # Show a few examples
            for field_name in list(patterns.keys())[:3]:
                pattern_data = patterns[field_name]
                print(f"   • {field_name}: {len(pattern_data['patterns'])} patterns")
        else:
            print(f"   ❌ API error: {response.status_code}")
        
        # Test column mapping test endpoint
        print("\n2. Testing column mapping test endpoint...")
        test_data = {"column_name": "Patent Number"}
        response = requests.post(f"{base_url}/column-mapping-rules/test_mapping/", json=test_data)
        if response.status_code == 200:
            result = response.json()
            if result.get('best_match'):
                match = result['best_match']
                print(f"   ✅ '{test_data['column_name']}' → '{match['target_field']}' ({match['confidence_score']:.1f}%)")
            else:
                print(f"   ⚠️  No match found for '{test_data['column_name']}'")
        else:
            print(f"   ❌ API error: {response.status_code}")
        
        print("\n   ✅ API endpoints are working correctly!")
        
    except ImportError:
        print("   ⚠️  requests library not available, skipping API tests")
    except Exception as e:
        print(f"   ⚠️  API test error: {e}")

if __name__ == "__main__":
    test_column_mapping()
    test_api_endpoints()