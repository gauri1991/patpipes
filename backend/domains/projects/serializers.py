"""
Projects Domain Serializers
Professional API serializers for project management
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Project, ProjectMember, ProjectTask, TaskComment, ProjectFile, 
    TaskAttachment, ProjectMilestone, ProjectTemplate, TemplateTask,
    TemplateMilestone, TemplateFile, ConfigurableProjectType,
    ImportBatch, ImportedPatent
)

User = get_user_model()


class ProjectMemberSerializer(serializers.ModelSerializer):
    """Serializer for project members"""
    
    user_name = serializers.CharField(source='user.full_name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_avatar = serializers.CharField(source='user.avatar', read_only=True)
    
    class Meta:
        model = ProjectMember
        fields = [
            'id', 'user', 'user_name', 'user_email', 'user_avatar',
            'role', 'permissions', 'joined_at'
        ]
        read_only_fields = ['id', 'joined_at']


class TaskCommentSerializer(serializers.ModelSerializer):
    """Serializer for task comments"""
    
    author_name = serializers.CharField(source='author.full_name', read_only=True)
    author_avatar = serializers.CharField(source='author.avatar', read_only=True)
    
    class Meta:
        model = TaskComment
        fields = [
            'id', 'content', 'author', 'author_name', 'author_avatar',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']


class TaskAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for task attachments"""
    
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    
    class Meta:
        model = TaskAttachment
        fields = [
            'id', 'file_name', 'file_size', 'file_type', 'file_url',
            'uploaded_by', 'uploaded_by_name', 'uploaded_at'
        ]
        read_only_fields = ['id', 'file_url', 'uploaded_by', 'uploaded_at']


class ProjectTaskSerializer(serializers.ModelSerializer):
    """Serializer for project tasks"""
    
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    attachments = TaskAttachmentSerializer(many=True, read_only=True)
    subtasks = serializers.SerializerMethodField()
    dependencies_data = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectTask
        fields = [
            'id', 'title', 'description', 'status', 'priority',
            'assigned_to', 'assigned_to_name', 'due_date', 'start_date',
            'completed_date', 'estimated_hours', 'actual_hours',
            'parent_task', 'progress_percentage', 'tags',
            'created_at', 'updated_at', 'created_by',
            'comments', 'attachments', 'subtasks', 'dependencies_data'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'completed_date', 'created_by']

    def get_subtasks(self, obj):
        """Get subtasks recursively"""
        subtasks = obj.subtasks.all()
        return ProjectTaskSerializer(subtasks, many=True, context=self.context).data

    def get_dependencies_data(self, obj):
        """Get task dependencies with basic info"""
        dependencies = obj.dependencies.all()
        return [{
            'id': str(task.id),
            'title': task.title,
            'status': task.status
        } for task in dependencies]


class ProjectFileSerializer(serializers.ModelSerializer):
    """Serializer for project files"""
    
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)
    file_size_formatted = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectFile
        fields = [
            'id', 'original_name', 'file_size', 'file_size_formatted',
            'mime_type', 'category', 'version', 'is_latest_version',
            'tags', 'description', 'file_url', 'uploaded_by',
            'uploaded_by_name', 'uploaded_at', 'last_accessed_at',
            'access_count', 'is_public'
        ]
        read_only_fields = [
            'id', 'file_url', 'uploaded_by', 'uploaded_at',
            'last_accessed_at', 'access_count'
        ]

    def get_file_size_formatted(self, obj):
        """Format file size in human readable format"""
        size = obj.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"


class ProjectMilestoneSerializer(serializers.ModelSerializer):
    """Serializer for project milestones"""
    
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    dependent_tasks_data = serializers.SerializerMethodField()
    
    class Meta:
        model = ProjectMilestone
        fields = [
            'id', 'title', 'description', 'target_date', 'completed_date',
            'is_completed', 'importance', 'color', 'created_at',
            'updated_at', 'created_by', 'created_by_name',
            'dependent_tasks_data'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'completed_date', 'created_by']

    def get_dependent_tasks_data(self, obj):
        """Get dependent tasks with basic info"""
        tasks = obj.dependent_tasks.all()
        return [{
            'id': str(task.id),
            'title': task.title,
            'status': task.status,
            'progress_percentage': task.progress_percentage
        } for task in tasks]


class ProjectSerializer(serializers.ModelSerializer):
    """Main project serializer"""
    
    lead_attorney_name = serializers.CharField(source='lead_attorney.full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    members = ProjectMemberSerializer(many=True, read_only=True)
    tasks = ProjectTaskSerializer(many=True, read_only=True)
    files = ProjectFileSerializer(many=True, read_only=True)
    milestones = ProjectMilestoneSerializer(many=True, read_only=True)
    
    # Computed fields
    total_tasks = serializers.ReadOnlyField()
    completed_tasks = serializers.ReadOnlyField()
    budget_utilization = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'type', 'status', 'priority',
            'client_name', 'client_email', 'organization',
            'budget', 'actual_cost', 'currency', 'start_date',
            'target_date', 'completed_date', 'lead_attorney',
            'lead_attorney_name', 'progress_percentage', 'tags',
            'is_template', 'template', 'created_at', 'updated_at',
            'created_by', 'created_by_name', 'members', 'tasks',
            'files', 'milestones', 'total_tasks', 'completed_tasks',
            'budget_utilization', 'days_remaining', 'is_overdue'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'completed_date',
            'total_tasks', 'completed_tasks'
        ]

    def get_budget_utilization(self, obj):
        """Calculate budget utilization percentage"""
        if obj.budget and obj.budget > 0:
            return (float(obj.actual_cost) / float(obj.budget)) * 100
        return 0

    def get_days_remaining(self, obj):
        """Calculate days remaining until target date"""
        if obj.target_date:
            from django.utils import timezone
            today = timezone.now().date()
            return (obj.target_date - today).days
        return None

    def get_is_overdue(self, obj):
        """Check if project is overdue"""
        if obj.target_date and obj.status not in ['completed', 'archived']:
            from django.utils import timezone
            return obj.target_date < timezone.now().date()
        return False


class ProjectListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for project lists"""
    
    lead_attorney_name = serializers.CharField(source='lead_attorney.full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    members_count = serializers.SerializerMethodField()
    total_tasks = serializers.ReadOnlyField()
    completed_tasks = serializers.ReadOnlyField()
    days_remaining = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'name', 'description', 'type', 'status', 'priority',
            'client_name', 'budget', 'actual_cost', 'currency',
            'start_date', 'target_date', 'lead_attorney',
            'lead_attorney_name', 'progress_percentage', 'tags',
            'created_at', 'updated_at', 'created_by_name',
            'members_count', 'total_tasks', 'completed_tasks',
            'days_remaining', 'is_overdue'
        ]

    def get_members_count(self, obj):
        return obj.members.count()

    def get_days_remaining(self, obj):
        if obj.target_date:
            from django.utils import timezone
            today = timezone.now().date()
            return (obj.target_date - today).days
        return None

    def get_is_overdue(self, obj):
        if obj.target_date and obj.status not in ['completed', 'archived']:
            from django.utils import timezone
            return obj.target_date < timezone.now().date()
        return False


class TemplateTaskSerializer(serializers.ModelSerializer):
    """Serializer for template tasks"""
    
    class Meta:
        model = TemplateTask
        fields = [
            'id', 'title', 'description', 'priority', 'estimated_hours',
            'day_offset', 'required_role', 'order'
        ]


class TemplateMilestoneSerializer(serializers.ModelSerializer):
    """Serializer for template milestones"""
    
    class Meta:
        model = TemplateMilestone
        fields = [
            'id', 'title', 'description', 'day_offset', 'importance', 'order'
        ]


class TemplateFileSerializer(serializers.ModelSerializer):
    """Serializer for template files"""
    
    class Meta:
        model = TemplateFile
        fields = [
            'id', 'name', 'category', 'description', 'is_required', 'order'
        ]


class ProjectTemplateSerializer(serializers.ModelSerializer):
    """Serializer for project templates"""
    
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    default_tasks = TemplateTaskSerializer(many=True, read_only=True)
    default_milestones = TemplateMilestoneSerializer(many=True, read_only=True)
    default_files = TemplateFileSerializer(many=True, read_only=True)
    
    class Meta:
        model = ProjectTemplate
        fields = [
            'id', 'name', 'description', 'type', 'category',
            'estimated_duration', 'estimated_budget', 'usage_count',
            'is_public', 'created_at', 'updated_at', 'created_by',
            'created_by_name', 'default_tasks', 'default_milestones',
            'default_files'
        ]
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at']


class CreateProjectSerializer(serializers.ModelSerializer):
    """Serializer for creating projects"""
    
    assigned_member_ids = serializers.ListField(
        child=serializers.UUIDField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Project
        fields = [
            'name', 'description', 'type', 'priority', 'client_name',
            'client_email', 'budget', 'currency', 'start_date',
            'target_date', 'tags', 'template', 'assigned_member_ids'
        ]

    def create(self, validated_data):
        assigned_member_ids = validated_data.pop('assigned_member_ids', [])
        project = super().create(validated_data)
        
        # Add project members
        for user_id in assigned_member_ids:
            try:
                user = User.objects.get(id=user_id)
                ProjectMember.objects.create(
                    project=project,
                    user=user,
                    role='viewer'  # Default role
                )
            except User.DoesNotExist:
                continue
        
        return project


class ProjectStatisticsSerializer(serializers.Serializer):
    """Serializer for project statistics"""
    
    total_projects = serializers.IntegerField()
    active_projects = serializers.IntegerField()
    completed_projects = serializers.IntegerField()
    overdue_projects = serializers.IntegerField()
    
    total_tasks = serializers.IntegerField()
    completed_tasks = serializers.IntegerField()
    overdue_tasks = serializers.IntegerField()
    
    average_completion_time = serializers.FloatField()
    success_rate = serializers.FloatField()
    
    budget_utilization = serializers.DictField()


class TimelineItemSerializer(serializers.Serializer):
    """Serializer for timeline items"""
    
    id = serializers.CharField()
    type = serializers.CharField()
    title = serializers.CharField()
    start_date = serializers.DateTimeField()
    end_date = serializers.DateTimeField(required=False)
    status = serializers.CharField()
    assignee = serializers.DictField(required=False)
    color = serializers.CharField(required=False)
    dependencies = serializers.ListField(child=serializers.CharField(), required=False)


class ProjectTypeSerializer(serializers.ModelSerializer):
    """Serializer for configurable project types"""
    
    class Meta:
        model = ConfigurableProjectType
        fields = [
            'id', 'name', 'description', 'category', 'is_active',
            'required_fields', 'estimated_duration', 'color',
            'permissions', 'min_role_level', 'display_order', 'icon',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ImportedPatentSerializer(serializers.ModelSerializer):
    """Serializer for imported patents"""
    
    imported_by_name = serializers.CharField(source='import_batch.imported_by.full_name', read_only=True)
    source_filename = serializers.CharField(source='import_batch.source_filename', read_only=True)
    batch_id = serializers.CharField(source='import_batch.id', read_only=True)
    display_inventors = serializers.ReadOnlyField()
    display_classifications = serializers.ReadOnlyField()
    source_info = serializers.ReadOnlyField()
    
    class Meta:
        model = ImportedPatent
        fields = [
            'id', 'patent_id', 'title', 'abstract', 'publication_date',
            'application_date', 'priority_date', 'publication_number',
            'application_number', 'family_id', 'assignee', 'inventors',
            'ipc_classes', 'cpc_classes', 'jurisdiction', 'legal_status',
            'keywords', 'citations', 'is_selected', 'manual_relevance',
            'relevance_score', 'user_notes', 'source_row_number',
            'import_errors', 'created_at', 'updated_at',
            'imported_by_name', 'source_filename', 'batch_id',
            'display_inventors', 'display_classifications', 'source_info'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'imported_by_name',
            'source_filename', 'batch_id', 'display_inventors',
            'display_classifications', 'source_info'
        ]


class ImportBatchSerializer(serializers.ModelSerializer):
    """Serializer for import batches"""
    
    imported_by_name = serializers.CharField(source='imported_by.full_name', read_only=True)
    patents = ImportedPatentSerializer(many=True, read_only=True)
    success_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = ImportBatch
        fields = [
            'id', 'batch_name', 'batch_description', 'source_filename',
            'total_rows', 'successful_imports', 'failed_imports', 'status',
            'import_settings', 'imported_by', 'imported_by_name',
            'imported_at', 'completed_at', 'error_log', 'patents',
            'success_rate'
        ]
        read_only_fields = [
            'id', 'imported_by', 'imported_at', 'completed_at',
            'success_rate'
        ]


class CreateImportBatchSerializer(serializers.ModelSerializer):
    """Serializer for creating import batches with patents"""
    
    patents = serializers.ListField(child=serializers.DictField(), write_only=True)
    
    class Meta:
        model = ImportBatch
        fields = [
            'batch_name', 'batch_description', 'source_filename',
            'import_settings', 'patents'
        ]
    
    def _get_default_user(self):
        """Get a default user for anonymous imports"""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        # Try to get a system admin user, or create one if needed
        default_user, created = User.objects.get_or_create(
            email='system@patents.local',
            defaults={
                'first_name': 'System',
                'last_name': 'User',
                'role': 'admin',
                'is_active': True,
            }
        )
        return default_user
    
    def create(self, validated_data):
        from django.utils import timezone
        from django.db import transaction
        
        patents_data = validated_data.pop('patents', [])
        project = self.context['project']
        user = self.context['request'].user
        
        # Handle AnonymousUser case - use project creator or get a default user
        if user.is_anonymous:
            user = project.created_by if hasattr(project, 'created_by') and project.created_by else self._get_default_user()
        
        with transaction.atomic():
            # Create import batch
            import_batch = ImportBatch.objects.create(
                project=project,
                imported_by=user,
                total_rows=len(patents_data),
                **validated_data
            )
            
            # Create patents
            patents = []
            successful_imports = 0
            failed_imports = 0
            errors = []
            
            for index, patent_data in enumerate(patents_data):
                try:
                    # Validate required fields
                    if not patent_data.get('patent_id') or not patent_data.get('title'):
                        errors.append({
                            'row': index + 1,
                            'error': 'Missing required fields: patent_id or title'
                        })
                        failed_imports += 1
                        continue
                    
                    # Check for duplicates in this project
                    if ImportedPatent.active.filter(
                        project=project,
                        patent_id=patent_data['patent_id']
                    ).exists():
                        errors.append({
                            'row': index + 1,
                            'error': f'Duplicate patent ID: {patent_data["patent_id"]}'
                        })
                        failed_imports += 1
                        continue
                    
                    # Create patent
                    patent = ImportedPatent.objects.create(
                        project=project,
                        import_batch=import_batch,
                        source_row_number=index + 1,
                        **patent_data
                    )
                    patents.append(patent)
                    successful_imports += 1
                    
                except Exception as e:
                    errors.append({
                        'row': index + 1,
                        'error': str(e)
                    })
                    failed_imports += 1
            
            # Update batch statistics
            import_batch.successful_imports = successful_imports
            import_batch.failed_imports = failed_imports
            import_batch.error_log = errors
            
            if failed_imports == 0:
                import_batch.status = 'completed'
            elif successful_imports == 0:
                import_batch.status = 'failed'
            else:
                import_batch.status = 'partial'
            
            import_batch.completed_at = timezone.now()
            import_batch.save()
            
            return import_batch


class ImportedPatentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for patent lists"""
    
    source_filename = serializers.CharField(source='import_batch.source_filename', read_only=True)
    imported_at = serializers.DateTimeField(source='import_batch.imported_at', read_only=True)
    
    class Meta:
        model = ImportedPatent
        fields = [
            'id', 'patent_id', 'title', 'assignee', 'publication_date',
            'is_selected', 'manual_relevance', 'relevance_score',
            'source_filename', 'imported_at', 'created_at'
        ]