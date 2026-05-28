"""
Bulk-fetch full-text descriptions from USPTO ODP for Patents that don't have
description populated yet. Stores parsed text in ODPCacheEntry AND directly
into Patent.description for downstream use.

Usage:
    manage.py fetch_full_text_for_patents --portfolio=<id>           # one portfolio
    manage.py fetch_full_text_for_patents --portfolio=<id> --limit=50
    manage.py fetch_full_text_for_patents --portfolio=<id> --rate=30 # req/min
"""
import time
from django.core.management.base import BaseCommand
from django.utils import timezone

from domains.patents.models import Patent
from domains.analytics.models import ODPCacheEntry


class Command(BaseCommand):
    help = "Fetch full-text descriptions from USPTO ODP for patents without one."

    def add_arguments(self, parser):
        parser.add_argument('--portfolio', type=str, default=None,
                            help='Restrict to a single portfolio ID (default: all).')
        parser.add_argument('--limit', type=int, default=0,
                            help='Stop after N successful fetches (default: no limit).')
        parser.add_argument('--rate', type=int, default=30,
                            help='Max requests per minute (default: 30, USPTO-friendly).')
        parser.add_argument('--force', action='store_true',
                            help='Overwrite descriptions that are already populated.')
        parser.add_argument('--dry-run', action='store_true',
                            help='List what would be fetched without fetching.')

    def handle(self, *args, **opts):
        from domains.analytics.odp_views import _fetch_and_parse_xml
        from domains.analytics.uspto_odp_service import USPTOODPClient
        from domains.analytics.models import LLMProviderConfig  # noqa: F401 — just to access PatentAPIConfiguration

        # Get an authenticated ODP client
        try:
            client = USPTOODPClient()
            api_key = getattr(client, 'api_key', None) or getattr(client.client, 'api_key', None)
        except Exception as e:
            self.stderr.write(self.style.ERROR(f'Could not initialize ODP client: {e}'))
            return

        # Pick patents that need fetching
        qs = Patent.objects.exclude(odp_raw_data={})
        if opts['portfolio']:
            qs = qs.filter(portfolio_id=opts['portfolio'])
        if not opts['force']:
            qs = qs.filter(description='')

        total = qs.count()
        self.stdout.write(f'Candidate patents: {total}')

        if opts['limit']:
            qs = qs[:opts['limit']]

        interval = 60.0 / max(opts['rate'], 1)
        fetched = 0
        skipped_no_url = 0
        failed = 0

        for i, patent in enumerate(qs.iterator(chunk_size=50), start=1):
            app_id = patent.application_number
            odp = patent.odp_raw_data or {}

            # Find grant_url first, then pgpub_url
            grant_meta = odp.get('grantDocumentMetaData') or {}
            pgpub_meta = odp.get('pgpubDocumentMetaData') or odp.get('publicationDocumentMetaData') or {}

            grant_url = grant_meta.get('fileLocationURI')
            pgpub_url = pgpub_meta.get('fileLocationURI')

            if not (grant_url or pgpub_url):
                skipped_no_url += 1
                continue

            if opts['dry_run']:
                self.stdout.write(f'  [{i}/{total}] {app_id} — would fetch (grant={bool(grant_url)}, pgpub={bool(pgpub_url)})')
                continue

            # Fetch — prefer grant text (issued patent text)
            parsed = None
            source = ''
            if grant_url:
                parsed = _fetch_and_parse_xml(grant_url, api_key)
                if parsed and parsed.get('description'):
                    source = 'grant'
            if (not parsed or not parsed.get('description')) and pgpub_url:
                parsed = _fetch_and_parse_xml(pgpub_url, api_key)
                if parsed and parsed.get('description'):
                    source = 'pgpub'

            if not parsed or not parsed.get('description'):
                failed += 1
                self.stdout.write(self.style.WARNING(f'  [{i}/{total}] {app_id} — fetch returned no description'))
                time.sleep(interval)
                continue

            # Write description directly to Patent
            patent.description = parsed['description']
            patent.description_source = source
            patent.description_fetched_at = timezone.now()
            patent.save(update_fields=['description', 'description_source', 'description_fetched_at'])

            # Also seed ODPCacheEntry so the AI Analysis tab can reuse it
            cache_payload = {
                'grant_text':  parsed if source == 'grant'  else None,
                'pgpub_text':  parsed if source == 'pgpub'  else None,
            }
            ODPCacheEntry.objects.update_or_create(
                application_id=app_id,
                endpoint='full-text-parsed',
                defaults={'response_data': cache_payload, 'fetched_at': timezone.now()},
            )

            fetched += 1
            if fetched % 10 == 0:
                self.stdout.write(f'  [{i}/{total}] {app_id} — ok ({len(parsed["description"]):,} chars, source={source})')

            time.sleep(interval)  # rate limit

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. fetched={fetched}  skipped_no_url={skipped_no_url}  failed={failed}'
        ))
