"""
Collaboration Domain Models
Real-time collaboration, comments, mentions, notifications, and activity tracking
"""

import uuid
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils.translation import gettext_lazy as _

from domains.accounts.models import User


class CommentThread(models.Model):
    """
    Thread for organizing comments on any resource
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Generic relation to any model
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=255)  # UUID or int as string
    content_object = GenericForeignKey('content_type', 'object_id')

    # Thread metadata
    title = models.CharField(max_length=255, blank=True)
    is_resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_threads'
    )
    resolved_at = models.DateTimeField(null=True, blank=True)

    # Thread positioning (for inline comments in documents)
    anchor_text = models.TextField(blank=True)  # Text selection that started the thread
    position_data = models.JSONField(default=dict, blank=True)  # Line/char position info

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_threads')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'comment_threads'
        verbose_name = _('Comment Thread')
        verbose_name_plural = _('Comment Threads')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['is_resolved']),
        ]

    def __str__(self):
        return f"Thread on {self.content_type.model} - {self.title or 'Untitled'}"

    @property
    def comment_count(self):
        return self.comments.count()


class Comment(models.Model):
    """
    Individual comment in a thread or standalone
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Can belong to a thread or be standalone
    thread = models.ForeignKey(
        CommentThread,
        on_delete=models.CASCADE,
        related_name='comments',
        null=True,
        blank=True
    )

    # For standalone comments (directly on a resource without thread)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    object_id = models.CharField(max_length=255, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    # Reply to another comment
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )

    # Comment content
    text = models.TextField()
    is_edited = models.BooleanField(default=False)
    edit_history = models.JSONField(default=list, blank=True)  # Track edits

    # Attachments
    attachments = models.JSONField(default=list, blank=True)  # File references

    # Author
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'comments'
        verbose_name = _('Comment')
        verbose_name_plural = _('Comments')
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['thread']),
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['author']),
        ]

    def __str__(self):
        return f"Comment by {self.author.email}: {self.text[:50]}..."


class Mention(models.Model):
    """
    User mentions in comments
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='mentions')
    mentioned_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mentions_received')
    mentioned_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mentions_made')

    # Position in comment text
    start_position = models.IntegerField(default=0)
    end_position = models.IntegerField(default=0)

    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'mentions'
        verbose_name = _('Mention')
        verbose_name_plural = _('Mentions')
        indexes = [
            models.Index(fields=['mentioned_user', 'is_read']),
        ]

    def __str__(self):
        return f"{self.mentioned_by.email} mentioned {self.mentioned_user.email}"


class Activity(models.Model):
    """
    Activity feed for tracking user actions
    """
    class ActivityType(models.TextChoices):
        # Project activities
        PROJECT_CREATED = 'project_created', _('Project Created')
        PROJECT_UPDATED = 'project_updated', _('Project Updated')
        PROJECT_ARCHIVED = 'project_archived', _('Project Archived')
        PROJECT_SHARED = 'project_shared', _('Project Shared')

        # Document activities
        DOCUMENT_UPLOADED = 'document_uploaded', _('Document Uploaded')
        DOCUMENT_EDITED = 'document_edited', _('Document Edited')
        DOCUMENT_DELETED = 'document_deleted', _('Document Deleted')

        # Comment activities
        COMMENT_ADDED = 'comment_added', _('Comment Added')
        COMMENT_EDITED = 'comment_edited', _('Comment Edited')
        COMMENT_RESOLVED = 'comment_resolved', _('Comment Resolved')

        # Search activities
        SEARCH_PERFORMED = 'search_performed', _('Search Performed')
        RESULTS_SAVED = 'results_saved', _('Results Saved')

        # Analysis activities
        ANALYSIS_STARTED = 'analysis_started', _('Analysis Started')
        ANALYSIS_COMPLETED = 'analysis_completed', _('Analysis Completed')

        # Team activities
        MEMBER_ADDED = 'member_added', _('Member Added')
        MEMBER_REMOVED = 'member_removed', _('Member Removed')
        ROLE_CHANGED = 'role_changed', _('Role Changed')

        # Report activities
        REPORT_GENERATED = 'report_generated', _('Report Generated')
        REPORT_EXPORTED = 'report_exported', _('Report Exported')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Who performed the action
    actor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')

    # What type of action
    activity_type = models.CharField(max_length=50, choices=ActivityType.choices)

    # Target of the action (generic relation)
    target_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='activities'
    )
    target_object_id = models.CharField(max_length=255, blank=True)
    target = GenericForeignKey('target_content_type', 'target_object_id')

    # Additional context
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    # Related project (for easier filtering)
    project_id = models.CharField(max_length=255, blank=True)

    # IP address for audit
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'activities'
        verbose_name = _('Activity')
        verbose_name_plural = _('Activities')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['actor']),
            models.Index(fields=['activity_type']),
            models.Index(fields=['project_id']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.actor.email} - {self.get_activity_type_display()}"


class Notification(models.Model):
    """
    User notifications for collaboration events
    """
    class NotificationType(models.TextChoices):
        MENTION = 'mention', _('Mention')
        COMMENT_REPLY = 'comment_reply', _('Comment Reply')
        THREAD_RESOLVED = 'thread_resolved', _('Thread Resolved')
        PROJECT_SHARED = 'project_shared', _('Project Shared')
        TASK_ASSIGNED = 'task_assigned', _('Task Assigned')
        DEADLINE_REMINDER = 'deadline_reminder', _('Deadline Reminder')
        ANALYSIS_COMPLETE = 'analysis_complete', _('Analysis Complete')
        REPORT_READY = 'report_ready', _('Report Ready')
        TEAM_INVITE = 'team_invite', _('Team Invite')
        PERMISSION_CHANGE = 'permission_change', _('Permission Change')

    class Priority(models.TextChoices):
        LOW = 'low', _('Low')
        NORMAL = 'normal', _('Normal')
        HIGH = 'high', _('High')
        URGENT = 'urgent', _('Urgent')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Recipient
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')

    # Notification type and priority
    notification_type = models.CharField(max_length=50, choices=NotificationType.choices)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.NORMAL)

    # Content
    title = models.CharField(max_length=255)
    message = models.TextField()
    action_url = models.CharField(max_length=500, blank=True)  # URL to navigate to

    # Related object
    related_content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    related_object_id = models.CharField(max_length=255, blank=True)
    related_object = GenericForeignKey('related_content_type', 'related_object_id')

    # Actor (who triggered the notification)
    actor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='triggered_notifications'
    )

    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    is_dismissed = models.BooleanField(default=False)

    # Email notification status
    email_sent = models.BooleanField(default=False)
    email_sent_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        verbose_name = _('Notification')
        verbose_name_plural = _('Notifications')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['priority']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.user.email}: {self.title}"


class SharedResource(models.Model):
    """
    Resource sharing between users
    """
    class PermissionLevel(models.TextChoices):
        VIEW = 'view', _('View Only')
        COMMENT = 'comment', _('Can Comment')
        EDIT = 'edit', _('Can Edit')
        ADMIN = 'admin', _('Full Access')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # What is being shared
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=255)
    content_object = GenericForeignKey('content_type', 'object_id')

    # Who is sharing and with whom
    shared_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shared_resources')
    shared_with = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_resources')

    # Permission level
    permission = models.CharField(max_length=20, choices=PermissionLevel.choices, default=PermissionLevel.VIEW)

    # Optional expiration
    expires_at = models.DateTimeField(null=True, blank=True)

    # Optional message
    message = models.TextField(blank=True)

    # Status
    is_accepted = models.BooleanField(default=False)
    accepted_at = models.DateTimeField(null=True, blank=True)
    is_revoked = models.BooleanField(default=False)
    revoked_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shared_resources'
        verbose_name = _('Shared Resource')
        verbose_name_plural = _('Shared Resources')
        unique_together = ['content_type', 'object_id', 'shared_with']
        indexes = [
            models.Index(fields=['shared_with', 'is_accepted']),
            models.Index(fields=['shared_by']),
        ]

    def __str__(self):
        return f"{self.content_type.model} shared with {self.shared_with.email}"


class Reaction(models.Model):
    """
    Reactions to comments (like, thumbs up, etc.)
    """
    class ReactionType(models.TextChoices):
        LIKE = 'like', _('Like')
        THUMBS_UP = 'thumbs_up', _('Thumbs Up')
        THUMBS_DOWN = 'thumbs_down', _('Thumbs Down')
        HEART = 'heart', _('Heart')
        CELEBRATE = 'celebrate', _('Celebrate')
        THINKING = 'thinking', _('Thinking')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reactions')
    reaction_type = models.CharField(max_length=20, choices=ReactionType.choices)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reactions'
        verbose_name = _('Reaction')
        verbose_name_plural = _('Reactions')
        unique_together = ['comment', 'user', 'reaction_type']

    def __str__(self):
        return f"{self.user.email} - {self.reaction_type} on comment"
