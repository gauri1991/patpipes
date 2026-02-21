"""
Performance optimizations for large dataset processing
Includes batch processing, memory management, and efficient data structures
"""

import gc
import time
import logging
import numpy as np
from typing import List, Dict, Iterator, Tuple, Optional
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.db import transaction, connection
from django.core.cache import cache
from django.conf import settings

from ..models import PatentRecord, PatentEntityExtraction, PatentTriplet


logger = logging.getLogger(__name__)


@dataclass
class ProcessingBatch:
    """Represents a batch of patents for processing"""
    patents: List[Dict]
    batch_id: int
    total_batches: int


class BatchProcessor:
    """Handles batch processing for large datasets"""
    
    def __init__(self, batch_size: int = 50, max_workers: int = 3):
        self.batch_size = batch_size
        self.max_workers = max_workers
        self.processed_count = 0
    
    def create_batches(self, patents: List[Dict]) -> Iterator[ProcessingBatch]:
        """Create processing batches from patent list"""
        total_patents = len(patents)
        total_batches = (total_patents + self.batch_size - 1) // self.batch_size
        
        for i in range(0, total_patents, self.batch_size):
            batch_patents = patents[i:i + self.batch_size]
            batch_id = i // self.batch_size + 1
            
            yield ProcessingBatch(
                patents=batch_patents,
                batch_id=batch_id,
                total_batches=total_batches
            )
    
    def process_batch_parallel(self, batch: ProcessingBatch, processing_func, config: Dict) -> Dict:
        """Process a batch using parallel workers"""
        
        if len(batch.patents) <= 3:
            # Small batch, process sequentially
            return processing_func(batch.patents, config)
        
        # Split batch into sub-batches for parallel processing
        sub_batch_size = max(1, len(batch.patents) // self.max_workers)
        sub_batches = [
            batch.patents[i:i + sub_batch_size] 
            for i in range(0, len(batch.patents), sub_batch_size)
        ]
        
        results = {
            'processed_patents': [],
            'all_entities': [],
            'all_triplets': [],
            'processing_time': 0,
            'errors': []
        }
        
        start_time = time.time()
        
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit sub-batch processing tasks
            future_to_batch = {
                executor.submit(processing_func, sub_batch, config): i 
                for i, sub_batch in enumerate(sub_batches)
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_batch):
                try:
                    sub_result = future.result(timeout=300)  # 5 minute timeout
                    
                    # Merge results
                    results['processed_patents'].extend(sub_result.get('processed_patents', []))
                    results['all_entities'].extend(sub_result.get('all_entities', []))
                    results['all_triplets'].extend(sub_result.get('all_triplets', []))
                    
                except Exception as e:
                    batch_idx = future_to_batch[future]
                    error_msg = f"Sub-batch {batch_idx} failed: {str(e)}"
                    logger.error(error_msg)
                    results['errors'].append(error_msg)
        
        results['processing_time'] = time.time() - start_time
        self.processed_count += len(batch.patents)
        
        # Force garbage collection after each batch
        gc.collect()
        
        return results


class MemoryManager:
    """Manages memory usage during large dataset processing"""
    
    def __init__(self, max_memory_mb: int = 2048):
        self.max_memory_mb = max_memory_mb
        self.entity_cache = {}
        self.triplet_buffer = []
        self.buffer_size = 1000
    
    def check_memory_usage(self) -> bool:
        """Check if memory usage is within limits"""
        try:
            import psutil
            process = psutil.Process()
            memory_mb = process.memory_info().rss / 1024 / 1024
            return memory_mb < self.max_memory_mb
        except ImportError:
            # Fallback: always return True if psutil not available
            return True
    
    def optimize_for_large_dataset(self, dataset_size: int) -> Dict[str, any]:
        """Optimize processing configuration based on dataset size"""
        config = {}
        
        if dataset_size > 10000:
            # Very large dataset optimizations
            config.update({
                'batch_size': 25,
                'use_streaming': True,
                'enable_caching': True,
                'parallel_workers': 2,
                'memory_limit_mb': 1536,
                'entity_deduplication': 'aggressive',
                'triplet_filtering': 'high_confidence'
            })
        elif dataset_size > 1000:
            # Large dataset optimizations
            config.update({
                'batch_size': 50,
                'use_streaming': True,
                'enable_caching': True,
                'parallel_workers': 3,
                'memory_limit_mb': 2048,
                'entity_deduplication': 'moderate',
                'triplet_filtering': 'medium_confidence'
            })
        else:
            # Standard processing for smaller datasets
            config.update({
                'batch_size': 100,
                'use_streaming': False,
                'enable_caching': False,
                'parallel_workers': 4,
                'memory_limit_mb': 3072,
                'entity_deduplication': 'minimal',
                'triplet_filtering': 'low_confidence'
            })
        
        return config
    
    def cache_entities(self, entities: List[Dict]) -> None:
        """Cache entities for deduplication"""
        for entity in entities:
            key = f"{entity['text']}_{entity['type']}"
            if key not in self.entity_cache:
                self.entity_cache[key] = entity
    
    def get_cached_entity(self, text: str, entity_type: str) -> Optional[Dict]:
        """Get cached entity if exists"""
        key = f"{text}_{entity_type}"
        return self.entity_cache.get(key)
    
    def buffer_triplets(self, triplets: List[Dict]) -> List[List[Dict]]:
        """Buffer triplets and return full batches for database insertion"""
        self.triplet_buffer.extend(triplets)
        
        batches = []
        while len(self.triplet_buffer) >= self.buffer_size:
            batches.append(self.triplet_buffer[:self.buffer_size])
            self.triplet_buffer = self.triplet_buffer[self.buffer_size:]
        
        return batches
    
    def flush_triplet_buffer(self) -> List[Dict]:
        """Return and clear remaining triplets in buffer"""
        remaining = self.triplet_buffer.copy()
        self.triplet_buffer.clear()
        return remaining


class DatabaseOptimizer:
    """Database optimization utilities for large-scale operations"""
    
    @staticmethod
    def bulk_create_entities(entities: List[PatentEntityExtraction], batch_size: int = 1000):
        """Optimized bulk creation of entities"""
        total_entities = len(entities)
        
        for i in range(0, total_entities, batch_size):
            batch = entities[i:i + batch_size]
            with transaction.atomic():
                PatentEntityExtraction.objects.bulk_create(
                    batch, 
                    ignore_conflicts=True,
                    batch_size=batch_size
                )
            
            # Log progress
            logger.info(f"Created entities batch {i // batch_size + 1}/{(total_entities + batch_size - 1) // batch_size}")
    
    @staticmethod
    def bulk_create_triplets(triplets: List[PatentTriplet], batch_size: int = 500):
        """Optimized bulk creation of triplets"""
        total_triplets = len(triplets)
        
        for i in range(0, total_triplets, batch_size):
            batch = triplets[i:i + batch_size]
            with transaction.atomic():
                PatentTriplet.objects.bulk_create(
                    batch, 
                    ignore_conflicts=True,
                    batch_size=batch_size
                )
            
            logger.info(f"Created triplets batch {i // batch_size + 1}/{(total_triplets + batch_size - 1) // batch_size}")
    
    @staticmethod
    def optimize_database_connection():
        """Optimize database connection for bulk operations"""
        if connection.vendor != 'postgresql':
            return
        with connection.cursor() as cursor:
            # Increase work_mem for complex operations
            cursor.execute("SET work_mem = '256MB'")
            # Increase maintenance_work_mem for bulk operations
            cursor.execute("SET maintenance_work_mem = '512MB'")
            # Disable fsync for faster writes (only for non-production)
            if settings.DEBUG:
                cursor.execute("SET fsync = off")


class CachingStrategy:
    """Intelligent caching for patent processing"""
    
    def __init__(self, cache_prefix: str = "patent_processing"):
        self.cache_prefix = cache_prefix
        self.cache_timeout = 3600  # 1 hour
    
    def cache_processing_results(self, pipeline_id: str, results: Dict):
        """Cache processing results"""
        cache_key = f"{self.cache_prefix}:results:{pipeline_id}"
        cache.set(cache_key, results, self.cache_timeout)
    
    def get_cached_results(self, pipeline_id: str) -> Optional[Dict]:
        """Get cached processing results"""
        cache_key = f"{self.cache_prefix}:results:{pipeline_id}"
        return cache.get(cache_key)
    
    def cache_entity_embeddings(self, entities: List[Dict]):
        """Cache entity embeddings for similarity calculations"""
        for entity in entities:
            cache_key = f"{self.cache_prefix}:embedding:{hash(entity['text'])}"
            if not cache.get(cache_key):
                # Store placeholder - in real implementation, calculate embedding
                cache.set(cache_key, {'computed': True, 'vector': []}, self.cache_timeout)
    
    def invalidate_pipeline_cache(self, pipeline_id: str):
        """Invalidate all cache entries for a pipeline"""
        cache_key = f"{self.cache_prefix}:results:{pipeline_id}"
        cache.delete(cache_key)


class StreamingProcessor:
    """Streaming processor for very large datasets"""
    
    def __init__(self, chunk_size: int = 10):
        self.chunk_size = chunk_size
    
    def stream_patents(self, dataset_id: str) -> Iterator[List[Dict]]:
        """Stream patents in chunks to avoid loading all in memory"""
        
        # Use database streaming with select_related for efficiency
        patents = PatentRecord.objects.filter(
            dataset_id=dataset_id
        ).select_related('dataset').only(
            'id', 'patent_id', 'title', 'abstract', 'claims'
        ).order_by('id')
        
        chunk = []
        for patent in patents.iterator(chunk_size=self.chunk_size):
            chunk.append({
                'patent_id': patent.patent_id,
                'title': patent.title or '',
                'abstract': patent.abstract or '',
                'claims': patent.claims or '',
                'record_id': patent.id
            })
            
            if len(chunk) >= self.chunk_size:
                yield chunk
                chunk = []
        
        # Yield remaining patents
        if chunk:
            yield chunk
    
    def process_streaming(self, dataset_id: str, processing_func, config: Dict) -> Iterator[Dict]:
        """Process patents using streaming approach"""
        
        for chunk in self.stream_patents(dataset_id):
            start_time = time.time()
            
            try:
                result = processing_func(chunk, config)
                result['chunk_processing_time'] = time.time() - start_time
                result['chunk_size'] = len(chunk)
                
                yield result
                
                # Memory cleanup after each chunk
                gc.collect()
                
            except Exception as e:
                logger.error(f"Chunk processing failed: {e}")
                yield {
                    'error': str(e),
                    'chunk_size': len(chunk),
                    'failed_patents': [p['patent_id'] for p in chunk]
                }


class PerformanceMonitor:
    """Monitor and log performance metrics"""
    
    def __init__(self):
        self.start_time = None
        self.checkpoint_times = []
        self.memory_usage = []
        self.processing_rates = []
    
    def start_monitoring(self):
        """Start performance monitoring"""
        self.start_time = time.time()
        self.checkpoint_times = []
        self.memory_usage = []
        self.processing_rates = []
    
    def checkpoint(self, stage: str, processed_items: int = 0):
        """Record a performance checkpoint"""
        current_time = time.time()
        elapsed = current_time - self.start_time if self.start_time else 0
        
        checkpoint = {
            'stage': stage,
            'timestamp': current_time,
            'elapsed_time': elapsed,
            'processed_items': processed_items
        }
        
        # Calculate processing rate
        if processed_items > 0 and elapsed > 0:
            rate = processed_items / elapsed
            checkpoint['processing_rate'] = rate
            self.processing_rates.append(rate)
        
        # Record memory usage if available
        try:
            import psutil
            process = psutil.Process()
            memory_mb = process.memory_info().rss / 1024 / 1024
            checkpoint['memory_mb'] = memory_mb
            self.memory_usage.append(memory_mb)
        except ImportError:
            pass
        
        self.checkpoint_times.append(checkpoint)
        logger.info(f"Performance checkpoint - {stage}: {elapsed:.2f}s, {processed_items} items")
    
    def get_performance_summary(self) -> Dict:
        """Get performance monitoring summary"""
        if not self.start_time or not self.checkpoint_times:
            return {}
        
        total_time = time.time() - self.start_time
        
        return {
            'total_processing_time': total_time,
            'checkpoints': len(self.checkpoint_times),
            'average_processing_rate': np.mean(self.processing_rates) if self.processing_rates else 0,
            'peak_memory_mb': max(self.memory_usage) if self.memory_usage else 0,
            'stages': self.checkpoint_times,
            'efficiency_score': self._calculate_efficiency_score()
        }
    
    def _calculate_efficiency_score(self) -> float:
        """Calculate overall processing efficiency score (0-1)"""
        if not self.processing_rates:
            return 0.0
        
        # Simple efficiency metric based on consistency and speed
        rate_consistency = 1.0 - (np.std(self.processing_rates) / max(np.mean(self.processing_rates), 1))
        avg_rate = np.mean(self.processing_rates)
        
        # Normalize to 0-1 range (assuming 10 patents/second is excellent)
        speed_score = min(avg_rate / 10.0, 1.0)
        
        return (rate_consistency * 0.4 + speed_score * 0.6)


class OptimizedAgenticProcessor:
    """Optimized version of the agentic processor for large datasets"""
    
    def __init__(self, config: Dict = None):
        self.config = config or {}
        self.batch_processor = BatchProcessor(
            batch_size=self.config.get('batch_size', 50),
            max_workers=self.config.get('parallel_workers', 3)
        )
        self.memory_manager = MemoryManager(
            max_memory_mb=self.config.get('memory_limit_mb', 2048)
        )
        self.db_optimizer = DatabaseOptimizer()
        self.cache_strategy = CachingStrategy()
        self.performance_monitor = PerformanceMonitor()
        self.streaming_processor = StreamingProcessor(
            chunk_size=self.config.get('stream_chunk_size', 10)
        )
    
    def process_large_dataset(self, dataset_id: str, pipeline_id: str, processing_config: Dict) -> Dict:
        """Optimized processing for large datasets"""
        
        # Start performance monitoring
        self.performance_monitor.start_monitoring()
        
        # Check for cached results
        cached_results = self.cache_strategy.get_cached_results(pipeline_id)
        if cached_results and not self.config.get('force_reprocess'):
            logger.info("Using cached processing results")
            return cached_results
        
        # Optimize database connection
        self.db_optimizer.optimize_database_connection()
        
        # Get dataset size for optimization
        dataset_size = PatentRecord.objects.filter(dataset_id=dataset_id).count()
        optimization_config = self.memory_manager.optimize_for_large_dataset(dataset_size)
        
        # Merge optimization config with processing config
        merged_config = {**processing_config, **optimization_config}
        
        logger.info(f"Processing {dataset_size} patents with optimized config: {optimization_config}")
        
        # Choose processing strategy based on dataset size
        if dataset_size > 5000 and merged_config.get('use_streaming'):
            return self._process_with_streaming(dataset_id, merged_config)
        else:
            return self._process_with_batching(dataset_id, merged_config)
    
    def _process_with_streaming(self, dataset_id: str, config: Dict) -> Dict:
        """Process using streaming for very large datasets"""
        
        from .agents import create_agentic_pipeline
        orchestrator = create_agentic_pipeline()
        
        aggregated_results = {
            'processed_patents': [],
            'all_entities': [],
            'all_triplets': [],
            'statistics': {},
            'performance_metrics': {}
        }
        
        chunk_count = 0
        total_processing_time = 0
        
        # Process in streaming chunks
        for chunk_result in self.streaming_processor.process_streaming(
            dataset_id, 
            orchestrator.process_patents, 
            config
        ):
            chunk_count += 1
            
            if 'error' not in chunk_result:
                # Merge successful chunk results
                aggregated_results['processed_patents'].extend(
                    chunk_result.get('processed_patents', [])
                )
                
                # Buffer entities and triplets for efficient DB operations
                if chunk_result.get('all_entities'):
                    self.memory_manager.cache_entities(chunk_result['all_entities'])
                    aggregated_results['all_entities'].extend(chunk_result['all_entities'])
                
                if chunk_result.get('all_triplets'):
                    triplet_batches = self.memory_manager.buffer_triplets(chunk_result['all_triplets'])
                    for batch in triplet_batches:
                        self._save_triplet_batch(batch)
                
                total_processing_time += chunk_result.get('chunk_processing_time', 0)
                
                # Performance checkpoint
                self.performance_monitor.checkpoint(
                    f"Chunk {chunk_count}",
                    len(aggregated_results['processed_patents'])
                )
                
                # Memory check
                if not self.memory_manager.check_memory_usage():
                    logger.warning("Memory usage high, forcing garbage collection")
                    gc.collect()
            
            else:
                logger.error(f"Chunk {chunk_count} failed: {chunk_result['error']}")
        
        # Process remaining buffered triplets
        remaining_triplets = self.memory_manager.flush_triplet_buffer()
        if remaining_triplets:
            self._save_triplet_batch(remaining_triplets)
        
        # Generate final statistics
        aggregated_results['statistics'] = self._generate_optimized_statistics(aggregated_results)
        aggregated_results['performance_metrics'] = self.performance_monitor.get_performance_summary()
        
        # Cache results for future use
        self.cache_strategy.cache_processing_results(str(pipeline_id), aggregated_results)
        
        return aggregated_results
    
    def _process_with_batching(self, dataset_id: str, config: Dict) -> Dict:
        """Process using batch processing for moderate datasets"""
        
        # Load all patents (for moderate datasets this is acceptable)
        patents = list(PatentRecord.objects.filter(dataset_id=dataset_id).values(
            'id', 'patent_id', 'title', 'abstract', 'claims'
        ))
        
        patent_data = [
            {
                'patent_id': p['patent_id'],
                'title': p['title'] or '',
                'abstract': p['abstract'] or '',
                'claims': p['claims'] or '',
                'record_id': p['id']
            }
            for p in patents
        ]
        
        # Process in batches
        from .agents import create_agentic_pipeline
        orchestrator = create_agentic_pipeline()
        
        aggregated_results = {
            'processed_patents': [],
            'all_entities': [],
            'all_triplets': [],
            'batch_results': []
        }
        
        for batch in self.batch_processor.create_batches(patent_data):
            logger.info(f"Processing batch {batch.batch_id}/{batch.total_batches}")
            
            try:
                batch_result = self.batch_processor.process_batch_parallel(
                    batch, orchestrator.process_patents, config
                )
                
                # Merge results
                aggregated_results['processed_patents'].extend(batch_result.get('processed_patents', []))
                aggregated_results['all_entities'].extend(batch_result.get('all_entities', []))
                aggregated_results['all_triplets'].extend(batch_result.get('all_triplets', []))
                aggregated_results['batch_results'].append({
                    'batch_id': batch.batch_id,
                    'processing_time': batch_result.get('processing_time', 0),
                    'patents_processed': len(batch.patents),
                    'entities_extracted': len(batch_result.get('all_entities', [])),
                    'triplets_found': len(batch_result.get('all_triplets', []))
                })
                
                # Performance checkpoint
                self.performance_monitor.checkpoint(
                    f"Batch {batch.batch_id}",
                    self.batch_processor.processed_count
                )
                
            except Exception as e:
                logger.error(f"Batch {batch.batch_id} processing failed: {e}")
                aggregated_results['batch_results'].append({
                    'batch_id': batch.batch_id,
                    'error': str(e),
                    'patents_processed': 0
                })
        
        # Generate statistics and performance metrics
        aggregated_results['statistics'] = self._generate_optimized_statistics(aggregated_results)
        aggregated_results['performance_metrics'] = self.performance_monitor.get_performance_summary()
        
        return aggregated_results
    
    def _save_triplet_batch(self, triplets: List[Dict]):
        """Save a batch of triplets to database efficiently"""
        # This would be implemented with actual database saving logic
        # For now, just log the operation
        logger.info(f"Saving {len(triplets)} triplets to database")
    
    def _generate_optimized_statistics(self, results: Dict) -> Dict:
        """Generate statistics optimized for large datasets"""
        
        successful_patents = [p for p in results['processed_patents'] if p.get('processing_status') == 'completed']
        
        stats = {
            'total_patents': len(results['processed_patents']),
            'successful_patents': len(successful_patents),
            'total_entities': len(results['all_entities']),
            'total_triplets': len(results['all_triplets']),
            'processing_efficiency': len(successful_patents) / max(1, len(results['processed_patents'])),
            'entities_per_patent': len(results['all_entities']) / max(1, len(successful_patents)),
            'triplets_per_patent': len(results['all_triplets']) / max(1, len(successful_patents))
        }
        
        # Add batch-specific statistics if available
        if 'batch_results' in results:
            batch_times = [b.get('processing_time', 0) for b in results['batch_results'] if 'processing_time' in b]
            if batch_times:
                stats['avg_batch_time'] = np.mean(batch_times)
                stats['total_batches'] = len(results['batch_results'])
        
        return stats


def create_optimized_processor(dataset_size: int, config: Dict = None) -> OptimizedAgenticProcessor:
    """Factory function to create optimized processor based on dataset size"""
    
    if config is None:
        config = {}
    
    # Auto-configure based on dataset size
    memory_manager = MemoryManager()
    optimization_config = memory_manager.optimize_for_large_dataset(dataset_size)
    
    # Merge configs
    final_config = {**config, **optimization_config}
    
    return OptimizedAgenticProcessor(final_config)