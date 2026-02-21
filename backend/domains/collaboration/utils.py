"""
Utility functions for collaboration features
Helper functions for sending real-time notifications and activities
"""

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.contenttypes.models import ContentType


def send_notification(user_id, notification_data):
    """
    Send a real-time notification to a specific user

    Args:
        user_id: UUID of the user to send notification to
        notification_data: Dict containing notification details
    """
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'notifications_{user_id}',
        {
            'type': 'notification_new',
            'notification': notification_data
        }
    )


def update_notification_count(user_id, count):
    """
    Update the notification count for a user

    Args:
        user_id: UUID of the user
        count: New unread notification count
    """
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'notifications_{user_id}',
        {
            'type': 'notification_count_update',
            'count': count
        }
    )


def send_activity(project_id, activity_data):
    """
    Send a real-time activity update to a project's activity feed

    Args:
        project_id: UUID of the project
        activity_data: Dict containing activity details
    """
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'activity_project_{project_id}',
        {
            'type': 'activity_new',
            'activity': activity_data
        }
    )


def send_comment_update(thread_id, comment_data, event_type='comment_new'):
    """
    Send a real-time comment update to a thread

    Args:
        thread_id: UUID of the comment thread
        comment_data: Dict containing comment details
        event_type: Type of event (comment_new, comment_edited, comment_deleted)
    """
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'thread_{thread_id}',
        {
            'type': event_type,
            'comment': comment_data
        }
    )


def send_thread_resolved(thread_id, resolved_by_name):
    """
    Notify that a thread has been resolved

    Args:
        thread_id: UUID of the comment thread
        resolved_by_name: Name of user who resolved the thread
    """
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'thread_{thread_id}',
        {
            'type': 'thread_resolved',
            'resolved_by': resolved_by_name
        }
    )


def create_and_send_notification(
    user,
    notification_type,
    title,
    message,
    actor=None,
    related_object=None,
    action_url='',
    priority='normal'
):
    """
    Create a notification in the database and send it via WebSocket

    Args:
        user: User to notify
        notification_type: Type of notification (from Notification.NotificationType)
        title: Notification title
        message: Notification message
        actor: User who triggered the notification (optional)
        related_object: Related model instance (optional)
        action_url: URL to navigate to (optional)
        priority: Priority level (optional)
    """
    from .models import Notification
    from .serializers import NotificationSerializer

    # Build notification data
    notification_kwargs = {
        'user': user,
        'notification_type': notification_type,
        'title': title,
        'message': message,
        'action_url': action_url,
        'priority': priority
    }

    if actor:
        notification_kwargs['actor'] = actor

    if related_object:
        content_type = ContentType.objects.get_for_model(related_object)
        notification_kwargs['related_content_type'] = content_type
        notification_kwargs['related_object_id'] = str(related_object.pk)

    # Create notification in database
    notification = Notification.objects.create(**notification_kwargs)

    # Serialize and send via WebSocket
    notification_data = NotificationSerializer(notification).data
    send_notification(str(user.id), notification_data)

    # Update count
    unread_count = Notification.objects.filter(
        user=user,
        is_read=False,
        is_dismissed=False
    ).count()
    update_notification_count(str(user.id), unread_count)

    return notification


def create_and_send_activity(
    actor,
    activity_type,
    description='',
    target=None,
    project_id=None,
    metadata=None,
    request=None
):
    """
    Create an activity in the database and send it via WebSocket

    Args:
        actor: User who performed the action
        activity_type: Type of activity (from Activity.ActivityType)
        description: Activity description (optional)
        target: Target model instance (optional)
        project_id: Related project ID (optional)
        metadata: Additional metadata dict (optional)
        request: HTTP request for IP/user agent (optional)
    """
    from .models import Activity
    from .serializers import ActivitySerializer

    # Build activity data
    activity_kwargs = {
        'actor': actor,
        'activity_type': activity_type,
        'description': description,
        'metadata': metadata or {}
    }

    if target:
        content_type = ContentType.objects.get_for_model(target)
        activity_kwargs['target_content_type'] = content_type
        activity_kwargs['target_object_id'] = str(target.pk)

    if project_id:
        activity_kwargs['project_id'] = str(project_id)

    if request:
        activity_kwargs['ip_address'] = get_client_ip(request)
        activity_kwargs['user_agent'] = request.META.get('HTTP_USER_AGENT', '')[:500]

    # Create activity in database
    activity = Activity.objects.create(**activity_kwargs)

    # Serialize and send via WebSocket
    activity_data = ActivitySerializer(activity).data

    # Send to project channel if project_id provided
    if project_id:
        send_activity(str(project_id), activity_data)

    return activity


def get_client_ip(request):
    """Extract client IP from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def notify_mentions(comment, mentioned_user_ids):
    """
    Send notifications to all mentioned users

    Args:
        comment: Comment instance
        mentioned_user_ids: List of user IDs that were mentioned
    """
    from domains.accounts.models import User
    from .models import Notification

    for user_id in mentioned_user_ids:
        try:
            mentioned_user = User.objects.get(id=user_id)
            create_and_send_notification(
                user=mentioned_user,
                notification_type=Notification.NotificationType.MENTION,
                title='You were mentioned',
                message=f'{comment.author.full_name} mentioned you in a comment',
                actor=comment.author,
                related_object=comment,
                action_url=f'/comments/{comment.thread_id}' if comment.thread else ''
            )
        except User.DoesNotExist:
            pass
