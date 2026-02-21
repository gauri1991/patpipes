# Generated manually for Role-Based Access Control models

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('workflows', '0003_add_template_version_model'),
    ]

    operations = [
        migrations.CreateModel(
            name='WorkflowRoleAssignment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('role', models.CharField(choices=[('workflow_admin', 'Workflow Admin'), ('workflow_manager', 'Workflow Manager'), ('step_owner', 'Step Owner'), ('quality_reviewer', 'Quality Reviewer'), ('observer', 'Observer')], help_text='Workflow-specific role', max_length=50)),
                ('is_active', models.BooleanField(default=True)),
                ('granted_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField(blank=True, help_text='Role expiration date (null = no expiration)', null=True)),
                ('notes', models.TextField(blank=True, help_text='Notes about this role assignment')),
                ('granted_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='granted_workflow_roles', to='accounts.user')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workflow_role_assignments', to='accounts.user')),
                ('workflow_instance', models.ForeignKey(blank=True, help_text='Specific workflow instance (null = system-wide role)', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='role_assignments', to='workflows.workflowinstance')),
                ('workflow_template', models.ForeignKey(blank=True, help_text='Specific template (null = system-wide role)', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='role_assignments', to='workflows.workflowtemplate')),
            ],
            options={
                'db_table': 'workflow_role_assignments',
                'ordering': ['-granted_at'],
            },
        ),
        migrations.CreateModel(
            name='WorkflowCollaborator',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('can_comment', models.BooleanField(default=True)),
                ('can_view_sensitive', models.BooleanField(default=False, help_text='Can view sensitive information')),
                ('can_receive_notifications', models.BooleanField(default=True)),
                ('added_at', models.DateTimeField(auto_now_add=True)),
                ('last_activity', models.DateTimeField(blank=True, null=True)),
                ('added_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='added_workflow_collaborators', to='accounts.user')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workflow_collaborations', to='accounts.user')),
                ('workflow_instance', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='collaborators', to='workflows.workflowinstance')),
            ],
            options={
                'db_table': 'workflow_collaborators',
                'ordering': ['-added_at'],
            },
        ),
        migrations.CreateModel(
            name='WorkflowComment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('content', models.TextField()),
                ('is_internal', models.BooleanField(default=False, help_text='Internal comment (not visible to clients)')),
                ('thread_level', models.IntegerField(default=0)),
                ('is_edited', models.BooleanField(default=False)),
                ('edited_at', models.DateTimeField(blank=True, null=True)),
                ('is_deleted', models.BooleanField(default=False)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='workflow_comments', to='accounts.user')),
                ('mentioned_users', models.ManyToManyField(blank=True, related_name='workflow_comment_mentions', to='accounts.user')),
                ('parent_comment', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='replies', to='workflows.workflowcomment')),
                ('step_instance', models.ForeignKey(blank=True, help_text='Optional: Comment on specific step', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='workflows.workflowstepinstance')),
                ('workflow_instance', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='workflows.workflowinstance')),
            ],
            options={
                'db_table': 'workflow_comments',
                'ordering': ['created_at'],
            },
        ),
        migrations.AddConstraint(
            model_name='workflowroleassignment',
            constraint=models.UniqueConstraint(fields=('user', 'role', 'workflow_instance'), name='unique_user_role_instance'),
        ),
        migrations.AddConstraint(
            model_name='workflowroleassignment',
            constraint=models.UniqueConstraint(fields=('user', 'role', 'workflow_template'), name='unique_user_role_template'),
        ),
        migrations.AddConstraint(
            model_name='workflowcollaborator',
            constraint=models.UniqueConstraint(fields=('workflow_instance', 'user'), name='unique_workflow_collaborator'),
        ),
        migrations.AddIndex(
            model_name='workflowroleassignment',
            index=models.Index(fields=['user', 'is_active'], name='workflows_workflowroleassignment_user_active_idx'),
        ),
        migrations.AddIndex(
            model_name='workflowroleassignment',
            index=models.Index(fields=['role', 'is_active'], name='workflows_workflowroleassignment_role_active_idx'),
        ),
        migrations.AddIndex(
            model_name='workflowroleassignment',
            index=models.Index(fields=['workflow_instance', 'role'], name='workflows_workflowroleassignment_instance_role_idx'),
        ),
        migrations.AddIndex(
            model_name='workflowroleassignment',
            index=models.Index(fields=['workflow_template', 'role'], name='workflows_workflowroleassignment_template_role_idx'),
        ),
        migrations.AddIndex(
            model_name='workflowcollaborator',
            index=models.Index(fields=['workflow_instance', 'can_comment'], name='workflows_workflowcollaborator_instance_comment_idx'),
        ),
        migrations.AddIndex(
            model_name='workflowcollaborator',
            index=models.Index(fields=['user', 'can_receive_notifications'], name='workflows_workflowcollaborator_user_notify_idx'),
        ),
        migrations.AddIndex(
            model_name='workflowcomment',
            index=models.Index(fields=['workflow_instance', 'created_at'], name='workflows_workflowcomment_instance_created_idx'),
        ),
        migrations.AddIndex(
            model_name='workflowcomment',
            index=models.Index(fields=['step_instance', 'created_at'], name='workflows_workflowcomment_step_created_idx'),
        ),
        migrations.AddIndex(
            model_name='workflowcomment',
            index=models.Index(fields=['author', 'created_at'], name='workflows_workflowcomment_author_created_idx'),
        ),
        migrations.AddIndex(
            model_name='workflowcomment',
            index=models.Index(fields=['is_deleted', 'is_internal'], name='workflows_workflowcomment_deleted_internal_idx'),
        ),
    ]