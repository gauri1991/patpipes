"""
Collaboration Domain Serializers
"""

from rest_framework import serializers
from django.contrib.contenttypes.models import ContentType

from .models import (
    CommentThread,
    Comment,
    Mention,
    Activity,
    Notification,
    SharedResource,
    Reaction
)


class MentionSerializer(serializers.ModelSerializer):
    mentioned_user_name = serializers.CharField(source='mentioned_user.full_name', read_only=True)
    mentioned_user_email = serializers.EmailField(source='mentioned_user.email', read_only=True)

    class Meta:
        model = Mention
        fields = [
            'id', 'mentioned_user', 'mentioned_user_name', 'mentioned_user_email',
            'start_position', 'end_position', 'is_read', 'read_at', 'created_at'
        ]
        read_only_fields = ['id', 'mentioned_by', 'created_at']


class ReactionSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = Reaction
        fields = ['id', 'user', 'user_name', 'reaction_type', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    author_email = serializers.EmailField(source='author.email', read_only=True)
    author_avatar = serializers.ImageField(source='author.avatar', read_only=True)
    mentions = MentionSerializer(many=True, read_only=True)
    reactions = ReactionSerializer(many=True, read_only=True)
    reply_count = serializers.SerializerMethodField()
    reaction_summary = serializers.SerializerMethodField()

    # For creating comments with mentions
    mention_user_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
        default=list
    )

    class Meta:
        model = Comment
        fields = [
            'id', 'thread', 'parent', 'text', 'is_edited', 'attachments',
            'author', 'author_name', 'author_email', 'author_avatar',
            'mentions', 'reactions', 'reply_count', 'reaction_summary',
            'mention_user_ids', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'is_edited', 'created_at', 'updated_at']

    def get_reply_count(self, obj):
        return obj.replies.count()

    def get_reaction_summary(self, obj):
        reactions = obj.reactions.all()
        summary = {}
        for reaction in reactions:
            if reaction.reaction_type not in summary:
                summary[reaction.reaction_type] = 0
            summary[reaction.reaction_type] += 1
        return summary


class CommentCreateSerializer(serializers.ModelSerializer):
    mention_user_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False,
        default=list
    )
    # For standalone comments
    content_type_name = serializers.CharField(write_only=True, required=False)
    object_id = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Comment
        fields = ['thread', 'parent', 'text', 'attachments', 'mention_user_ids',
                  'content_type_name', 'object_id']

    def create(self, validated_data):
        mention_user_ids = validated_data.pop('mention_user_ids', [])
        content_type_name = validated_data.pop('content_type_name', None)
        object_id = validated_data.pop('object_id', None)

        # Set content type for standalone comments
        if content_type_name and object_id:
            app_label, model = content_type_name.split('.')
            content_type = ContentType.objects.get(app_label=app_label, model=model)
            validated_data['content_type'] = content_type
            validated_data['object_id'] = object_id

        comment = Comment.objects.create(**validated_data)

        # Create mentions
        from domains.accounts.models import User
        for user_id in mention_user_ids:
            try:
                mentioned_user = User.objects.get(id=user_id)
                Mention.objects.create(
                    comment=comment,
                    mentioned_user=mentioned_user,
                    mentioned_by=comment.author
                )
            except User.DoesNotExist:
                pass

        return comment


class CommentThreadSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    resolved_by_name = serializers.CharField(source='resolved_by.full_name', read_only=True)
    comment_count = serializers.IntegerField(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)

    # For creating threads
    content_type_name = serializers.CharField(write_only=True, required=False)
    object_id = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = CommentThread
        fields = [
            'id', 'title', 'is_resolved', 'resolved_by', 'resolved_by_name',
            'resolved_at', 'anchor_text', 'position_data', 'created_by',
            'created_by_name', 'comment_count', 'comments',
            'content_type_name', 'object_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'resolved_at', 'created_at', 'updated_at']

    def create(self, validated_data):
        content_type_name = validated_data.pop('content_type_name', None)
        object_id = validated_data.pop('object_id', None)

        if content_type_name and object_id:
            app_label, model = content_type_name.split('.')
            content_type = ContentType.objects.get(app_label=app_label, model=model)
            validated_data['content_type'] = content_type
            validated_data['object_id'] = object_id

        return super().create(validated_data)


class ActivitySerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.full_name', read_only=True)
    actor_email = serializers.EmailField(source='actor.email', read_only=True)
    actor_avatar = serializers.ImageField(source='actor.avatar', read_only=True)
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)

    class Meta:
        model = Activity
        fields = [
            'id', 'actor', 'actor_name', 'actor_email', 'actor_avatar',
            'activity_type', 'activity_type_display', 'description', 'metadata',
            'project_id', 'created_at'
        ]
        read_only_fields = ['id', 'actor', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.full_name', read_only=True)
    actor_avatar = serializers.ImageField(source='actor.avatar', read_only=True)
    notification_type_display = serializers.CharField(source='get_notification_type_display', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'notification_type', 'notification_type_display', 'priority',
            'title', 'message', 'action_url', 'actor', 'actor_name', 'actor_avatar',
            'is_read', 'read_at', 'is_dismissed', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class SharedResourceSerializer(serializers.ModelSerializer):
    shared_by_name = serializers.CharField(source='shared_by.full_name', read_only=True)
    shared_with_name = serializers.CharField(source='shared_with.full_name', read_only=True)
    shared_with_email = serializers.EmailField(source='shared_with.email', read_only=True)
    resource_type = serializers.CharField(source='content_type.model', read_only=True)
    permission_display = serializers.CharField(source='get_permission_display', read_only=True)

    # For creating shares
    content_type_name = serializers.CharField(write_only=True, required=False)
    object_id = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = SharedResource
        fields = [
            'id', 'shared_by', 'shared_by_name', 'shared_with', 'shared_with_name',
            'shared_with_email', 'permission', 'permission_display', 'resource_type',
            'message', 'expires_at', 'is_accepted', 'accepted_at', 'is_revoked',
            'content_type_name', 'object_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'shared_by', 'is_accepted', 'accepted_at', 'is_revoked',
                           'created_at', 'updated_at']

    def create(self, validated_data):
        content_type_name = validated_data.pop('content_type_name', None)
        object_id = validated_data.pop('object_id', None)

        if content_type_name and object_id:
            app_label, model = content_type_name.split('.')
            content_type = ContentType.objects.get(app_label=app_label, model=model)
            validated_data['content_type'] = content_type
            validated_data['object_id'] = object_id

        return super().create(validated_data)
