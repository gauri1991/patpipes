"""
Workflow Caching System
Redis-based caching for workflow states, analytics, and performance optimization
"""

import json
import pickle
import logging
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timedelta
from decimal import Decimal

from django.core.cache import cache
from django.core.serializers.json import DjangoJSONEncoder
from django.utils import timezone
from django.conf import settings

from .models import WorkflowInstance, WorkflowStepInstance, WorkflowTemplate

logger = logging.getLogger(__name__)


class WorkflowCacheManager:
    """
    Centralized cache manager for workflow-related data
    """
    
    # Cache key prefixes
    WORKFLOW_PREFIX = "workflow"
    STEP_PREFIX = "workflow_step"
    TEMPLATE_PREFIX = "workflow_template" 
    ANALYTICS_PREFIX = "workflow_analytics"
    METRICS_PREFIX = "workflow_metrics"
    USER_PREFIX = "workflow_user"
    QUEUE_PREFIX = "workflow_queue"
    
    # Cache timeouts (in seconds)
    SHORT_TIMEOUT = 300      # 5 minutes
    MEDIUM_TIMEOUT = 1800    # 30 minutes  
    LONG_TIMEOUT = 3600      # 1 hour
    DAILY_TIMEOUT = 86400    # 24 hours
    WEEKLY_TIMEOUT = 604800  # 7 days
    
    @classmethod
    def get_cache_key(cls, prefix: str, *args) -> str:
        """Generate standardized cache key"""
        return f"{prefix}::{':'.join(str(arg) for arg in args)}"
    
    @classmethod
    def set_cached_data(cls, key: str, data: Any, timeout: int = MEDIUM_TIMEOUT, compress: bool = False) -> bool:
        """
        Set data in cache with optional compression
        """
        try:
            if compress and isinstance(data, (dict, list)):
                # Use pickle for complex objects
                serialized_data = pickle.dumps(data)
                cache.set(f"{key}:compressed", serialized_data, timeout)
                cache.set(f"{key}:is_compressed", True, timeout)
            else:
                # Use standard JSON serialization
                cache.set(key, data, timeout)
            return True
        except Exception as e:
            logger.error(f"Error caching data for key {key}: {e}")
            return False
    
    @classmethod
    def get_cached_data(cls, key: str, default: Any = None) -> Any:
        """
        Get data from cache with automatic decompression
        """
        try:
            # Check if data is compressed
            if cache.get(f"{key}:is_compressed"):
                compressed_data = cache.get(f"{key}:compressed")
                if compressed_data:
                    return pickle.loads(compressed_data)
            else:
                return cache.get(key, default)
        except Exception as e:
            logger.error(f"Error retrieving cached data for key {key}: {e}")
            return default
    
    @classmethod
    def delete_cached_data(cls, key: str) -> bool:
        """Delete data from cache"""
        try:
            cache.delete(key)
            # Also delete compressed version if exists
            cache.delete(f"{key}:compressed")
            cache.delete(f"{key}:is_compressed")
            return True
        except Exception as e:
            logger.error(f"Error deleting cached data for key {key}: {e}")
            return False
    
    @classmethod
    def invalidate_pattern(cls, pattern: str) -> int:
        """
        Invalidate cache keys matching a pattern
        Note: This requires Redis and django-redis
        """
        try:
            from django_redis import get_redis_connection
            redis_conn = get_redis_connection("default")
            
            keys = redis_conn.keys(pattern)
            if keys:
                return redis_conn.delete(*keys)
            return 0
        except ImportError:
            logger.warning("django-redis not available, using individual key deletion")
            return 0
        except Exception as e:
            logger.error(f"Error invalidating cache pattern {pattern}: {e}")
            return 0


class WorkflowStateCache:
    """
    Cache manager specifically for workflow states and execution data
    """
    
    @classmethod
    def cache_workflow_state(cls, workflow_id: str, state_data: Dict[str, Any]) -> bool:
        """Cache complete workflow state"""
        key = WorkflowCacheManager.get_cache_key(
            WorkflowCacheManager.WORKFLOW_PREFIX, 
            workflow_id, 
            "state"
        )
        
        # Add timestamp to state data
        state_data['cached_at'] = timezone.now().isoformat()
        
        return WorkflowCacheManager.set_cached_data(
            key, 
            state_data, 
            timeout=WorkflowCacheManager.MEDIUM_TIMEOUT,
            compress=True
        )
    
    @classmethod
    def get_workflow_state(cls, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Get cached workflow state"""
        key = WorkflowCacheManager.get_cache_key(
            WorkflowCacheManager.WORKFLOW_PREFIX, 
            workflow_id, 
            "state"
        )
        return WorkflowCacheManager.get_cached_data(key)
    
    @classmethod
    def cache_step_progress(cls, step_id: str, progress_data: Dict[str, Any]) -> bool:
        """Cache step progress data"""
        key = WorkflowCacheManager.get_cache_key(
            WorkflowCacheManager.STEP_PREFIX, 
            step_id, 
            "progress"
        )
        
        progress_data['updated_at'] = timezone.now().isoformat()
        
        return WorkflowCacheManager.set_cached_data(
            key, 
            progress_data, 
            timeout=WorkflowCacheManager.SHORT_TIMEOUT
        )
    
    @classmethod
    def get_step_progress(cls, step_id: str) -> Optional[Dict[str, Any]]:
        """Get cached step progress"""
        key = WorkflowCacheManager.get_cache_key(
            WorkflowCacheManager.STEP_PREFIX, 
            step_id, 
            "progress"
        )
        return WorkflowCacheManager.get_cached_data(key)
    
    @classmethod
    def cache_workflow_execution_queue(cls, queue_name: str, queue_data: List[Dict[str, Any]]) -> bool:
        """Cache workflow execution queue"""
        key = WorkflowCacheManager.get_cache_key(
            WorkflowCacheManager.QUEUE_PREFIX, 
            queue_name
        )
        
        queue_info = {
            'queue_data': queue_data,
            'queue_length': len(queue_data),
            'updated_at': timezone.now().isoformat()
        }
        
        return WorkflowCacheManager.set_cached_data(
            key, 
            queue_info, 
            timeout=WorkflowCacheManager.SHORT_TIMEOUT
        )
    
    @classmethod
    def get_workflow_execution_queue(cls, queue_name: str) -> Optional[Dict[str, Any]]:
        """Get cached workflow execution queue"""
        key = WorkflowCacheManager.get_cache_key(
            WorkflowCacheManager.QUEUE_PREFIX, 
            queue_name
        )
        return WorkflowCacheManager.get_cached_data(key)
    
    @classmethod
    def invalidate_workflow_cache(cls, workflow_id: str) -> bool:
        """Invalidate all cache entries for a workflow"""
        try:
            pattern = f"{WorkflowCacheManager.WORKFLOW_PREFIX}::{workflow_id}::*"
            WorkflowCacheManager.invalidate_pattern(pattern)
            
            # Also invalidate related step caches
            workflow = WorkflowInstance.objects.get(id=workflow_id)
            for step in workflow.step_instances.all():
                cls.invalidate_step_cache(str(step.id))
            
            return True
        except Exception as e:
            logger.error(f"Error invalidating workflow cache {workflow_id}: {e}")
            return False
    
    @classmethod
    def invalidate_step_cache(cls, step_id: str) -> bool:
        """Invalidate all cache entries for a workflow step"""
        try:
            pattern = f"{WorkflowCacheManager.STEP_PREFIX}::{step_id}::*"
            WorkflowCacheManager.invalidate_pattern(pattern)
            return True
        except Exception as e:
            logger.error(f"Error invalidating step cache {step_id}: {e}")
            return False


class WorkflowAnalyticsCache:
    """
    Cache manager for workflow analytics and reporting data
    """
    
    @classmethod
    def cache_dashboard_analytics(cls, organization_id: Optional[str] = None, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Cache dashboard analytics data"""
        from .analytics import WorkflowAnalyticsEngine
        
        analytics_engine = WorkflowAnalyticsEngine()
        
        # Generate cache key based on context
        key_parts = [WorkflowCacheManager.ANALYTICS_PREFIX, "dashboard"]
        if organization_id:
            key_parts.append(f"org_{organization_id}")
        if user_id:
            key_parts.append(f"user_{user_id}")
        
        cache_key = WorkflowCacheManager.get_cache_key(*key_parts)
        
        # Check if cached data exists and is fresh
        cached_data = WorkflowCacheManager.get_cached_data(cache_key)
        if cached_data:
            cached_time = datetime.fromisoformat(cached_data.get('generated_at', ''))
            if timezone.now() - cached_time < timedelta(minutes=15):
                return cached_data
        
        # Generate fresh analytics data
        try:
            dashboard_data = analytics_engine.get_progress_dashboard(
                organization_id=organization_id,
                user_id=user_id
            )
            
            # Convert to cacheable format
            cache_data = {
                'dashboard_data': dashboard_data.__dict__,
                'generated_at': timezone.now().isoformat(),
                'organization_id': organization_id,
                'user_id': user_id
            }
            
            WorkflowCacheManager.set_cached_data(
                cache_key,
                cache_data,
                timeout=WorkflowCacheManager.MEDIUM_TIMEOUT,
                compress=True
            )
            
            return cache_data
            
        except Exception as e:
            logger.error(f"Error generating dashboard analytics: {e}")
            return cached_data or {}
    
    @classmethod
    def cache_realtime_metrics(cls) -> Dict[str, Any]:
        """Cache real-time workflow metrics"""
        from .analytics import WorkflowAnalyticsEngine
        
        cache_key = WorkflowCacheManager.get_cache_key(
            WorkflowCacheManager.METRICS_PREFIX, 
            "realtime"
        )
        
        try:
            analytics_engine = WorkflowAnalyticsEngine()
            metrics = analytics_engine.get_realtime_metrics()
            
            cache_data = {
                'metrics': metrics,
                'timestamp': timezone.now().isoformat()
            }
            
            WorkflowCacheManager.set_cached_data(
                cache_key,
                cache_data,
                timeout=WorkflowCacheManager.SHORT_TIMEOUT
            )
            
            return cache_data
            
        except Exception as e:
            logger.error(f"Error caching realtime metrics: {e}")
            return {}
    
    @classmethod
    def get_realtime_metrics(cls) -> Optional[Dict[str, Any]]:
        """Get cached real-time metrics"""
        cache_key = WorkflowCacheManager.get_cache_key(
            WorkflowCacheManager.METRICS_PREFIX, 
            "realtime"
        )
        return WorkflowCacheManager.get_cached_data(cache_key)
    
    @classmethod
    def cache_template_statistics(cls, template_id: str) -> Dict[str, Any]:
        """Cache workflow template usage statistics"""
        cache_key = WorkflowCacheManager.get_cache_key(
            WorkflowCacheManager.TEMPLATE_PREFIX, 
            template_id, 
            "stats"
        )
        
        try:
            template = WorkflowTemplate.objects.get(id=template_id)
            
            # Calculate statistics
            instances = template.instances.all()
            total_instances = instances.count()
            completed_instances = instances.filter(status='completed').count()
            
            if total_instances > 0:
                success_rate = (completed_instances / total_instances) * 100
                avg_duration = instances.filter(
                    actual_duration__isnull=False
                ).aggregate(
                    avg_duration=models.Avg('actual_duration')
                )['avg_duration'] or 0
            else:
                success_rate = 0
                avg_duration = 0
            
            stats_data = {
                'template_id': template_id,
                'total_instances': total_instances,
                'completed_instances': completed_instances,
                'success_rate': float(success_rate),
                'average_duration': float(avg_duration),
                'usage_count': template.usage_count,
                'last_used': template.instances.order_by('-created_at').first().created_at.isoformat() if total_instances > 0 else None,
                'generated_at': timezone.now().isoformat()
            }
            
            WorkflowCacheManager.set_cached_data(
                cache_key,
                stats_data,
                timeout=WorkflowCacheManager.LONG_TIMEOUT
            )
            
            return stats_data
            
        except Exception as e:
            logger.error(f"Error caching template statistics for {template_id}: {e}")
            return {}
    
    @classmethod
    def get_template_statistics(cls, template_id: str) -> Optional[Dict[str, Any]]:
        """Get cached template statistics"""
        cache_key = WorkflowCacheManager.get_cache_key(
            WorkflowCacheManager.TEMPLATE_PREFIX, 
            template_id, 
            "stats"
        )
        return WorkflowCacheManager.get_cached_data(cache_key)
    
    @classmethod
    def cache_user_workflow_summary(cls, user_id: str) -> Dict[str, Any]:
        """Cache user-specific workflow summary"""
        cache_key = WorkflowCacheManager.get_cache_key(
            WorkflowCacheManager.USER_PREFIX, 
            user_id, 
            "summary"
        )
        
        try:
            from django.db.models import Count, Q
            from django.contrib.auth import get_user_model
            
            User = get_user_model()
            user = User.objects.get(id=user_id)
            
            # Get user's workflow statistics
            assigned_workflows = WorkflowInstance.objects.filter(assigned_to=user)
            assigned_steps = WorkflowStepInstance.objects.filter(assigned_to=user)
            
            workflow_stats = assigned_workflows.aggregate(
                total=Count('id'),
                active=Count('id', filter=Q(status__in=['pending', 'in_progress'])),
                completed=Count('id', filter=Q(status='completed')),
                overdue=Count('id', filter=Q(
                    due_date__lt=timezone.now().date(),
                    status__in=['pending', 'in_progress']
                ))
            )
            
            step_stats = assigned_steps.aggregate(
                total=Count('id'),
                pending=Count('id', filter=Q(status='pending')),
                in_progress=Count('id', filter=Q(status='in_progress')),
                completed=Count('id', filter=Q(status='completed'))
            )
            
            summary_data = {
                'user_id': user_id,
                'workflow_stats': workflow_stats,
                'step_stats': step_stats,
                'generated_at': timezone.now().isoformat()
            }
            
            WorkflowCacheManager.set_cached_data(
                cache_key,
                summary_data,
                timeout=WorkflowCacheManager.MEDIUM_TIMEOUT
            )
            
            return summary_data
            
        except Exception as e:
            logger.error(f"Error caching user workflow summary for {user_id}: {e}")
            return {}
    
    @classmethod
    def get_user_workflow_summary(cls, user_id: str) -> Optional[Dict[str, Any]]:
        """Get cached user workflow summary"""
        cache_key = WorkflowCacheManager.get_cache_key(
            WorkflowCacheManager.USER_PREFIX, 
            user_id, 
            "summary"
        )
        return WorkflowCacheManager.get_cached_data(cache_key)


class WorkflowCacheInvalidation:
    """
    Handle cache invalidation for workflow-related operations
    """
    
    @classmethod
    def on_workflow_updated(cls, workflow_instance: WorkflowInstance):
        """Invalidate caches when workflow is updated"""
        workflow_id = str(workflow_instance.id)
        
        # Invalidate workflow state cache
        WorkflowStateCache.invalidate_workflow_cache(workflow_id)
        
        # Invalidate analytics caches
        WorkflowCacheManager.invalidate_pattern(
            f"{WorkflowCacheManager.ANALYTICS_PREFIX}::*"
        )
        WorkflowCacheManager.invalidate_pattern(
            f"{WorkflowCacheManager.METRICS_PREFIX}::*"
        )
        
        # Invalidate user summaries for related users
        if workflow_instance.assigned_to:
            user_cache_key = WorkflowCacheManager.get_cache_key(
                WorkflowCacheManager.USER_PREFIX, 
                str(workflow_instance.assigned_to.id), 
                "summary"
            )
            WorkflowCacheManager.delete_cached_data(user_cache_key)
        
        # Invalidate template statistics
        template_cache_key = WorkflowCacheManager.get_cache_key(
            WorkflowCacheManager.TEMPLATE_PREFIX, 
            str(workflow_instance.workflow_template.id), 
            "stats"
        )
        WorkflowCacheManager.delete_cached_data(template_cache_key)
    
    @classmethod
    def on_step_updated(cls, step_instance: WorkflowStepInstance):
        """Invalidate caches when workflow step is updated"""
        step_id = str(step_instance.id)
        workflow_id = str(step_instance.workflow_instance.id)
        
        # Invalidate step progress cache
        WorkflowStateCache.invalidate_step_cache(step_id)
        
        # Invalidate parent workflow cache
        WorkflowStateCache.invalidate_workflow_cache(workflow_id)
        
        # Invalidate real-time metrics
        metrics_key = WorkflowCacheManager.get_cache_key(
            WorkflowCacheManager.METRICS_PREFIX, 
            "realtime"
        )
        WorkflowCacheManager.delete_cached_data(metrics_key)
    
    @classmethod
    def on_template_updated(cls, workflow_template: WorkflowTemplate):
        """Invalidate caches when template is updated"""
        template_id = str(workflow_template.id)
        
        # Invalidate template statistics
        template_cache_key = WorkflowCacheManager.get_cache_key(
            WorkflowCacheManager.TEMPLATE_PREFIX, 
            template_id, 
            "stats"
        )
        WorkflowCacheManager.delete_cached_data(template_cache_key)
        
        # Invalidate dashboard analytics that might include template data
        WorkflowCacheManager.invalidate_pattern(
            f"{WorkflowCacheManager.ANALYTICS_PREFIX}::dashboard::*"
        )


# Utility functions for easy cache access

def get_workflow_progress_cached(workflow_id: str) -> Optional[Dict[str, Any]]:
    """Get cached workflow progress or fetch from database"""
    cached_state = WorkflowStateCache.get_workflow_state(workflow_id)
    
    if cached_state:
        return cached_state
    
    # Fallback to database
    try:
        workflow = WorkflowInstance.objects.get(id=workflow_id)
        state_data = {
            'id': str(workflow.id),
            'name': workflow.name,
            'status': workflow.status,
            'progress_percentage': workflow.progress_percentage,
            'current_step_order': workflow.current_step_order,
            'quality_score': workflow.quality_score,
            'updated_at': workflow.updated_at.isoformat()
        }
        
        # Cache for next time
        WorkflowStateCache.cache_workflow_state(workflow_id, state_data)
        return state_data
        
    except WorkflowInstance.DoesNotExist:
        return None


def get_realtime_workflow_metrics() -> Dict[str, Any]:
    """Get real-time workflow metrics from cache or generate fresh"""
    cached_metrics = WorkflowAnalyticsCache.get_realtime_metrics()
    
    if cached_metrics:
        # Check if cache is fresh (less than 2 minutes old)
        cached_time = datetime.fromisoformat(cached_metrics.get('timestamp', ''))
        if timezone.now() - cached_time < timedelta(minutes=2):
            return cached_metrics['metrics']
    
    # Generate fresh metrics
    return WorkflowAnalyticsCache.cache_realtime_metrics()['metrics']


def warm_up_caches():
    """Warm up commonly accessed caches"""
    try:
        # Warm up real-time metrics
        WorkflowAnalyticsCache.cache_realtime_metrics()
        
        # Warm up dashboard analytics for system-wide view
        WorkflowAnalyticsCache.cache_dashboard_analytics()
        
        # Warm up template statistics for active templates
        active_templates = WorkflowTemplate.objects.filter(is_active=True)
        for template in active_templates[:10]:  # Limit to top 10 templates
            WorkflowAnalyticsCache.cache_template_statistics(str(template.id))
        
        logger.info("Cache warm-up completed successfully")
        
    except Exception as e:
        logger.error(f"Error during cache warm-up: {e}")