"""
Backfill technology_area for patents that already have ipc_classifications
but were enriched before the _derive_technology_area mapping was added.
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from domains.patents.models import Patent
from domains.patents.enrichment_service import _derive_technology_area


class Command(BaseCommand):
    help = 'Derive technology_area from ipc_classifications for already-enriched patents'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Show counts without saving')
        parser.add_argument('--batch-size', type=int, default=500)

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        batch_size = options['batch_size']

        # Re-derive all patents that have classifications (overwrite previous derivations too)
        qs = Patent.objects.exclude(
            ipc_classifications=[]
        ).exclude(ipc_classifications__isnull=True)

        total = qs.count()
        self.stdout.write(f'{total} patents need technology_area derivation')

        updated = 0
        skipped = 0
        processed = 0

        # Collect all IDs upfront so the batch offset is stable even as we update records
        all_ids = list(qs.values_list('id', flat=True).iterator())
        total = len(all_ids)
        self.stdout.write(f'  Collected {total} IDs, processing in batches of {batch_size}')

        for i in range(0, total, batch_size):
            batch_ids = all_ids[i:i + batch_size]
            batch = list(Patent.objects.filter(id__in=batch_ids).only('id', 'technology_area', 'ipc_classifications'))

            to_update = []
            for patent in batch:
                area = _derive_technology_area(patent.ipc_classifications or [])
                if area:
                    patent.technology_area = area
                    to_update.append(patent)
                else:
                    skipped += 1

            if to_update and not dry_run:
                with transaction.atomic():
                    Patent.objects.bulk_update(to_update, ['technology_area'])

            updated += len(to_update)
            processed += len(batch)

            if processed % 5000 < batch_size or processed >= total:
                self.stdout.write(f'  {processed}/{total} processed, {updated} updated, {skipped} skipped')

        self.stdout.write(self.style.SUCCESS(
            f'Done: {updated} updated, {skipped} skipped (no matching code)' +
            (' [DRY RUN]' if dry_run else '')
        ))
