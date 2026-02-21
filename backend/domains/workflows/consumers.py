"""
WebSocket Consumers for Real-time Workflow Updates
Django Channels consumers for live workflow progress tracking
"""

import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser

from .models import WorkflowInstance, WorkflowStepInstance
from .permissions import workflow_permission_manager, WorkflowPermission
from .cache import WorkflowStateCache, WorkflowAnalyticsCache

User = get_user_model()
logger = logging.getLogger(__name__)


class WorkflowUpdatesConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time workflow updates
    """
    
    async def connect(self):
        """Handle WebSocket connection"""
        try:
            # Get user from scope
            self.user = self.scope.get("user")
            
            if not self.user or isinstance(self.user, AnonymousUser):
                await self.close()
                return
            
            # Extract workflow ID from URL route
            self.workflow_id = self.scope['url_route']['kwargs'].get('workflow_id')
            
            if not self.workflow_id:
                await self.close()
                return
            
            # Check user permissions for this workflow
            has_permission = await self.check_workflow_permission(
                self.user, 
                self.workflow_id, 
                WorkflowPermission.VIEW_WORKFLOW
            )
            
            if not has_permission:
                await self.close()
                return
            
            # Join workflow-specific group
            self.group_name = f"workflow_{self.workflow_id}"
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            
            # Also join general workflow updates if user has permission
            if await self.check_system_permission(self.user, WorkflowPermission.VIEW_ANALYTICS):
                await self.channel_layer.group_add(
                    "workflow_updates",
                    self.channel_name
                )
            
            await self.accept()
            
            # Send initial workflow state
            await self.send_workflow_state()
            
            logger.info(f"User {self.user.id} connected to workflow {self.workflow_id}")
            
        except Exception as e:
            logger.error(f"Error connecting to workflow WebSocket: {e}")
            await self.close()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        try:
            # Leave workflow group
            if hasattr(self, 'group_name'):
                await self.channel_layer.group_discard(
                    self.group_name,
                    self.channel_name
                )
            
            # Leave general updates group
            await self.channel_layer.group_discard(
                "workflow_updates",
                self.channel_name
            )
            
            logger.info(f"User {self.user.id if hasattr(self, 'user') else 'unknown'} disconnected from workflow WebSocket")
            
        except Exception as e:
            logger.error(f"Error disconnecting from workflow WebSocket: {e}")
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'subscribe_to_step':
                await self.subscribe_to_step(data.get('step_id'))
            elif message_type == 'request_workflow_state':
                await self.send_workflow_state()
            elif message_type == 'request_step_progress':
                await self.send_step_progress(data.get('step_id'))
            elif message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': datetime.now().isoformat()
                }))
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
        except json.JSONDecodeError:
            logger.error("Invalid JSON received in WebSocket")
        except Exception as e:
            logger.error(f"Error processing WebSocket message: {e}")
    
    async def workflow_update(self, event):
        """Send workflow update to WebSocket"""
        try:
            update_data = event.get('update_data', {})
            
            # Add timestamp if not present
            if 'timestamp' not in update_data:
                update_data['timestamp'] = datetime.now().isoformat()
            
            await self.send(text_data=json.dumps({
                'type': 'workflow_update',
                'workflow_id': self.workflow_id,
                'data': update_data
            }))
            
        except Exception as e:
            logger.error(f"Error sending workflow update: {e}")
    
    async def step_update(self, event):
        """Send step update to WebSocket"""
        try:
            step_data = event.get('step_data', {})
            
            await self.send(text_data=json.dumps({
                'type': 'step_update',
                'workflow_id': self.workflow_id,
                'data': step_data
            }))
            
        except Exception as e:
            logger.error(f"Error sending step update: {e}")
    
    async def quality_update(self, event):
        """Send quality check update to WebSocket"""
        try:
            quality_data = event.get('quality_data', {})
            
            await self.send(text_data=json.dumps({
                'type': 'quality_update',
                'workflow_id': self.workflow_id,
                'data': quality_data
            }))
            
        except Exception as e:
            logger.error(f"Error sending quality update: {e}")
    
    async def notification_update(self, event):
        """Send notification update to WebSocket"""
        try:
            notification_data = event.get('notification_data', {})
            
            await self.send(text_data=json.dumps({
                'type': 'notification',
                'data': notification_data
            }))
            
        except Exception as e:
            logger.error(f"Error sending notification update: {e}")
    
    async def subscribe_to_step(self, step_id: str):
        """Subscribe to updates for a specific step"""
        try:
            if not step_id:
                return
            
            # Check if step belongs to this workflow
            step_belongs = await self.check_step_belongs_to_workflow(step_id, self.workflow_id)
            if not step_belongs:
                return
            
            # Join step-specific group
            step_group_name = f"workflow_step_{step_id}"
            await self.channel_layer.group_add(
                step_group_name,
                self.channel_name
            )
            
            # Send current step state
            await self.send_step_progress(step_id)
            
        except Exception as e:
            logger.error(f"Error subscribing to step {step_id}: {e}")
    
    async def send_workflow_state(self):
        """Send current workflow state to client"""
        try:
            workflow_state = await self.get_workflow_state(self.workflow_id)
            
            if workflow_state:
                await self.send(text_data=json.dumps({
                    'type': 'workflow_state',
                    'data': workflow_state
                }))
                
        except Exception as e:
            logger.error(f"Error sending workflow state: {e}")
    
    async def send_step_progress(self, step_id: str):
        """Send current step progress to client"""
        try:
            if not step_id:
                return
                
            step_progress = await self.get_step_progress(step_id)
            
            if step_progress:
                await self.send(text_data=json.dumps({
                    'type': 'step_progress',
                    'data': step_progress
                }))
                
        except Exception as e:
            logger.error(f"Error sending step progress: {e}")
    
    @database_sync_to_async
    def check_workflow_permission(self, user, workflow_id: str, permission: str) -> bool:
        """Check if user has permission for workflow"""
        try:
            workflow = WorkflowInstance.objects.get(id=workflow_id)
            return workflow_permission_manager.has_permission(user, permission, workflow)
        except WorkflowInstance.DoesNotExist:
            return False
        except Exception:
            return False
    
    @database_sync_to_async
    def check_system_permission(self, user, permission: str) -> bool:
        """Check if user has system-level permission"""
        try:
            return workflow_permission_manager.has_permission(user, permission)
        except Exception:
            return False
    
    @database_sync_to_async
    def check_step_belongs_to_workflow(self, step_id: str, workflow_id: str) -> bool:
        """Check if step belongs to workflow"""
        try:
            WorkflowStepInstance.objects.get(
                id=step_id, 
                workflow_instance_id=workflow_id
            )
            return True
        except WorkflowStepInstance.DoesNotExist:
            return False
    
    @database_sync_to_async
    def get_workflow_state(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """Get workflow state from cache or database"""
        try:
            # Try cache first
            cached_state = WorkflowStateCache.get_workflow_state(workflow_id)
            if cached_state:
                return cached_state
            
            # Fallback to database
            workflow = WorkflowInstance.objects.select_related(
                'workflow_template', 'assigned_to'
            ).get(id=workflow_id)
            
            # Get step instances
            steps = list(workflow.step_instances.select_related(
                'workflow_step', 'assigned_to'
            ).order_by('workflow_step__order'))
            
            steps_data = []
            for step in steps:
                steps_data.append({
                    'id': str(step.id),
                    'name': step.workflow_step.name,
                    'status': step.status,
                    'order': step.workflow_step.order,
                    'assigned_to': {
                        'id': str(step.assigned_to.id),
                        'name': step.assigned_to.get_full_name()
                    } if step.assigned_to else None,
                    'start_date': step.start_date.isoformat() if step.start_date else None,
                    'due_date': step.due_date.isoformat() if step.due_date else None,
                    'completed_date': step.completed_date.isoformat() if step.completed_date else None,
                    'quality_score': step.quality_score
                })
            
            workflow_state = {
                'id': str(workflow.id),
                'name': workflow.name,
                'status': workflow.status,
                'priority': workflow.priority,
                'progress_percentage': workflow.progress_percentage,
                'current_step_order': workflow.current_step_order,
                'quality_score': workflow.quality_score,
                'assigned_to': {
                    'id': str(workflow.assigned_to.id),
                    'name': workflow.assigned_to.get_full_name()
                } if workflow.assigned_to else None,
                'start_date': workflow.start_date.isoformat() if workflow.start_date else None,
                'due_date': workflow.due_date.isoformat() if workflow.due_date else None,
                'completed_date': workflow.completed_date.isoformat() if workflow.completed_date else None,
                'template_name': workflow.workflow_template.name,
                'steps': steps_data,
                'updated_at': workflow.updated_at.isoformat()
            }
            
            # Cache for future requests
            WorkflowStateCache.cache_workflow_state(workflow_id, workflow_state)
            
            return workflow_state
            
        except WorkflowInstance.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Error getting workflow state: {e}")
            return None
    
    @database_sync_to_async
    def get_step_progress(self, step_id: str) -> Optional[Dict[str, Any]]:
        """Get step progress from cache or database"""
        try:
            # Try cache first
            cached_progress = WorkflowStateCache.get_step_progress(step_id)
            if cached_progress:
                return cached_progress
            
            # Fallback to database
            step = WorkflowStepInstance.objects.select_related(
                'workflow_step', 'assigned_to', 'workflow_instance'
            ).get(id=step_id)
            
            progress_data = {
                'id': str(step.id),
                'name': step.workflow_step.name,
                'status': step.status,
                'order': step.workflow_step.order,
                'workflow_id': str(step.workflow_instance.id),
                'workflow_name': step.workflow_instance.name,
                'assigned_to': {
                    'id': str(step.assigned_to.id),
                    'name': step.assigned_to.get_full_name()
                } if step.assigned_to else None,
                'start_date': step.start_date.isoformat() if step.start_date else None,
                'due_date': step.due_date.isoformat() if step.due_date else None,
                'completed_date': step.completed_date.isoformat() if step.completed_date else None,
                'actual_hours': float(step.actual_hours) if step.actual_hours else 0,
                'quality_score': step.quality_score,
                'notes': step.notes,
                'updated_at': step.updated_at.isoformat()
            }
            
            # Cache for future requests
            WorkflowStateCache.cache_step_progress(step_id, progress_data)
            
            return progress_data
            
        except WorkflowStepInstance.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Error getting step progress: {e}")
            return None


class WorkflowAnalyticsConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time workflow analytics updates
    """
    
    async def connect(self):
        """Handle WebSocket connection for analytics"""
        try:
            # Get user from scope
            self.user = self.scope.get("user")
            
            if not self.user or isinstance(self.user, AnonymousUser):
                await self.close()
                return
            
            # Check if user has analytics permission
            has_permission = await self.check_analytics_permission(self.user)
            if not has_permission:
                await self.close()
                return
            
            # Join analytics group
            await self.channel_layer.group_add(
                "workflow_analytics",
                self.channel_name
            )
            
            await self.accept()
            
            # Send initial analytics data
            await self.send_analytics_data()
            
            logger.info(f"User {self.user.id} connected to workflow analytics")
            
        except Exception as e:
            logger.error(f"Error connecting to analytics WebSocket: {e}")
            await self.close()
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection for analytics"""
        try:
            # Leave analytics group
            await self.channel_layer.group_discard(
                "workflow_analytics",
                self.channel_name
            )
            
            logger.info(f"User {self.user.id if hasattr(self, 'user') else 'unknown'} disconnected from analytics WebSocket")
            
        except Exception as e:
            logger.error(f"Error disconnecting from analytics WebSocket: {e}")
    
    async def receive(self, text_data):
        """Handle incoming analytics WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'request_analytics':
                await self.send_analytics_data()
            elif message_type == 'request_metrics':
                await self.send_realtime_metrics()
            elif message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': datetime.now().isoformat()
                }))
            
        except json.JSONDecodeError:
            logger.error("Invalid JSON received in analytics WebSocket")
        except Exception as e:
            logger.error(f"Error processing analytics WebSocket message: {e}")
    
    async def analytics_update(self, event):
        """Send analytics update to WebSocket"""
        try:
            analytics_data = event.get('analytics_data', {})
            
            await self.send(text_data=json.dumps({
                'type': 'analytics_update',
                'data': analytics_data,
                'timestamp': datetime.now().isoformat()
            }))
            
        except Exception as e:
            logger.error(f"Error sending analytics update: {e}")
    
    async def metrics_update(self, event):
        """Send metrics update to WebSocket"""
        try:
            metrics_data = event.get('metrics_data', {})
            
            await self.send(text_data=json.dumps({
                'type': 'metrics_update',
                'data': metrics_data,
                'timestamp': datetime.now().isoformat()
            }))
            
        except Exception as e:
            logger.error(f"Error sending metrics update: {e}")
    
    async def send_analytics_data(self):
        """Send current analytics data to client"""
        try:
            analytics_data = await self.get_analytics_data()
            
            if analytics_data:
                await self.send(text_data=json.dumps({
                    'type': 'analytics_data',
                    'data': analytics_data
                }))
                
        except Exception as e:
            logger.error(f"Error sending analytics data: {e}")
    
    async def send_realtime_metrics(self):
        """Send real-time metrics to client"""
        try:
            metrics_data = await self.get_realtime_metrics()
            
            if metrics_data:
                await self.send(text_data=json.dumps({
                    'type': 'realtime_metrics',
                    'data': metrics_data
                }))
                
        except Exception as e:
            logger.error(f"Error sending realtime metrics: {e}")
    
    @database_sync_to_async
    def check_analytics_permission(self, user) -> bool:
        """Check if user has analytics permission"""
        try:
            return workflow_permission_manager.has_permission(user, WorkflowPermission.VIEW_ANALYTICS)
        except Exception:
            return False
    
    @database_sync_to_async
    def get_analytics_data(self) -> Optional[Dict[str, Any]]:
        """Get analytics data from cache"""
        try:
            return WorkflowAnalyticsCache.cache_dashboard_analytics()
        except Exception as e:
            logger.error(f"Error getting analytics data: {e}")
            return None
    
    @database_sync_to_async
    def get_realtime_metrics(self) -> Optional[Dict[str, Any]]:
        """Get real-time metrics from cache"""
        try:
            cached_metrics = WorkflowAnalyticsCache.get_realtime_metrics()
            if cached_metrics:
                return cached_metrics['metrics']
            return WorkflowAnalyticsCache.cache_realtime_metrics()['metrics']
        except Exception as e:
            logger.error(f"Error getting realtime metrics: {e}")
            return None


# Utility functions for sending updates from other parts of the application

async def send_workflow_update_async(workflow_id: str, update_data: Dict[str, Any]):
    """Send workflow update to all connected clients"""
    from channels.layers import get_channel_layer
    from asgiref.sync import async_to_sync
    
    channel_layer = get_channel_layer()
    
    # Send to workflow-specific group
    await channel_layer.group_send(
        f"workflow_{workflow_id}",
        {
            'type': 'workflow_update',
            'update_data': update_data
        }
    )


async def send_step_update_async(step_id: str, step_data: Dict[str, Any]):
    """Send step update to all connected clients"""
    from channels.layers import get_channel_layer
    
    channel_layer = get_channel_layer()
    
    # Send to step-specific group
    await channel_layer.group_send(
        f"workflow_step_{step_id}",
        {
            'type': 'step_update',
            'step_data': step_data
        }
    )


async def send_analytics_update_async(analytics_data: Dict[str, Any]):
    """Send analytics update to all connected analytics clients"""
    from channels.layers import get_channel_layer
    
    channel_layer = get_channel_layer()
    
    await channel_layer.group_send(
        "workflow_analytics",
        {
            'type': 'analytics_update',
            'analytics_data': analytics_data
        }
    )


async def send_quality_update_async(workflow_id: str, quality_data: Dict[str, Any]):
    """Send quality check update to workflow clients"""
    from channels.layers import get_channel_layer
    
    channel_layer = get_channel_layer()
    
    await channel_layer.group_send(
        f"workflow_{workflow_id}",
        {
            'type': 'quality_update',
            'quality_data': quality_data
        }
    )


# Sync versions for use in sync contexts
def send_workflow_update(workflow_id: str, update_data: Dict[str, Any]):
    """Sync version of send_workflow_update_async"""
    from asgiref.sync import async_to_sync
    async_to_sync(send_workflow_update_async)(workflow_id, update_data)


def send_step_update(step_id: str, step_data: Dict[str, Any]):
    """Sync version of send_step_update_async"""
    from asgiref.sync import async_to_sync
    async_to_sync(send_step_update_async)(step_id, step_data)


def send_analytics_update(analytics_data: Dict[str, Any]):
    """Sync version of send_analytics_update_async"""
    from asgiref.sync import async_to_sync
    async_to_sync(send_analytics_update_async)(analytics_data)


def send_quality_update(workflow_id: str, quality_data: Dict[str, Any]):
    """Sync version of send_quality_update_async"""
    from asgiref.sync import async_to_sync
    async_to_sync(send_quality_update_async)(workflow_id, quality_data)