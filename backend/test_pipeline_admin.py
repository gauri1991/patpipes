#!/usr/bin/env python
"""Test script to debug pipeline processing with admin credentials"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import requests
import json
from domains.analytics.models import PatentDataset, AgentConfiguration
from django.contrib.auth import get_user_model

User = get_user_model()

def test_pipeline():
    # Login with admin credentials
    login_url = 'http://localhost:8000/api/v1/accounts/auth/login/'
    login_data = {'username': 'admin', 'password': 'admin123'}
    login_response = requests.post(login_url, json=login_data)
    
    print(f"Login response status: {login_response.status_code}")
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.text}")
        return
    
    login_data = login_response.json()
    print(f"Login response keys: {login_data.keys()}")
    
    # Get token from nested structure
    token = login_data.get('tokens', {}).get('accessToken')
    if not token:
        print(f"No access token found. Full response: {json.dumps(login_data, indent=2)}")
        return
        
    headers = {'Authorization': f'Bearer {token}'}
    print("✓ Login successful")
    
    # Get first dataset with patents
    dataset = PatentDataset.objects.filter(patent_records__isnull=False).first()
    if not dataset:
        print("No dataset with patents found")
        return
    
    print(f"✓ Using dataset: {dataset.name} (ID: {dataset.id}) with {dataset.patent_records.count()} patents")
    
    # Start pipeline
    pipeline_url = 'http://localhost:8000/api/v1/analytics/api/agentic/pipelines/start/'
    pipeline_data = {
        'dataset_ids': [str(dataset.id)],  # Note: plural and array
        'processing_profile': 'standard',
        'input_source': 'abstract',
        'create_default_config': True
    }
    
    print(f"\nStarting pipeline with data: {json.dumps(pipeline_data, indent=2)}")
    
    response = requests.post(pipeline_url, json=pipeline_data, headers=headers)
    print(f"\nResponse status: {response.status_code}")
    
    if response.status_code == 201:
        print("✓ Pipeline started successfully!")
        result = response.json()
        if isinstance(result, list) and len(result) > 0:
            pipeline_id = result[0].get('id')
            print(f"Pipeline ID: {pipeline_id}")
            
            # Check pipeline status
            status_url = f'http://localhost:8000/api/v1/analytics/api/agentic/pipelines/{pipeline_id}/'
            status_response = requests.get(status_url, headers=headers)
            if status_response.status_code == 200:
                status_data = status_response.json()
                print(f"Pipeline status: {status_data.get('current_stage')}")
                print(f"Progress: {status_data.get('progress', 0)}%")
    else:
        print(f"✗ Pipeline failed with status {response.status_code}")
        print(f"Response text: {response.text[:1000]}")
        
        # Try to get more error details
        try:
            error_data = response.json()
            print("\nError details:")
            print(json.dumps(error_data, indent=2))
        except:
            pass

if __name__ == '__main__':
    test_pipeline()