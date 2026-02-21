"""
Celery tasks for asynchronous patent processing
Handles background processing with real-time progress updates
"""

import json
import time
from typing import List, Dict, Callable
from django.utils import timezone
from celery import shared_task
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from ..models import ProcessingPipeline, PatentRecord, PatentEntityExtraction, PatentTriplet, DatasetColumnMapping
from .agents import create_agentic_pipeline, Entity, Triplet


class ProgressTracker:
    """Real-time progress tracking for WebSocket updates"""
    
    def __init__(self, pipeline_id: str, channel_layer=None):
        self.pipeline_id = pipeline_id
        self.channel_layer = channel_layer or get_channel_layer()
        self.group_name = f"pipeline_{pipeline_id}"
    
    def update_progress(self, stage: str, message: str, progress: float, status: str = 'processing'):
        """Send progress update to WebSocket group"""
        try:
            # Update database
            pipeline = ProcessingPipeline.objects.get(id=self.pipeline_id)
            pipeline.update_stage(stage, status, message, progress)
            
            # Send WebSocket update
            if self.channel_layer:
                async_to_sync(self.channel_layer.group_send)(
                    self.group_name,
                    {
                        'type': 'pipeline_update',
                        'message': {
                            'pipeline_id': self.pipeline_id,
                            'stage': stage,
                            'status': status,
                            'message': message,
                            'progress': progress,
                            'timestamp': timezone.now().isoformat()
                        }
                    }
                )
        except Exception as e:
            print(f"Progress update failed: {e}")


@shared_task(bind=True)
def process_pipeline_async(self, pipeline_id: str):
    """
    Async task to process patents through the agentic pipeline
    Updates progress in real-time via WebSocket
    """
    
    try:
        # Initialize pipeline and progress tracker
        pipeline = ProcessingPipeline.objects.get(id=pipeline_id)
        tracker = ProgressTracker(pipeline_id)
        
        # Load patents from dataset using mapped fields
        tracker.update_progress('loading', 'Loading patent data...', 5)
        patents = list(pipeline.dataset.patent_records.all())
        patent_data = []
        
        # Get dataset column mappings to find claims source
        dataset_mappings = {dm.target_field: dm.source_column 
                           for dm in DatasetColumnMapping.objects.filter(dataset=pipeline.dataset)}
        claims_source_column = dataset_mappings.get('claims')
        
        for patent in patents:
            # Get claims from mapped source column or fallback to raw_data
            claims_text = ''
            if claims_source_column and hasattr(patent, 'raw_data') and patent.raw_data:
                claims_text = patent.raw_data.get(claims_source_column, '')
            elif hasattr(patent, 'raw_data') and patent.raw_data:
                # Fallback: check common claims field names in raw_data
                claims_text = (patent.raw_data.get('claims', '') or 
                              patent.raw_data.get('Claims', '') or
                              patent.raw_data.get('claim', '') or
                              patent.raw_data.get('Claim', ''))
            
            patent_data.append({
                'patent_id': patent.patent_id,
                'abstract': patent.abstract or '',
                'claims': claims_text,
                'title': patent.title or '',
                'record_id': patent.id
            })
        
        if not patent_data:
            tracker.update_progress('failed', 'No patents found in dataset', 100, 'failed')
            return {'status': 'failed', 'error': 'No patents to process'}
        
        # Initialize agentic pipeline
        tracker.update_progress('initializing', 'Initializing processing agents...', 10)
        orchestrator = create_agentic_pipeline()
        
        # Process patents with progress updates
        def progress_callback(message: str, progress: float):
            stage = 'processing'
            if 'preprocessing' in message.lower():
                stage = 'preprocessing'
            elif 'graph' in message.lower():
                stage = 'graph_building'
            elif 'cluster' in message.lower():
                stage = 'clustering'
            
            tracker.update_progress(stage, message, 15 + (progress * 0.7))  # 15-85%
        
        # Use optimized processing for large datasets
        from .optimizations import create_optimized_processor
        
        dataset_size = len(patent_data)
        config = pipeline.agent_config.config_params if pipeline.agent_config else {}
        
        if dataset_size > 100:  # Use optimized processor for larger datasets
            optimized_processor = create_optimized_processor(dataset_size, config)
            results = optimized_processor.process_large_dataset(
                str(pipeline.dataset.id), 
                pipeline_id, 
                config
            )
        else:
            # Use standard processor for small datasets
            results = orchestrator.process_patents(patent_data, config, progress_callback)
        
        # Save results to database
        tracker.update_progress('saving', 'Saving results to database...', 90)
        await_save_results_to_db(pipeline, results)
        
        # Finalize pipeline
        tracker.update_progress('completed', 'Processing completed successfully!', 100, 'completed')
        
        pipeline.current_stage = 'completed'
        pipeline.end_time = timezone.now()
        pipeline.total_entities = len(results['all_entities'])
        pipeline.total_triplets = len(results['all_triplets'])
        pipeline.processed_patents = len([p for p in results['processed_patents'] if p.get('processing_status') == 'completed'])
        pipeline.failed_patents = len([p for p in results['processed_patents'] if p.get('processing_status') == 'failed'])
        pipeline.save()
        
        return {
            'status': 'completed',
            'pipeline_id': pipeline_id,
            'statistics': results['statistics']
        }
        
    except Exception as e:
        # Handle any processing errors
        try:
            tracker = ProgressTracker(pipeline_id)
            tracker.update_progress('failed', f'Processing failed: {str(e)}', 100, 'failed')
            
            pipeline = ProcessingPipeline.objects.get(id=pipeline_id)
            pipeline.current_stage = 'failed'
            pipeline.end_time = timezone.now()
            pipeline.error_log.append({
                'timestamp': timezone.now().isoformat(),
                'error': str(e),
                'stage': 'processing'
            })
            pipeline.save()
        except:
            pass
        
        return {'status': 'failed', 'error': str(e)}


def await_save_results_to_db(pipeline: ProcessingPipeline, results: Dict):
    """Save processing results to database models"""
    
    # Clear any existing results for this pipeline
    PatentEntityExtraction.objects.filter(
        patent_record__dataset=pipeline.dataset
    ).delete()
    
    PatentTriplet.objects.filter(
        patent_record__dataset=pipeline.dataset
    ).delete()
    
    # Save entities
    entities_to_create = []
    entity_mapping = {}  # Map (patent_id, entity_text) to Entity object
    
    for patent_result in results['processed_patents']:
        if patent_result.get('processing_status') != 'completed':
            continue
            
        try:
            # Use record_id if provided, otherwise look up by patent_id and dataset
            record_id = patent_result.get('record_id')
            if record_id:
                patent_record = PatentRecord.objects.get(id=record_id)
            else:
                patent_record = PatentRecord.objects.filter(
                    dataset=pipeline.dataset,
                    patent_id=patent_result['patent_id']
                ).first()
                
            if not patent_record:
                continue
        except PatentRecord.DoesNotExist:
            continue
        
        # Save entities
        for entity_data in patent_result.get('entities', []):
            entity_key = (patent_result['patent_id'], entity_data['text'])
            
            # Ensure normalized_form is never None or empty
            normalized_text = entity_data.get('normalized_form') or entity_data.get('text', 'unknown')
            
            entity = PatentEntityExtraction(
                patent_record=patent_record,
                entity_text=entity_data['text'],
                entity_type=entity_data['type'],
                normalized_form=normalized_text,  # Use the ensured non-null value
                source_field='abstract',  # Default to abstract
                source_text=entity_data.get('context', ''),  # Add source_text
                confidence_score=entity_data['confidence'],
                extraction_method='hybrid',  # Use valid choice
                extraction_agent='agentic_pipeline',
                position_start=entity_data.get('start', 0),
                position_end=entity_data.get('end', 0),
                attributes=entity_data.get('attributes', {})
            )
            entities_to_create.append(entity)
            entity_mapping[entity_key] = entity
    
    # Bulk create entities
    if entities_to_create:
        PatentEntityExtraction.objects.bulk_create(entities_to_create)
    
    # Reload entities with IDs for triplet creation
    created_entities = {}
    for entity in PatentEntityExtraction.objects.filter(
        patent_record__dataset=pipeline.dataset
    ):
        key = (entity.patent_record.patent_id, entity.entity_text)
        created_entities[key] = entity
    
    # Save triplets
    triplets_to_create = []
    for patent_result in results['processed_patents']:
        if patent_result.get('processing_status') != 'completed':
            continue
            
        try:
            # Use record_id if provided, otherwise look up by patent_id and dataset
            record_id = patent_result.get('record_id')
            if record_id:
                patent_record = PatentRecord.objects.get(id=record_id)
            else:
                patent_record = PatentRecord.objects.filter(
                    dataset=pipeline.dataset,
                    patent_id=patent_result['patent_id']
                ).first()
                
            if not patent_record:
                continue
        except PatentRecord.DoesNotExist:
            continue
        
        for triplet_data in patent_result.get('triplets', []):
            subject_key = (patent_result['patent_id'], triplet_data['subject']['text'])
            object_key = (patent_result['patent_id'], triplet_data['object']['text'])
            
            subject_entity = created_entities.get(subject_key)
            object_entity = created_entities.get(object_key)
            
            if subject_entity and object_entity:
                triplet = PatentTriplet(
                    patent_record=patent_record,
                    subject_entity=subject_entity,
                    predicate=triplet_data['predicate'],
                    object_entity=object_entity,
                    confidence_score=triplet_data['confidence'],
                    source_sentence=triplet_data['source_sentence'][:500],  # Limit length
                    context_data=triplet_data.get('context', {})
                )
                triplets_to_create.append(triplet)
    
    # Bulk create triplets
    if triplets_to_create:
        PatentTriplet.objects.bulk_create(triplets_to_create)


# Synchronous version for testing/development
def process_pipeline_sync(pipeline_id: str) -> Dict:
    """Synchronous version of pipeline processing for testing"""
    
    try:
        pipeline = ProcessingPipeline.objects.get(id=pipeline_id)
        
        # Simple progress simulation
        def progress_callback(message: str, progress: float):
            print(f"Progress: {progress:.1f}% - {message}")
            pipeline.update_stage(
                'processing', 
                'processing', 
                message, 
                progress
            )
        
        # Load patent data using mapped fields
        patents = list(pipeline.dataset.patent_records.all())
        patent_data = []
        
        # Get dataset column mappings to find claims source
        dataset_mappings = {dm.target_field: dm.source_column 
                           for dm in DatasetColumnMapping.objects.filter(dataset=pipeline.dataset)}
        claims_source_column = dataset_mappings.get('claims')
        
        for patent in patents[:5]:  # Limit to 5 patents for testing
            # Get claims from mapped source column or fallback
            claims_text = ''
            if claims_source_column and hasattr(patent, 'raw_data') and patent.raw_data:
                claims_text = patent.raw_data.get(claims_source_column, '')
            elif hasattr(patent, 'raw_data') and patent.raw_data:
                # Fallback: check common claims field names in raw_data
                claims_text = (patent.raw_data.get('claims', '') or 
                              patent.raw_data.get('Claims', '') or
                              patent.raw_data.get('claim', '') or
                              patent.raw_data.get('Claim', ''))
            
            patent_data.append({
                'patent_id': patent.patent_id,
                'abstract': patent.abstract or '',
                'claims': claims_text,
                'title': patent.title or '',
                'record_id': patent.id
            })
        
        if not patent_data:
            return {'status': 'failed', 'error': 'No patents to process'}
        
        # Process with orchestrator
        orchestrator = create_agentic_pipeline()
        config = pipeline.agent_config.config_params if pipeline.agent_config else {}
        
        results = orchestrator.process_patents(patent_data, config, progress_callback)
        
        # Save results
        await_save_results_to_db(pipeline, results)
        
        # Update pipeline
        pipeline.current_stage = 'completed'
        pipeline.end_time = timezone.now()
        pipeline.total_entities = len(results['all_entities'])
        pipeline.total_triplets = len(results['all_triplets'])
        pipeline.processed_patents = len([p for p in results['processed_patents'] if p.get('processing_status') == 'completed'])
        pipeline.failed_patents = len([p for p in results['processed_patents'] if p.get('processing_status') == 'failed'])
        pipeline.save()
        
        return {
            'status': 'completed',
            'pipeline_id': pipeline_id,
            'statistics': results['statistics']
        }
        
    except Exception as e:
        # Update pipeline with error
        try:
            pipeline = ProcessingPipeline.objects.get(id=pipeline_id)
            pipeline.current_stage = 'failed'
            pipeline.end_time = timezone.now()
            pipeline.error_log.append({
                'timestamp': timezone.now().isoformat(),
                'error': str(e),
                'stage': 'processing'
            })
            pipeline.save()
        except:
            pass
        
        return {'status': 'failed', 'error': str(e)}