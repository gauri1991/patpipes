#!/usr/bin/env python
"""
Script to update patent records with correct field mappings
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from domains.analytics.models import PatentRecord, DatasetColumnMapping

def main():
    # Get the dataset
    record = PatentRecord.objects.first()
    if not record:
        print("No patent records found")
        return
        
    dataset = record.dataset
    print(f"Processing dataset: {dataset.name}")
    
    # Update all patent records with correct field mappings
    updated_count = 0
    total_count = PatentRecord.objects.filter(dataset=dataset).count()
    
    for i, record in enumerate(PatentRecord.objects.filter(dataset=dataset)):
        updated = False
        
        # Fix assignee mapping - check if assignee is empty but optimized assignee exists
        if not record.assignee and 'optimized assignee' in record.raw_data:
            assignee_value = record.raw_data['optimized assignee']
            if assignee_value and assignee_value.strip() and assignee_value.upper() != 'NA':
                record.assignee = assignee_value
                updated = True
        
        if updated:
            record.save()
            updated_count += 1
            
        # Progress indicator
        if (i + 1) % 100 == 0:
            print(f"Processed {i + 1}/{total_count} records...")
    
    print(f"Updated {updated_count} records with assignee data")
    
    # Check the first record again
    first_record = PatentRecord.objects.first()
    print(f"First record patent_id: {first_record.patent_id}")
    print(f"First record assignee: {first_record.assignee}")
    print(f"First record country_code: {first_record.country_code}")

if __name__ == "__main__":
    main()