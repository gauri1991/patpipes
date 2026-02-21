#!/usr/bin/env python
"""Debug script to test pipeline processing directly"""

import os
import sys
import django
import traceback

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from domains.analytics.models import PatentDataset, ProcessingPipeline, AgentConfiguration
from domains.analytics.processing.agents import create_agentic_pipeline
from domains.analytics.processing.tasks import await_save_results_to_db
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

def test_pipeline_processing():
    """Test the pipeline processing directly to identify errors"""
    
    # Get dataset with patents
    dataset = PatentDataset.objects.filter(patent_records__isnull=False).first()
    if not dataset:
        print("No dataset with patents found")
        return
    
    print(f"Using dataset: {dataset.name} with {dataset.patent_records.count()} patents")
    
    # Create a test pipeline
    user = User.objects.get(email='admin@patentpro.com')
    
    # Create or get agent config
    config, created = AgentConfiguration.objects.get_or_create(
        name='Test Config',
        agent_type='entity_extraction',
        defaults={
            'description': 'Test configuration',
            'processing_profile': 'standard',
            'input_source': 'abstract',
            'created_by': user,
            'config_params': {
                'entity_extraction': {
                    'min_confidence': 0.7,
                    'entity_types': 'all'
                }
            }
        }
    )
    
    pipeline = ProcessingPipeline.objects.create(
        dataset=dataset,
        agent_config=config,
        initiated_by=user,
        current_stage='preprocessing',
        total_patents=dataset.patent_records.count()
    )
    
    print(f"Created pipeline: {pipeline.id}")
    
    try:
        # Load patent data (limit to 2 for testing)
        patents = list(dataset.patent_records.all()[:2])
        patent_data = []
        
        for patent in patents:
            # Check raw_data for claims if it exists
            claims_text = ''
            if hasattr(patent, 'raw_data') and patent.raw_data:
                claims_text = patent.raw_data.get('claims', '') or patent.raw_data.get('Claims', '')
            
            patent_data.append({
                'patent_id': patent.patent_id,
                'abstract': patent.abstract or '',
                'claims': claims_text,  # Use claims from raw_data if available
                'title': patent.title or '',
                'record_id': patent.id
            })
        
        print(f"Processing {len(patent_data)} patents...")
        
        # Create orchestrator
        orchestrator = create_agentic_pipeline()
        
        # Process with debug callback
        def progress_callback(message: str, progress: float):
            print(f"  [{progress:.1f}%] {message}")
        
        # Process patents
        results = orchestrator.process_patents(
            patent_data, 
            config.config_params, 
            progress_callback
        )
        
        print(f"\nResults:")
        print(f"  Entities: {len(results.get('all_entities', []))}")
        print(f"  Triplets: {len(results.get('all_triplets', []))}")
        print(f"  Processed: {len(results.get('processed_patents', []))}")
        
        # Save results
        print("\nSaving results to database...")
        await_save_results_to_db(pipeline, results)
        
        # Update pipeline
        pipeline.current_stage = 'completed'
        pipeline.end_time = timezone.now()
        pipeline.total_entities = len(results.get('all_entities', []))
        pipeline.total_triplets = len(results.get('all_triplets', []))
        pipeline.save()
        
        print(f"✓ Pipeline completed successfully!")
        
    except Exception as e:
        print(f"\n✗ Pipeline failed with error:")
        print(f"  {type(e).__name__}: {str(e)}")
        print("\nFull traceback:")
        traceback.print_exc()
        
        # Update pipeline status
        pipeline.current_stage = 'failed'
        pipeline.error_message = str(e)
        pipeline.save()

if __name__ == '__main__':
    test_pipeline_processing()