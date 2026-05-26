"""
Add AnalysisPromptTemplate model and prompt tracking fields to PatentAnalysisResult.
"""

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('analytics', '0009_llmproviderconfig'),
    ]

    operations = [
        # Add prompt tracking fields to PatentAnalysisResult
        migrations.AddField(
            model_name='patentanalysisresult',
            name='prompt_category',
            field=models.CharField(blank=True, default='general', max_length=30),
        ),
        migrations.AddField(
            model_name='patentanalysisresult',
            name='prompts_used',
            field=models.JSONField(default=dict),
        ),
        # Fix related_name on created_by
        migrations.AlterField(
            model_name='patentanalysisresult',
            name='created_by',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='patent_analyses',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        # Create AnalysisPromptTemplate
        migrations.CreateModel(
            name='AnalysisPromptTemplate',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('section', models.CharField(
                    choices=[
                        ('keywords', 'Keyword Extraction'),
                        ('novel_elements', 'Novel Element Identification'),
                        ('claim_scope', 'Claim Scope & Broadness'),
                        ('embodiments', 'Embodiment Analysis'),
                        ('background_analysis', 'Background & Problem Analysis'),
                        ('means_plus_function', 'Means-Plus-Function Detection'),
                        ('vulnerabilities', 'Prosecution Vulnerability Assessment'),
                    ],
                    max_length=30,
                )),
                ('category', models.CharField(
                    choices=[
                        ('general', 'General'),
                        ('hi_tech', 'Hi-Tech / Software'),
                        ('biomedical', 'Biomedical'),
                        ('life_science', 'Life Science'),
                        ('mechanical', 'Mechanical'),
                        ('electrical', 'Electrical'),
                        ('chemical', 'Chemical'),
                        ('pharma', 'Pharmaceutical'),
                        ('semiconductor', 'Semiconductor'),
                    ],
                    default='general',
                    max_length=30,
                )),
                ('version', models.PositiveIntegerField(default=1)),
                ('prompt_text', models.TextField()),
                ('description', models.CharField(blank=True, default='', max_length=255)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='prompt_templates',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'db_table': 'analytics_prompt_template',
                'ordering': ['section', 'category', '-version'],
                'unique_together': {('section', 'category', 'version')},
            },
        ),
    ]
