#!/usr/bin/env python
"""
Script to extract claims from raw_data and store them separately for each patent record.
This script can be run to migrate existing claims data from the raw_data JSON field
to a dedicated claims field (when available) or to prepare claims for separate storage.
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from domains.analytics.models import PatentRecord, PatentDataset
from django.db import transaction
import json


def extract_claims_from_raw_data(raw_data):
    """
    Extract claims text from raw_data JSON field.
    Tries multiple possible keys for claims.
    """
    if not raw_data:
        return ''
    
    # Try different possible keys for claims
    claims_keys = ['claims (english)', 'claims', 'Claims', 'CLAIMS', 'claim', 'Claim']
    
    for key in claims_keys:
        if key in raw_data:
            claims = raw_data[key]
            # Return claims as string
            if isinstance(claims, str):
                return claims
            elif isinstance(claims, list):
                # If claims are in a list, join them
                return '\n'.join(str(claim) for claim in claims)
            else:
                return str(claims)
    
    return ''


def process_dataset_claims(dataset_id=None):
    """
    Process claims for a specific dataset or all datasets.
    """
    if dataset_id:
        datasets = PatentDataset.objects.filter(id=dataset_id)
    else:
        datasets = PatentDataset.objects.all()
    
    total_processed = 0
    total_with_claims = 0
    
    for dataset in datasets:
        print(f"\nProcessing dataset: {dataset.name} (ID: {dataset.id})")
        
        records = PatentRecord.objects.filter(dataset=dataset)
        dataset_processed = 0
        dataset_with_claims = 0
        
        with transaction.atomic():
            for record in records:
                claims_text = extract_claims_from_raw_data(record.raw_data)
                
                if claims_text:
                    # If the model has a claims field, update it
                    if hasattr(record, 'claims'):
                        record.claims = claims_text
                        record.save(update_fields=['claims'])
                    
                    dataset_with_claims += 1
                    
                    # Optional: Store claims separately or in a related model
                    # This is where you could create a separate ClaimsRecord model if needed
                    
                dataset_processed += 1
                
                if dataset_processed % 100 == 0:
                    print(f"  Processed {dataset_processed} records...")
        
        print(f"  Completed: {dataset_processed} records processed, {dataset_with_claims} have claims")
        total_processed += dataset_processed
        total_with_claims += dataset_with_claims
    
    print(f"\n=== Summary ===")
    print(f"Total records processed: {total_processed}")
    print(f"Records with claims: {total_with_claims}")
    print(f"Records without claims: {total_processed - total_with_claims}")
    
    return total_processed, total_with_claims


def analyze_claims_structure():
    """
    Analyze the structure of claims in the database to understand the data better.
    """
    print("\n=== Analyzing Claims Structure ===")
    
    # Sample some records to understand claims structure
    sample_records = PatentRecord.objects.exclude(raw_data={})[:10]
    
    claims_keys_found = set()
    claims_samples = []
    
    for record in sample_records:
        if record.raw_data:
            for key in record.raw_data.keys():
                if 'claim' in key.lower():
                    claims_keys_found.add(key)
                    claims_text = extract_claims_from_raw_data(record.raw_data)
                    if claims_text:
                        claims_samples.append({
                            'patent_id': record.patent_id or 'Unknown',
                            'title': record.title[:50] if record.title else 'No title',
                            'claims_length': len(claims_text),
                            'claims_preview': claims_text[:200] + '...' if len(claims_text) > 200 else claims_text
                        })
    
    print(f"Claims-related keys found: {claims_keys_found}")
    print(f"\nSample claims data:")
    for i, sample in enumerate(claims_samples[:3], 1):
        print(f"\n{i}. Patent: {sample['patent_id']}")
        print(f"   Title: {sample['title']}")
        print(f"   Claims length: {sample['claims_length']} characters")
        print(f"   Preview: {sample['claims_preview']}")


def main():
    """
    Main function to handle command-line arguments and execute the appropriate action.
    """
    import argparse
    
    parser = argparse.ArgumentParser(description='Extract and store patent claims from raw data')
    parser.add_argument('--analyze', action='store_true', help='Analyze claims structure in the database')
    parser.add_argument('--dataset-id', type=str, help='Process specific dataset by ID')
    parser.add_argument('--process-all', action='store_true', help='Process all datasets')
    
    args = parser.parse_args()
    
    if args.analyze:
        analyze_claims_structure()
    elif args.process_all or args.dataset_id:
        dataset_id = args.dataset_id if args.dataset_id else None
        process_dataset_claims(dataset_id)
    else:
        print("Please specify an action: --analyze, --process-all, or --dataset-id <id>")
        print("\nExamples:")
        print("  python extract_and_store_claims.py --analyze")
        print("  python extract_and_store_claims.py --process-all")
        print("  python extract_and_store_claims.py --dataset-id 163340d1-677a-429b-be8d-6a33a568e63a")


if __name__ == '__main__':
    main()