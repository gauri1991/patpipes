"""
Collaboration Domain Views
ViewSets for comments, notifications, activities, and sharing
"""

from datetime import datetime

from django.db.models import Q, Count
from django.contrib.contenttypes.models import ContentType
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters import rest_framework as filters

from .models import (
    CommentThread,
    Comment,
    Mention,
    Activity,
    Notification,
    SharedResource,
    Reaction
)
from .serializers import (
    CommentThreadSerializer,
    CommentSerializer,
    CommentCreateSerializer,
    ActivitySerializer,
    NotificationSerializer,
    SharedResourceSerializer,
    ReactionSerializer,
    MentionSerializer
)


class CommentThreadFilter(filters.FilterSet):
    content_type = filters.CharFilter(method='filter_content_type')
    object_id = filters.CharFilter(field_name='object_id')
    is_resolved = filters.BooleanFilter(field_name='is_resolved')

    class Meta:
        model = CommentThread
        fields = ['is_resolved']

    def filter_content_type(self, queryset, name, value):
        if '.' in value:
            app_label, model = value.split('.')
            try:
                ct = ContentType.objects.get(app_label=app_label, model=model)
                return queryset.filter(content_type=ct)
            except ContentType.DoesNotExist:
                return queryset.none()
        return queryset


class CommentThreadViewSet(viewsets.ModelViewSet):
    """
    ViewSet for comment threads
    """
    queryset = CommentThread.objects.all()
    serializer_class = CommentThreadSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_class = CommentThreadFilter

    def get_queryset(self):
        return CommentThread.objects.annotate(
            comment_count=Count('comments')
        ).select_related('created_by', 'resolved_by')

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """Mark thread as resolved"""
        thread = self.get_object()
        thread.is_resolved = True
        thread.resolved_by = request.user
        thread.resolved_at = datetime.now()
        thread.save()
        return Response({'success': True, 'message': 'Thread resolved'})

    @action(detail=True, methods=['post'])
    def reopen(self, request, pk=None):
        """Reopen a resolved thread"""
        thread = self.get_object()
        thread.is_resolved = False
        thread.resolved_by = None
        thread.resolved_at = None
        thread.save()
        return Response({'success': True, 'message': 'Thread reopened'})

    @action(detail=False, methods=['get'])
    def for_resource(self, request):
        """Get threads for a specific resource"""
        content_type_name = request.query_params.get('content_type')
        object_id = request.query_params.get('object_id')

        if not content_type_name or not object_id:
            return Response(
                {'error': 'content_type and object_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            app_label, model = content_type_name.split('.')
            ct = ContentType.objects.get(app_label=app_label, model=model)
        except (ValueError, ContentType.DoesNotExist):
            return Response(
                {'error': 'Invalid content type'},
                status=status.HTTP_400_BAD_REQUEST
            )

        threads = self.get_queryset().filter(content_type=ct, object_id=object_id)
        serializer = self.get_serializer(threads, many=True)
        return Response(serializer.data)


class CommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for comments
    """
    queryset = Comment.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return CommentCreateSerializer
        return CommentSerializer

    def get_queryset(self):
        queryset = Comment.objects.select_related('author', 'thread', 'parent')
        queryset = queryset.prefetch_related('mentions', 'reactions', 'replies')

        # Filter by thread
        thread_id = self.request.query_params.get('thread')
        if thread_id:
            queryset = queryset.filter(thread_id=thread_id)

        # Filter by resource
        content_type_name = self.request.query_params.get('content_type')
        object_id = self.request.query_params.get('object_id')
        if content_type_name and object_id:
            try:
                app_label, model = content_type_name.split('.')
                ct = ContentType.objects.get(app_label=app_label, model=model)
                queryset = queryset.filter(content_type=ct, object_id=object_id)
            except (ValueError, ContentType.DoesNotExist):
                pass

        return queryset

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

        # Create activity
        Activity.objects.create(
            actor=self.request.user,
            activity_type=Activity.ActivityType.COMMENT_ADDED,
            description=f"Added a comment",
            metadata={'comment_preview': serializer.instance.text[:100]}
        )

    def perform_update(self, serializer):
        # Track edit history
        instance = self.get_object()
        instance.edit_history.append({
            'text': instance.text,
            'edited_at': datetime.now().isoformat()
        })
        serializer.save(is_edited=True)

    @action(detail=True, methods=['post'])
    def react(self, request, pk=None):
        """Add reaction to comment"""
        comment = self.get_object()
        reaction_type = request.data.get('reaction_type')

        if reaction_type not in dict(Reaction.ReactionType.choices):
            return Response(
                {'error': 'Invalid reaction type'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Toggle reaction
        existing = Reaction.objects.filter(
            comment=comment,
            user=request.user,
            reaction_type=reaction_type
        ).first()

        if existing:
            existing.delete()
            return Response({'success': True, 'action': 'removed'})
        else:
            Reaction.objects.create(
                comment=comment,
                user=request.user,
                reaction_type=reaction_type
            )
            return Response({'success': True, 'action': 'added'})


class ActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for activity feed (read-only)
    """
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Activity.objects.select_related('actor')

        # Filter by project
        project_id = self.request.query_params.get('project_id')
        if project_id:
            queryset = queryset.filter(project_id=project_id)

        # Filter by activity type
        activity_type = self.request.query_params.get('activity_type')
        if activity_type:
            queryset = queryset.filter(activity_type=activity_type)

        # Filter by actor
        actor_id = self.request.query_params.get('actor')
        if actor_id:
            queryset = queryset.filter(actor_id=actor_id)

        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)

        return queryset

    @action(detail=False, methods=['get'])
    def my_activity(self, request):
        """Get current user's activity"""
        activities = self.get_queryset().filter(actor=request.user)[:50]
        serializer = self.get_serializer(activities, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def team_activity(self, request):
        """Get activity from user's team members"""
        user = request.user
        team_member_ids = []
        for team in user.teams.all():
            team_member_ids.extend(team.members.values_list('id', flat=True))

        activities = self.get_queryset().filter(actor_id__in=team_member_ids)[:50]
        serializer = self.get_serializer(activities, many=True)
        return Response(serializer.data)


class NotificationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for user notifications
    """
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user,
            is_dismissed=False
        ).select_related('actor')

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = datetime.now()
        notification.save()
        return Response({'success': True})

    @action(detail=True, methods=['post'])
    def dismiss(self, request, pk=None):
        """Dismiss notification"""
        notification = self.get_object()
        notification.is_dismissed = True
        notification.save()
        return Response({'success': True})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        self.get_queryset().filter(is_read=False).update(
            is_read=True,
            read_at=datetime.now()
        )
        return Response({'success': True})

    @action(detail=False, methods=['post'])
    def dismiss_all(self, request):
        """Dismiss all notifications"""
        self.get_queryset().update(is_dismissed=True)
        return Response({'success': True})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = self.get_queryset().filter(is_read=False).count()
        return Response({'count': count})

    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get notifications grouped by type"""
        notifications = self.get_queryset()
        grouped = {}
        for notif in notifications:
            if notif.notification_type not in grouped:
                grouped[notif.notification_type] = []
            grouped[notif.notification_type].append(
                NotificationSerializer(notif).data
            )
        return Response(grouped)


class SharedResourceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for shared resources
    """
    queryset = SharedResource.objects.all()
    serializer_class = SharedResourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Resources shared with user or shared by user
        return SharedResource.objects.filter(
            Q(shared_with=user) | Q(shared_by=user),
            is_revoked=False
        ).select_related('shared_by', 'shared_with')

    def perform_create(self, serializer):
        shared_resource = serializer.save(shared_by=self.request.user)

        # Create notification for recipient
        Notification.objects.create(
            user=shared_resource.shared_with,
            notification_type=Notification.NotificationType.PROJECT_SHARED,
            title='Resource shared with you',
            message=f'{self.request.user.full_name} shared a {shared_resource.content_type.model} with you',
            actor=self.request.user,
            related_content_type=shared_resource.content_type,
            related_object_id=shared_resource.object_id
        )

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept shared resource"""
        shared = self.get_object()
        if shared.shared_with != request.user:
            return Response(
                {'error': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )

        shared.is_accepted = True
        shared.accepted_at = datetime.now()
        shared.save()
        return Response({'success': True})

    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        """Revoke shared resource"""
        shared = self.get_object()
        if shared.shared_by != request.user:
            return Response(
                {'error': 'Only the owner can revoke sharing'},
                status=status.HTTP_403_FORBIDDEN
            )

        shared.is_revoked = True
        shared.revoked_at = datetime.now()
        shared.save()
        return Response({'success': True})

    @action(detail=False, methods=['get'])
    def shared_with_me(self, request):
        """Get resources shared with current user"""
        resources = SharedResource.objects.filter(
            shared_with=request.user,
            is_revoked=False
        ).select_related('shared_by')
        serializer = self.get_serializer(resources, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def shared_by_me(self, request):
        """Get resources shared by current user"""
        resources = SharedResource.objects.filter(
            shared_by=request.user,
            is_revoked=False
        ).select_related('shared_with')
        serializer = self.get_serializer(resources, many=True)
        return Response(serializer.data)


class MentionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for user mentions (read-only)
    """
    queryset = Mention.objects.all()
    serializer_class = MentionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Mention.objects.filter(
            mentioned_user=self.request.user
        ).select_related('comment', 'mentioned_by')

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark mention as read"""
        mention = self.get_object()
        mention.is_read = True
        mention.read_at = datetime.now()
        mention.save()
        return Response({'success': True})

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all mentions as read"""
        self.get_queryset().filter(is_read=False).update(
            is_read=True,
            read_at=datetime.now()
        )
        return Response({'success': True})

    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get unread mentions"""
        mentions = self.get_queryset().filter(is_read=False)
        serializer = self.get_serializer(mentions, many=True)
        return Response(serializer.data)
