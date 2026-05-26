"""
Migration for PatentAnalysisResult model.
"""

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('analytics', '0007_add_portfolio_odp_data_sources'),
    ]

    operations = [
        migrations.CreateModel(
            name='PatentAnalysisResult',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('application_id', models.CharField(db_index=True, max_length=64)),
                ('patent_number', models.CharField(blank=True, default='', max_length=32)),
                ('model_used', models.CharField(max_length=50)),
                ('analysis_version', models.CharField(default='1.0', max_length=10)),
                ('total_input_tokens', models.IntegerField(default=0)),
                ('total_output_tokens', models.IntegerField(default=0)),
                ('total_cost_usd', models.DecimalField(decimal_places=4, default=0, max_digits=8)),
                ('processing_time_seconds', models.FloatField(default=0)),
                ('keywords', models.JSONField(default=dict)),
                ('novel_elements', models.JSONField(default=dict)),
                ('claim_scope', models.JSONField(default=dict)),
                ('embodiments', models.JSONField(default=dict)),
                ('background_analysis', models.JSONField(default=dict)),
                ('claim_tree', models.JSONField(default=dict)),
                ('means_plus_function', models.JSONField(default=dict)),
                ('vulnerabilities', models.JSONField(default=dict)),
                ('section_status', models.JSONField(default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'db_table': 'analytics_patent_analysis',
                'ordering': ['-created_at'],
                'indexes': [
                    models.Index(fields=['application_id', '-created_at'], name='analytics_p_applica_idx'),
                ],
            },
        ),
    ]
