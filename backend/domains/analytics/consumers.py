"""
WebSocket consumers for real-time pipeline updates
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs

User = get_user_model()


class PipelineConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for pipeline progress updates"""
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.pipeline_id = self.scope['url_route']['kwargs']['pipeline_id']
        self.room_group_name = f'pipeline_{self.pipeline_id}'
        
        # Check authentication - try token from query params first
        user = self.scope.get('user', AnonymousUser())
        
        if user.is_anonymous:
            # Try token-based authentication from query params
            query_string = self.scope.get('query_string', b'').decode()
            query_params = parse_qs(query_string)
            token = query_params.get('token', [None])[0]
            
            if token:
                try:
                    # Validate token
                    UntypedToken(token)
                    # Get user from token
                    from rest_framework_simplejwt.authentication import JWTAuthentication
                    jwt_auth = JWTAuthentication()
                    validated_token = jwt_auth.get_validated_token(token)
                    user = await database_sync_to_async(jwt_auth.get_user)(validated_token)
                    self.scope['user'] = user
                except (InvalidToken, TokenError):
                    await self.close(code=4001)
                    return
            else:
                await self.close(code=4001)
                return
        
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial pipeline status
        try:
            pipeline_data = await self.get_pipeline_status()
            await self.send(text_data=json.dumps({
                'type': 'pipeline_status',
                'data': pipeline_data
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'Failed to get pipeline status: {str(e)}'
            }))
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Handle messages from WebSocket"""
        try:
            data = json.loads(text_data)
            
            if data.get('type') == 'get_status':
                # Send current pipeline status
                pipeline_data = await self.get_pipeline_status()
                await self.send(text_data=json.dumps({
                    'type': 'pipeline_status',
                    'data': pipeline_data
                }))
                
            elif data.get('type') == 'get_results':
                # Send current results
                results = await self.get_pipeline_results()
                await self.send(text_data=json.dumps({
                    'type': 'pipeline_results',
                    'data': results
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
    
    async def pipeline_update(self, event):
        """Handle pipeline update from group"""
        await self.send(text_data=json.dumps({
            'type': 'pipeline_update',
            'data': event['message']
        }))
    
    async def pipeline_completed(self, event):
        """Handle pipeline completion"""
        await self.send(text_data=json.dumps({
            'type': 'pipeline_completed',
            'data': event['message']
        }))
    
    async def pipeline_error(self, event):
        """Handle pipeline error"""
        await self.send(text_data=json.dumps({
            'type': 'pipeline_error',
            'data': event['message']
        }))
    
    @database_sync_to_async
    def get_pipeline_status(self):
        """Get current pipeline status from database"""
        from .models import ProcessingPipeline
        from .agentic_serializers import ProcessingPipelineSerializer
        
        try:
            pipeline = ProcessingPipeline.objects.get(id=self.pipeline_id)
            serializer = ProcessingPipelineSerializer(pipeline)
            return serializer.data
        except ProcessingPipeline.DoesNotExist:
            return {'error': 'Pipeline not found'}
    
    @database_sync_to_async
    def get_pipeline_results(self):
        """Get current pipeline results"""
        from .models import ProcessingPipeline, PatentEntityExtraction, PatentTriplet
        
        try:
            pipeline = ProcessingPipeline.objects.get(id=self.pipeline_id)
            
            # Get latest entities and triplets
            entities = PatentEntityExtraction.objects.filter(
                patent_record__dataset=pipeline.dataset
            ).order_by('-created_at')[:20]
            
            triplets = PatentTriplet.objects.filter(
                patent_record__dataset=pipeline.dataset
            ).select_related('subject_entity', 'object_entity').order_by('-created_at')[:20]
            
            return {
                'entities': [
                    {
                        'text': e.entity_text,
                        'type': e.entity_type,
                        'confidence': e.confidence_score,
                        'patent_id': e.patent_record.patent_id
                    } for e in entities
                ],
                'triplets': [
                    {
                        'id': str(t.id),
                        'subject_text': t.subject_entity.entity_text,
                        'subject_type': t.subject_entity.entity_type,
                        'predicate': t.predicate,
                        'object_text': t.object_entity.entity_text,
                        'object_type': t.object_entity.entity_type,
                        'confidence': t.confidence_score,
                        'patent_id': t.patent_record.patent_id,
                        'source_sentence': t.source_sentence[:100]
                    } for t in triplets
                ],
                'pipeline_status': {
                    'stage': pipeline.current_stage,
                    'progress': pipeline.progress_percentage,
                    'processed_patents': pipeline.processed_patents,
                    'total_patents': pipeline.total_patents
                }
            }
        except Exception as e:
            return {'error': str(e)}


class AnalyticsConsumer(AsyncWebsocketConsumer):
    """General analytics WebSocket consumer for various real-time updates"""
    
    async def connect(self):
        """Handle connection to analytics room"""
        user = self.scope.get('user', AnonymousUser())
        if user.is_anonymous:
            await self.close()
            return
        
        self.room_group_name = 'analytics_updates'
        
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        
        await self.accept()
    
    async def disconnect(self, close_code):
        """Handle disconnection"""
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def analytics_update(self, event):
        """Send analytics updates"""
        await self.send(text_data=json.dumps({
            'type': 'analytics_update',
            'data': event['message']
        }))