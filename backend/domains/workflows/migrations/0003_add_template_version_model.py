# Generated manually for WorkflowTemplateVersion model

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('workflows', '0002_add_versioning'),
    ]

    operations = [
        migrations.CreateModel(
            name='WorkflowTemplateVersion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('version_number', models.CharField(max_length=20)),
                ('version_tag', models.CharField(blank=True, max_length=50)),
                ('template_snapshot', models.JSONField()),
                ('steps_snapshot', models.JSONField()),
                ('quality_controls_snapshot', models.JSONField(default=dict)),
                ('change_summary', models.TextField(blank=True)),
                ('release_notes', models.TextField(blank=True)),
                ('breaking_changes', models.JSONField(default=list)),
                ('is_active', models.BooleanField(default=True)),
                ('is_latest', models.BooleanField(default=False)),
                ('is_stable', models.BooleanField(default=True)),
                ('migration_strategy', models.CharField(choices=[('none', 'NONE'), ('optional', 'OPTIONAL'), ('required', 'REQUIRED'), ('auto', 'AUTO')], default='optional', max_length=20)),
                ('migration_config', models.JSONField(default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('published_at', models.DateTimeField(blank=True, null=True)),
                ('deprecated_at', models.DateTimeField(blank=True, null=True)),
                ('instance_count', models.IntegerField(default=0)),
                ('migration_count', models.IntegerField(default=0)),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='accounts.user')),
                ('parent_version', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='child_versions', to='workflows.workflowtemplateversion')),
                ('workflow_template', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='versions', to='workflows.workflowtemplate')),
            ],
            options={
                'db_table': 'workflow_template_versions',
                'ordering': ['-version_number', '-created_at'],
            },
        ),
        migrations.AddConstraint(
            model_name='workflowtemplateversion',
            constraint=models.UniqueConstraint(fields=('workflow_template', 'version_number'), name='unique_template_version'),
        ),
    ]