"""
Tests for Collaboration Domain
"""

from django.test import TestCase
from django.contrib.contenttypes.models import ContentType
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from datetime import datetime

from domains.accounts.models import User, Organization
from .models import (
    CommentThread,
    Comment,
    Mention,
    Activity,
    Notification,
    SharedResource,
    Reaction
)


class CollaborationModelTests(TestCase):
    """Tests for collaboration models"""

    def setUp(self):
        self.organization = Organization.objects.create(
            name='Test Org',
            domain='test.com',
            industry='tech',
            size='small'
        )
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
            organization=self.organization,
            status='active'
        )
        self.user2 = User.objects.create_user(
            email='test2@test.com',
            password='testpass123',
            first_name='Test2',
            last_name='User2',
            organization=self.organization,
            status='active'
        )

    def test_comment_thread_creation(self):
        """Test creating a comment thread"""
        content_type = ContentType.objects.get_for_model(self.organization)
        thread = CommentThread.objects.create(
            content_type=content_type,
            object_id=str(self.organization.id),
            title='Test Thread',
            created_by=self.user
        )
        self.assertEqual(thread.title, 'Test Thread')
        self.assertFalse(thread.is_resolved)
        self.assertEqual(thread.comment_count, 0)

    def test_comment_creation(self):
        """Test creating a comment"""
        content_type = ContentType.objects.get_for_model(self.organization)
        thread = CommentThread.objects.create(
            content_type=content_type,
            object_id=str(self.organization.id),
            created_by=self.user
        )
        comment = Comment.objects.create(
            thread=thread,
            text='Test comment',
            author=self.user
        )
        self.assertEqual(comment.text, 'Test comment')
        self.assertEqual(comment.author, self.user)
        self.assertEqual(thread.comment_count, 1)

    def test_mention_creation(self):
        """Test creating a mention"""
        content_type = ContentType.objects.get_for_model(self.organization)
        thread = CommentThread.objects.create(
            content_type=content_type,
            object_id=str(self.organization.id),
            created_by=self.user
        )
        comment = Comment.objects.create(
            thread=thread,
            text='Hello @user2',
            author=self.user
        )
        mention = Mention.objects.create(
            comment=comment,
            mentioned_user=self.user2,
            mentioned_by=self.user
        )
        self.assertFalse(mention.is_read)
        self.assertEqual(mention.mentioned_user, self.user2)

    def test_notification_creation(self):
        """Test creating a notification"""
        notification = Notification.objects.create(
            user=self.user,
            notification_type=Notification.NotificationType.MENTION,
            title='Test Notification',
            message='You were mentioned'
        )
        self.assertFalse(notification.is_read)
        self.assertEqual(notification.priority, 'normal')

    def test_activity_creation(self):
        """Test creating an activity"""
        activity = Activity.objects.create(
            actor=self.user,
            activity_type=Activity.ActivityType.PROJECT_CREATED,
            description='Created a new project'
        )
        self.assertEqual(activity.actor, self.user)
        self.assertEqual(activity.activity_type, 'project_created')

    def test_shared_resource_creation(self):
        """Test creating a shared resource"""
        content_type = ContentType.objects.get_for_model(self.organization)
        shared = SharedResource.objects.create(
            content_type=content_type,
            object_id=str(self.organization.id),
            shared_by=self.user,
            shared_with=self.user2,
            permission=SharedResource.PermissionLevel.VIEW
        )
        self.assertFalse(shared.is_accepted)
        self.assertEqual(shared.permission, 'view')

    def test_reaction_creation(self):
        """Test creating a reaction"""
        content_type = ContentType.objects.get_for_model(self.organization)
        thread = CommentThread.objects.create(
            content_type=content_type,
            object_id=str(self.organization.id),
            created_by=self.user
        )
        comment = Comment.objects.create(
            thread=thread,
            text='Test comment',
            author=self.user
        )
        reaction = Reaction.objects.create(
            comment=comment,
            user=self.user2,
            reaction_type=Reaction.ReactionType.LIKE
        )
        self.assertEqual(reaction.reaction_type, 'like')


class CollaborationAPITests(APITestCase):
    """Tests for collaboration API endpoints"""

    def setUp(self):
        self.organization = Organization.objects.create(
            name='Test Org',
            domain='test.com',
            industry='tech',
            size='small'
        )
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
            organization=self.organization,
            status='active'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_list_notifications(self):
        """Test listing notifications"""
        Notification.objects.create(
            user=self.user,
            notification_type=Notification.NotificationType.MENTION,
            title='Test',
            message='Test message'
        )
        response = self.client.get('/api/v1/collaboration/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_mark_notification_read(self):
        """Test marking notification as read"""
        notification = Notification.objects.create(
            user=self.user,
            notification_type=Notification.NotificationType.MENTION,
            title='Test',
            message='Test message'
        )
        response = self.client.post(
            f'/api/v1/collaboration/notifications/{notification.id}/mark_read/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)

    def test_unread_count(self):
        """Test getting unread notification count"""
        Notification.objects.create(
            user=self.user,
            notification_type=Notification.NotificationType.MENTION,
            title='Test 1',
            message='Test message 1'
        )
        Notification.objects.create(
            user=self.user,
            notification_type=Notification.NotificationType.MENTION,
            title='Test 2',
            message='Test message 2'
        )
        response = self.client.get('/api/v1/collaboration/notifications/unread_count/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_list_activities(self):
        """Test listing activities"""
        Activity.objects.create(
            actor=self.user,
            activity_type=Activity.ActivityType.PROJECT_CREATED,
            description='Created a project'
        )
        response = self.client.get('/api/v1/collaboration/activities/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_comment_thread(self):
        """Test creating a comment thread"""
        content_type = ContentType.objects.get_for_model(self.organization)
        response = self.client.post('/api/v1/collaboration/threads/', {
            'title': 'New Thread',
            'content_type_name': f'{content_type.app_label}.{content_type.model}',
            'object_id': str(self.organization.id)
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'New Thread')
