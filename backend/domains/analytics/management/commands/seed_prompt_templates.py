"""
Seed default prompt templates into the AnalysisPromptTemplate table.

Usage:
    python manage.py seed_prompt_templates          # seed only if empty
    python manage.py seed_prompt_templates --force   # re-seed (creates new versions)
"""

from django.core.management.base import BaseCommand

from domains.analytics.models import AnalysisPromptTemplate
from domains.analytics.patent_analysis_service import DEFAULT_PROMPTS


class Command(BaseCommand):
    help = 'Seed default analysis prompt templates into the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Re-seed even if templates already exist (creates new versions)',
        )

    def handle(self, *args, **options):
        force = options['force']
        existing = AnalysisPromptTemplate.objects.count()

        if existing > 0 and not force:
            self.stdout.write(
                self.style.WARNING(
                    f'{existing} prompt templates already exist. Use --force to re-seed.'
                )
            )
            return

        created = 0
        for section, prompt_text in DEFAULT_PROMPTS.items():
            # Check current latest version for this section+general
            latest = (
                AnalysisPromptTemplate.objects
                .filter(section=section, category='general')
                .order_by('-version')
                .first()
            )
            next_version = (latest.version + 1) if latest else 1

            # Deactivate previous versions
            AnalysisPromptTemplate.objects.filter(
                section=section, category='general', is_active=True,
            ).update(is_active=False)

            AnalysisPromptTemplate.objects.create(
                section=section,
                category='general',
                version=next_version,
                prompt_text=prompt_text,
                description=f'Default {section} prompt (seeded)',
                is_active=True,
            )
            created += 1

        self.stdout.write(
            self.style.SUCCESS(f'Created {created} default prompt templates (category=general).')
        )
