#!/usr/bin/env python
"""
Script to update patent records with additional field mappings
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from domains.analytics.models import PatentRecord

def main():
    # Get the dataset
    record = PatentRecord.objects.first()
    if not record:
        print("No patent records found")
        return
        
    dataset = record.dataset
    print(f"Processing dataset: {dataset.name}")
    
    updated_count = 0
    total_count = PatentRecord.objects.filter(dataset=dataset).count()
    
    for i, record in enumerate(PatentRecord.objects.filter(dataset=dataset)):
        updated = False
        
        # Map IPC classification
        if not record.ipc_classification and 'ipc - current' in record.raw_data:
            ipc_value = record.raw_data['ipc - current']
            if ipc_value and ipc_value.strip() and ipc_value.upper() != 'NA':
                record.ipc_classification = ipc_value
                updated = True
        
        # Map CPC classification  
        if not record.cpc_classification and 'cpc - current' in record.raw_data:
            cpc_value = record.raw_data['cpc - current']
            if cpc_value and cpc_value.strip() and cpc_value.upper() != 'NA':
                record.cpc_classification = cpc_value
                updated = True
                
        # Map legal status
        if not record.legal_status and 'legal status' in record.raw_data:
            legal_value = record.raw_data['legal status']
            if legal_value and legal_value.strip() and legal_value.upper() != 'NA':
                record.legal_status = legal_value
                updated = True
        
        if updated:
            record.save()
            updated_count += 1
            
        # Progress indicator
        if (i + 1) % 100 == 0:
            print(f"Processed {i + 1}/{total_count} records...")
    
    print(f"Updated {updated_count} records with additional field data")
    
    # Check the first record again
    first_record = PatentRecord.objects.first()
    print(f"First record ipc_classification: {first_record.ipc_classification[:50]}..." if first_record.ipc_classification else "No IPC")
    print(f"First record cpc_classification: {first_record.cpc_classification}")
    print(f"First record legal_status: {first_record.legal_status}")

if __name__ == "__main__":
    main()