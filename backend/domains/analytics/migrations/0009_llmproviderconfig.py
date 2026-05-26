"""
Migration for LLMProviderConfig model.
"""

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('analytics', '0008_patentanalysisresult'),
    ]

    operations = [
        migrations.CreateModel(
            name='LLMProviderConfig',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, primary_key=True, serialize=False)),
                ('provider', models.CharField(
                    choices=[
                        ('anthropic', 'Anthropic (Claude)'),
                        ('openai', 'OpenAI (GPT)'),
                        ('google', 'Google (Gemini)'),
                        ('cohere', 'Cohere'),
                        ('mistral', 'Mistral AI'),
                    ],
                    max_length=30,
                    unique=True,
                )),
                ('display_name', models.CharField(max_length=100)),
                ('api_key', models.CharField(max_length=500)),
                ('api_base_url', models.CharField(blank=True, default='', max_length=500)),
                ('is_active', models.BooleanField(default=True)),
                ('last_tested_at', models.DateTimeField(blank=True, null=True)),
                ('test_status', models.CharField(
                    choices=[
                        ('never', 'Never Tested'),
                        ('passed', 'Passed'),
                        ('failed', 'Failed'),
                    ],
                    default='never',
                    max_length=10,
                )),
                ('test_error', models.TextField(blank=True, default='')),
                ('notes', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('updated_by', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={
                'db_table': 'analytics_llm_provider_config',
                'ordering': ['provider'],
            },
        ),
    ]
