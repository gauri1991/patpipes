"""
WebSocket consumers for real-time collaboration features
Notifications, activity feed, comments, and mentions
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from urllib.parse import parse_qs


class NotificationConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time notifications
    Each user joins their own notification channel
    """

    async def connect(self):
        """Handle WebSocket connection"""
        # Authenticate user
        user = await self.authenticate()
        if not user:
            await self.close(code=4001)
            return

        self.user = user
        self.user_group = f'notifications_{user.id}'

        # Join user's notification group
        await self.channel_layer.group_add(
            self.user_group,
            self.channel_name
        )

        await self.accept()

        # Send unread notification count
        count = await self.get_unread_count()
        await self.send(text_data=json.dumps({
            'type': 'notification_count',
            'count': count
        }))

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'user_group'):
            await self.channel_layer.group_discard(
                self.user_group,
                self.channel_name
            )

    async def receive(self, text_data):
        """Handle messages from WebSocket"""
        try:
            data = json.loads(text_data)

            if data.get('type') == 'get_notifications':
                notifications = await self.get_notifications()
                await self.send(text_data=json.dumps({
                    'type': 'notifications_list',
                    'data': notifications
                }))

            elif data.get('type') == 'mark_read':
                notification_id = data.get('notification_id')
                if notification_id:
                    await self.mark_notification_read(notification_id)
                    await self.send(text_data=json.dumps({
                        'type': 'notification_read',
                        'notification_id': notification_id
                    }))

            elif data.get('type') == 'mark_all_read':
                await self.mark_all_read()
                await self.send(text_data=json.dumps({
                    'type': 'all_notifications_read'
                }))

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))

    async def notification_new(self, event):
        """Handle new notification"""
        await self.send(text_data=json.dumps({
            'type': 'new_notification',
            'data': event['notification']
        }))

    async def notification_count_update(self, event):
        """Handle notification count update"""
        await self.send(text_data=json.dumps({
            'type': 'notification_count',
            'count': event['count']
        }))

    async def authenticate(self):
        """Authenticate user from session or token"""
        user = self.scope.get('user', AnonymousUser())

        if not user.is_anonymous:
            return user

        # Try token from query params
        query_string = self.scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if token:
            try:
                UntypedToken(token)
                jwt_auth = JWTAuthentication()
                validated_token = jwt_auth.get_validated_token(token)
                user = await database_sync_to_async(jwt_auth.get_user)(validated_token)
                return user
            except (InvalidToken, TokenError):
                return None

        return None

    @database_sync_to_async
    def get_unread_count(self):
        from .models import Notification
        return Notification.objects.filter(
            user=self.user,
            is_read=False,
            is_dismissed=False
        ).count()

    @database_sync_to_async
    def get_notifications(self):
        from .models import Notification
        from .serializers import NotificationSerializer
        notifications = Notification.objects.filter(
            user=self.user,
            is_dismissed=False
        ).select_related('actor')[:50]
        return NotificationSerializer(notifications, many=True).data

    @database_sync_to_async
    def mark_notification_read(self, notification_id):
        from .models import Notification
        from datetime import datetime
        Notification.objects.filter(
            id=notification_id,
            user=self.user
        ).update(is_read=True, read_at=datetime.now())

    @database_sync_to_async
    def mark_all_read(self):
        from .models import Notification
        from datetime import datetime
        Notification.objects.filter(
            user=self.user,
            is_read=False
        ).update(is_read=True, read_at=datetime.now())


class ActivityFeedConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time activity feed updates
    Subscribes to project or team activity
    """

    async def connect(self):
        """Handle WebSocket connection"""
        user = await self.authenticate()
        if not user:
            await self.close(code=4001)
            return

        self.user = user

        # Get project_id from URL or query params
        project_id = self.scope['url_route']['kwargs'].get('project_id')
        if project_id:
            self.room_group = f'activity_project_{project_id}'
        else:
            # Subscribe to user's team activity
            self.room_group = f'activity_user_{user.id}'

        await self.channel_layer.group_add(
            self.room_group,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'room_group'):
            await self.channel_layer.group_discard(
                self.room_group,
                self.channel_name
            )

    async def receive(self, text_data):
        """Handle messages from WebSocket"""
        try:
            data = json.loads(text_data)

            if data.get('type') == 'get_activities':
                limit = data.get('limit', 20)
                activities = await self.get_activities(limit)
                await self.send(text_data=json.dumps({
                    'type': 'activities_list',
                    'data': activities
                }))

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))

    async def activity_new(self, event):
        """Handle new activity"""
        await self.send(text_data=json.dumps({
            'type': 'new_activity',
            'data': event['activity']
        }))

    async def authenticate(self):
        """Authenticate user from session or token"""
        user = self.scope.get('user', AnonymousUser())

        if not user.is_anonymous:
            return user

        query_string = self.scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if token:
            try:
                UntypedToken(token)
                jwt_auth = JWTAuthentication()
                validated_token = jwt_auth.get_validated_token(token)
                user = await database_sync_to_async(jwt_auth.get_user)(validated_token)
                return user
            except (InvalidToken, TokenError):
                return None

        return None

    @database_sync_to_async
    def get_activities(self, limit=20):
        from .models import Activity
        from .serializers import ActivitySerializer

        project_id = self.scope['url_route']['kwargs'].get('project_id')
        if project_id:
            activities = Activity.objects.filter(
                project_id=project_id
            ).select_related('actor')[:limit]
        else:
            activities = Activity.objects.filter(
                actor=self.user
            ).select_related('actor')[:limit]

        return ActivitySerializer(activities, many=True).data


class CommentThreadConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time comment updates on a thread
    """

    async def connect(self):
        """Handle WebSocket connection"""
        user = await self.authenticate()
        if not user:
            await self.close(code=4001)
            return

        self.user = user
        self.thread_id = self.scope['url_route']['kwargs']['thread_id']
        self.room_group = f'thread_{self.thread_id}'

        await self.channel_layer.group_add(
            self.room_group,
            self.channel_name
        )

        await self.accept()

        # Send existing comments
        comments = await self.get_thread_comments()
        await self.send(text_data=json.dumps({
            'type': 'thread_comments',
            'data': comments
        }))

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'room_group'):
            await self.channel_layer.group_discard(
                self.room_group,
                self.channel_name
            )

    async def receive(self, text_data):
        """Handle messages from WebSocket"""
        try:
            data = json.loads(text_data)

            if data.get('type') == 'new_comment':
                comment_data = await self.create_comment(data.get('text', ''))
                if comment_data:
                    # Broadcast to all in thread
                    await self.channel_layer.group_send(
                        self.room_group,
                        {
                            'type': 'comment_new',
                            'comment': comment_data
                        }
                    )

            elif data.get('type') == 'typing':
                await self.channel_layer.group_send(
                    self.room_group,
                    {
                        'type': 'user_typing',
                        'user_id': str(self.user.id),
                        'user_name': self.user.full_name
                    }
                )

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))

    async def comment_new(self, event):
        """Handle new comment broadcast"""
        await self.send(text_data=json.dumps({
            'type': 'new_comment',
            'data': event['comment']
        }))

    async def comment_edited(self, event):
        """Handle comment edited broadcast"""
        await self.send(text_data=json.dumps({
            'type': 'comment_edited',
            'data': event['comment']
        }))

    async def comment_deleted(self, event):
        """Handle comment deleted broadcast"""
        await self.send(text_data=json.dumps({
            'type': 'comment_deleted',
            'comment_id': event['comment_id']
        }))

    async def user_typing(self, event):
        """Handle user typing indicator"""
        # Don't send typing indicator to the user who is typing
        if event['user_id'] != str(self.user.id):
            await self.send(text_data=json.dumps({
                'type': 'user_typing',
                'user_id': event['user_id'],
                'user_name': event['user_name']
            }))

    async def thread_resolved(self, event):
        """Handle thread resolved broadcast"""
        await self.send(text_data=json.dumps({
            'type': 'thread_resolved',
            'resolved_by': event['resolved_by']
        }))

    async def authenticate(self):
        """Authenticate user from session or token"""
        user = self.scope.get('user', AnonymousUser())

        if not user.is_anonymous:
            return user

        query_string = self.scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if token:
            try:
                UntypedToken(token)
                jwt_auth = JWTAuthentication()
                validated_token = jwt_auth.get_validated_token(token)
                user = await database_sync_to_async(jwt_auth.get_user)(validated_token)
                return user
            except (InvalidToken, TokenError):
                return None

        return None

    @database_sync_to_async
    def get_thread_comments(self):
        from .models import Comment
        from .serializers import CommentSerializer
        comments = Comment.objects.filter(
            thread_id=self.thread_id
        ).select_related('author').prefetch_related('mentions', 'reactions')
        return CommentSerializer(comments, many=True).data

    @database_sync_to_async
    def create_comment(self, text):
        if not text.strip():
            return None

        from .models import Comment
        from .serializers import CommentSerializer

        comment = Comment.objects.create(
            thread_id=self.thread_id,
            author=self.user,
            text=text
        )
        return CommentSerializer(comment).data


class PresenceConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for tracking user presence on a resource
    Shows who else is viewing/editing the same document
    """

    async def connect(self):
        """Handle WebSocket connection"""
        user = await self.authenticate()
        if not user:
            await self.close(code=4001)
            return

        self.user = user
        self.resource_type = self.scope['url_route']['kwargs']['resource_type']
        self.resource_id = self.scope['url_route']['kwargs']['resource_id']
        self.room_group = f'presence_{self.resource_type}_{self.resource_id}'

        await self.channel_layer.group_add(
            self.room_group,
            self.channel_name
        )

        await self.accept()

        # Announce presence
        await self.channel_layer.group_send(
            self.room_group,
            {
                'type': 'user_joined',
                'user_id': str(self.user.id),
                'user_name': self.user.full_name,
                'user_avatar': str(self.user.avatar.url) if self.user.avatar else None
            }
        )

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'room_group'):
            # Announce departure
            await self.channel_layer.group_send(
                self.room_group,
                {
                    'type': 'user_left',
                    'user_id': str(self.user.id),
                    'user_name': self.user.full_name
                }
            )

            await self.channel_layer.group_discard(
                self.room_group,
                self.channel_name
            )

    async def receive(self, text_data):
        """Handle messages from WebSocket"""
        try:
            data = json.loads(text_data)

            if data.get('type') == 'cursor_position':
                # Broadcast cursor position for collaborative editing
                await self.channel_layer.group_send(
                    self.room_group,
                    {
                        'type': 'cursor_update',
                        'user_id': str(self.user.id),
                        'user_name': self.user.full_name,
                        'position': data.get('position', {})
                    }
                )

            elif data.get('type') == 'selection':
                # Broadcast text selection
                await self.channel_layer.group_send(
                    self.room_group,
                    {
                        'type': 'selection_update',
                        'user_id': str(self.user.id),
                        'user_name': self.user.full_name,
                        'selection': data.get('selection', {})
                    }
                )

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))

    async def user_joined(self, event):
        """Handle user joined broadcast"""
        if event['user_id'] != str(self.user.id):
            await self.send(text_data=json.dumps({
                'type': 'user_joined',
                'user_id': event['user_id'],
                'user_name': event['user_name'],
                'user_avatar': event.get('user_avatar')
            }))

    async def user_left(self, event):
        """Handle user left broadcast"""
        if event['user_id'] != str(self.user.id):
            await self.send(text_data=json.dumps({
                'type': 'user_left',
                'user_id': event['user_id'],
                'user_name': event['user_name']
            }))

    async def cursor_update(self, event):
        """Handle cursor position update"""
        if event['user_id'] != str(self.user.id):
            await self.send(text_data=json.dumps({
                'type': 'cursor_update',
                'user_id': event['user_id'],
                'user_name': event['user_name'],
                'position': event['position']
            }))

    async def selection_update(self, event):
        """Handle selection update"""
        if event['user_id'] != str(self.user.id):
            await self.send(text_data=json.dumps({
                'type': 'selection_update',
                'user_id': event['user_id'],
                'user_name': event['user_name'],
                'selection': event['selection']
            }))

    async def authenticate(self):
        """Authenticate user from session or token"""
        user = self.scope.get('user', AnonymousUser())

        if not user.is_anonymous:
            return user

        query_string = self.scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if token:
            try:
                UntypedToken(token)
                jwt_auth = JWTAuthentication()
                validated_token = jwt_auth.get_validated_token(token)
                user = await database_sync_to_async(jwt_auth.get_user)(validated_token)
                return user
            except (InvalidToken, TokenError):
                return None

        return None
