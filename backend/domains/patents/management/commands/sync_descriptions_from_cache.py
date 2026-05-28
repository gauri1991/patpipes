"""
One-off backfill: sync the parsed full-text description from ODPCacheEntry
(populated by the AI Analysis tab fetches) into Patent.description, and from
there into PatentRecord.description for each analytics dataset that references
the patent.

No API calls — just moves data from cache into typed storage so bundle scoring
and Group A classification can see the full spec text.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone

from domains.patents.models import Patent
from domains.analytics.models import ODPCacheEntry, PatentRecord


class Command(BaseCommand):
    help = 'Backfill Patent.description and PatentRecord.description from ODPCacheEntry full-text data.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--portfolio',
            type=str,
            default=None,
            help='Only process patents in this portfolio ID (default: all patents).',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Overwrite descriptions that are already populated.',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Report what would change without writing.',
        )

    def handle(self, *args, **opts):
        # ── Phase 1: Patent.description ←  ODPCacheEntry ─────────────────────
        cache_qs = ODPCacheEntry.objects.filter(endpoint='full-text-parsed')
        app_ids_with_cache = set(cache_qs.values_list('application_id', flat=True))
        self.stdout.write(f'Found {len(app_ids_with_cache)} cached full-text entries.')

        patents_qs = Patent.objects.filter(application_number__in=app_ids_with_cache)
        if opts['portfolio']:
            patents_qs = patents_qs.filter(portfolio_id=opts['portfolio'])

        patent_updates = []
        skipped = 0
        for patent in patents_qs.iterator(chunk_size=200):
            if patent.description and not opts['force']:
                skipped += 1
                continue

            cache = cache_qs.filter(application_id=patent.application_number).first()
            if not cache or not cache.response_data:
                continue
            data = cache.response_data
            # Prefer grant_text (issued patent); fall back to pgpub_text (publication)
            source_label = ''
            parsed = None
            grant = data.get('grant_text')
            pgpub = data.get('pgpub_text')
            if grant and isinstance(grant, dict) and grant.get('description'):
                parsed = grant
                source_label = 'grant'
            elif pgpub and isinstance(pgpub, dict) and pgpub.get('description'):
                parsed = pgpub
                source_label = 'pgpub'
            if not parsed:
                continue

            description = parsed.get('description') or ''
            if not description:
                continue

            patent.description = description
            patent.description_source = source_label
            patent.description_fetched_at = timezone.now()
            patent_updates.append(patent)

        self.stdout.write(
            f'Patents with description to update: {len(patent_updates)}  '
            f'(skipped {skipped} already-populated; pass --force to overwrite)'
        )

        if not opts['dry_run'] and patent_updates:
            Patent.objects.bulk_update(
                patent_updates,
                ['description', 'description_source', 'description_fetched_at'],
                batch_size=200,
            )
            self.stdout.write(self.style.SUCCESS(f'Wrote {len(patent_updates)} Patent rows.'))

        # ── Phase 2: PatentRecord.description ← Patent.description ──────────
        # Copy from the source Patent into every analytics PatentRecord that
        # references it via raw_data['patent_id_source'] (portfolio import path).
        patents_with_desc = Patent.objects.exclude(description='').only('id', 'description')
        if opts['portfolio']:
            patents_with_desc = patents_with_desc.filter(portfolio_id=opts['portfolio'])
        desc_by_patent_id = {str(p.id): p.description for p in patents_with_desc}
        self.stdout.write(
            f'\nLooking for PatentRecord rows linked to {len(desc_by_patent_id)} source patents…'
        )

        record_qs = PatentRecord.objects.filter(
            raw_data__patent_id_source__in=list(desc_by_patent_id.keys())
        )

        record_updates = []
        rec_skipped = 0
        for rec in record_qs.iterator(chunk_size=300):
            if rec.description and not opts['force']:
                rec_skipped += 1
                continue
            src_id = (rec.raw_data or {}).get('patent_id_source')
            desc = desc_by_patent_id.get(str(src_id)) if src_id else None
            if not desc:
                continue
            rec.description = desc
            record_updates.append(rec)

        self.stdout.write(
            f'PatentRecord rows with description to update: {len(record_updates)}  '
            f'(skipped {rec_skipped} already-populated)'
        )

        if not opts['dry_run'] and record_updates:
            PatentRecord.objects.bulk_update(
                record_updates, ['description'], batch_size=200,
            )
            self.stdout.write(self.style.SUCCESS(f'Wrote {len(record_updates)} PatentRecord rows.'))

        if opts['dry_run']:
            self.stdout.write(self.style.WARNING('\nDRY RUN — no changes written.'))
