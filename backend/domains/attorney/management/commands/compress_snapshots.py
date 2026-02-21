"""
Management command to compress AttorneySnapshot data.

Removes consecutive identical snapshots per registration_number, keeping only:
  - The first appearance of each attorney
  - Any month where tracked fields changed from the previous snapshot

This typically reduces row count by ~90%, since most attorneys' data doesn't
change month-to-month.
"""

from django.core.management.base import BaseCommand
from django.db import connection

from domains.attorney.models import AttorneySnapshot

# Fields to compare between consecutive snapshots
TRACKED_FIELDS = [
    'first_name', 'last_name', 'middle_initial', 'suffix',
    'firm_name', 'firm_line_2', 'street_address', 'address_line_2',
    'city', 'state', 'country', 'postal_code', 'phone',
    'practitioner_type', 'govt_employee',
]

BATCH_SIZE = 10000


class Command(BaseCommand):
    help = 'Remove consecutive identical snapshots, keeping only changes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Report counts without deleting',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        total_before = AttorneySnapshot.objects.count()
        self.stdout.write(f'Total snapshots before: {total_before:,}')

        # Get distinct registration numbers
        reg_numbers = list(
            AttorneySnapshot.objects
            .values_list('registration_number', flat=True)
            .distinct()
            .order_by('registration_number')
        )
        self.stdout.write(f'Unique attorneys: {len(reg_numbers):,}')

        total_deleted = 0
        processed = 0

        for i in range(0, len(reg_numbers), BATCH_SIZE):
            batch_regs = reg_numbers[i:i + BATCH_SIZE]
            batch_deleted = 0

            for reg_num in batch_regs:
                snapshots = list(
                    AttorneySnapshot.objects
                    .filter(registration_number=reg_num)
                    .order_by('snapshot_date')
                    .values_list('id', *TRACKED_FIELDS)
                )

                if len(snapshots) <= 1:
                    continue

                ids_to_delete = []
                prev_fields = snapshots[0][1:]  # skip id

                for snap in snapshots[1:]:
                    snap_id = snap[0]
                    current_fields = snap[1:]

                    if current_fields == prev_fields:
                        ids_to_delete.append(snap_id)
                    else:
                        prev_fields = current_fields

                if ids_to_delete and not dry_run:
                    AttorneySnapshot.objects.filter(id__in=ids_to_delete).delete()

                batch_deleted += len(ids_to_delete)

            total_deleted += batch_deleted
            processed += len(batch_regs)
            self.stdout.write(
                f'  Processed {processed:,}/{len(reg_numbers):,} attorneys — '
                f'{batch_deleted:,} removed in this batch'
            )

        total_after = total_before - total_deleted
        pct = (total_deleted / total_before * 100) if total_before else 0
        suffix = ' (dry-run)' if dry_run else ''
        self.stdout.write(self.style.SUCCESS(
            f'\nDone{suffix}. Removed {total_deleted:,} of {total_before:,} rows '
            f'({pct:.1f}%). Remaining: {total_after:,}'
        ))
