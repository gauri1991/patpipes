"""
Management command to import USPTO historical practitioner rosters.

Downloads yearly ZIP files from the USPTO historical rosters page, each
containing monthly snapshots (e.g., 2023-01-WebRoster.txt). Only rows where
data has *changed* from the previous snapshot are stored, keeping the database
compact.  Run ``compress_snapshots`` afterwards to retroactively deduplicate
any data already imported the old way.

Data source: https://www.uspto.gov/learning-and-resources/patent-and-trademark-practitioners/historical-rosters
"""

import csv
import io
import os
import re
import tempfile
import zipfile
from datetime import date
from urllib.request import urlopen

from django.core.management.base import BaseCommand
from django.db import transaction

from domains.attorney.models import AttorneySnapshot


BASE_URL = 'https://www.uspto.gov'

HISTORICAL_ZIPS = [
    '/sites/default/files/documents/Roster-2006_January-through-December-2006.zip',
    '/sites/default/files/documents/Roster-2007_January-through-December-2007.zip',
    '/sites/default/files/documents/Roster-2009_January-through-December-2009.zip',
    '/sites/default/files/documents/Roster-2010_January-through-December-2010.zip',
    '/sites/default/files/documents/Roster-2014_January-through-December-2014.zip',
    '/sites/default/files/documents/Roster-FY-2016_October-2015-through-September-2016.zip',
    '/sites/default/files/documents/Roster-FY-2017_October-2016-through-September-2017.zip',
    '/sites/default/files/documents/Roster-FY-2018_October-2017-through-September-2018.zip',
    '/sites/default/files/documents/Roster-FY-2019_October-2018-through-September-2019.zip',
    '/sites/default/files/documents/Roster-FY-2020_October-2019-through-September-2020.zip',
    '/sites/default/files/documents/Roster-FY-2021_October-2020-through-September-2021.zip',
    '/sites/default/files/documents/Roster-FY-2022_October-2021-through-September-2022.zip',
    '/sites/default/files/documents/FY23Roster.zip',
    '/sites/default/files/documents/FY2024Roster.zip',
    '/sites/default/files/documents/FY25Roster.zip',
]

BATCH_SIZE = 5000

# CSV column indices (same as current roster — no header row, 16 columns)
COL_LAST_NAME = 0
COL_FIRST_NAME = 1
COL_MIDDLE_INITIAL = 2
COL_SUFFIX = 3
COL_FIRM_NAME = 4
COL_FIRM_LINE2 = 5
COL_STREET_ADDRESS = 6
COL_ADDRESS_LINE2 = 7
COL_CITY = 8
COL_STATE = 9
COL_COUNTRY = 10
COL_POSTAL_CODE = 11
COL_PHONE = 12
COL_REG_NUMBER = 13
COL_TYPE = 14
COL_GOVT_EMPLOYEE = 15

# Fields used to detect changes between consecutive snapshots
TRACKED_FIELDS = (
    'first_name', 'last_name', 'middle_initial', 'suffix',
    'firm_name', 'firm_line_2', 'street_address', 'address_line_2',
    'city', 'state', 'country', 'postal_code', 'phone',
    'practitioner_type', 'govt_employee',
)

# Pattern to extract YYYY-MM from filenames like "2023-01-WebRoster.txt"
DATE_PATTERN = re.compile(r'(\d{4})-(\d{2})-?WebRoster', re.IGNORECASE)


class Command(BaseCommand):
    help = 'Import USPTO historical practitioner rosters into AttorneySnapshot'

    def add_arguments(self, parser):
        parser.add_argument(
            '--year',
            type=str,
            help='Only load a specific year/FY (e.g., "2023", "FY2024")',
        )
        parser.add_argument(
            '--file',
            type=str,
            help='Path to a local ZIP file instead of downloading',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all existing snapshots before importing',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Parse and report counts without writing to the database',
        )

    def handle(self, *args, **options):
        year_filter = options.get('year')
        local_file = options.get('file')
        clear = options.get('clear', False)
        dry_run = options.get('dry_run', False)

        if clear:
            count = AttorneySnapshot.objects.count()
            if not dry_run:
                AttorneySnapshot.objects.all().delete()
            self.stdout.write(self.style.SUCCESS(
                f'Deleted {count} snapshots' + (' (dry-run)' if dry_run else '')
            ))

        if local_file:
            self._process_zip(local_file, dry_run)
            return

        # Determine which ZIPs to download
        zips_to_process = HISTORICAL_ZIPS
        if year_filter:
            yf = year_filter.lower().lstrip('fy')
            short_yf = yf[-2:] if len(yf) == 4 else yf
            zips_to_process = [
                z for z in HISTORICAL_ZIPS
                if yf in z.lower() or f'fy{short_yf}' in z.lower()
            ]
            if not zips_to_process:
                self.stderr.write(self.style.ERROR(
                    f'No ZIP files found matching year "{year_filter}"'
                ))
                return

        self.stdout.write(f'Processing {len(zips_to_process)} ZIP files...\n')

        total_snapshots = 0
        for zip_path in zips_to_process:
            url = f'{BASE_URL}{zip_path}'
            filename = os.path.basename(zip_path)
            self.stdout.write(self.style.MIGRATE_HEADING(f'\n=== {filename} ==='))

            try:
                count = self._download_and_process(url, dry_run)
                total_snapshots += count
            except Exception as e:
                self.stderr.write(self.style.ERROR(f'  Error processing {filename}: {e}'))
                continue

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. Total snapshots stored: {total_snapshots:,}'
        ))

    def _download_and_process(self, url, dry_run):
        """Download a ZIP and process all monthly files inside it."""
        self.stdout.write(f'  Downloading {url} ...')
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
        try:
            with urlopen(url) as resp:
                tmp.write(resp.read())
            tmp.close()
            return self._process_zip(tmp.name, dry_run)
        finally:
            os.unlink(tmp.name)

    def _process_zip(self, zip_path, dry_run):
        """Extract all monthly TXT files from a ZIP and load each."""
        total = 0
        with zipfile.ZipFile(zip_path, 'r') as zf:
            txt_files = sorted([
                n for n in zf.namelist()
                if n.lower().endswith('.txt') and 'webroster' in n.lower()
            ])

            if not txt_files:
                self.stderr.write('  No WebRoster.txt files found in ZIP')
                return 0

            self.stdout.write(f'  Found {len(txt_files)} monthly snapshots')

            for txt_name in txt_files:
                snapshot_date = self._parse_date_from_filename(txt_name)
                if not snapshot_date:
                    self.stderr.write(f'  Skipping {txt_name} — could not parse date')
                    continue

                # Check if already loaded
                if not dry_run:
                    existing = AttorneySnapshot.objects.filter(
                        snapshot_date=snapshot_date
                    ).count()
                    if existing > 0:
                        self.stdout.write(
                            f'  {txt_name} ({snapshot_date}) — already loaded '
                            f'({existing:,} rows), skipping'
                        )
                        total += existing
                        continue

                raw = zf.read(txt_name).decode('utf-8', errors='replace')
                rows = list(csv.reader(io.StringIO(raw)))

                if dry_run:
                    self.stdout.write(
                        f'  {txt_name} → {snapshot_date} — {len(rows):,} rows (dry-run)'
                    )
                    total += len(rows)
                    continue

                count = self._load_snapshot(rows, snapshot_date)
                total += count

        return total

    def _parse_date_from_filename(self, filename):
        """Extract a date (first of month) from filename like '2023-01-WebRoster.txt'."""
        match = DATE_PATTERN.search(filename)
        if not match:
            return None
        year = int(match.group(1))
        month = int(match.group(2))
        return date(year, month, 1)

    def _build_previous_lookup(self, snapshot_date):
        """
        Build a dict of {reg_number: (field_tuple)} from the most recent
        snapshot before snapshot_date, so we can detect changes.
        """
        # Find the latest snapshot_date before this one
        prev_date = (
            AttorneySnapshot.objects
            .filter(snapshot_date__lt=snapshot_date)
            .values_list('snapshot_date', flat=True)
            .order_by('-snapshot_date')
            .first()
        )
        if not prev_date:
            return {}  # First ever import — everything is new

        prev_snapshots = (
            AttorneySnapshot.objects
            .filter(snapshot_date=prev_date)
            .values_list('registration_number', *TRACKED_FIELDS)
        )

        # But also include any attorney whose *latest* snapshot is even older
        # (they may not appear in prev_date if they were unchanged for a while)
        # We need each attorney's most recent tracked fields.
        #
        # Optimization: since we only store changes, the most recent row per
        # attorney IS their current state. We can get that efficiently.
        from django.db.models import Max, Subquery, OuterRef

        latest_per_attorney = (
            AttorneySnapshot.objects
            .filter(snapshot_date__lt=snapshot_date)
            .values('registration_number')
            .annotate(latest_date=Max('snapshot_date'))
        )

        # Fetch the actual rows for those latest dates
        latest_snapshots = (
            AttorneySnapshot.objects
            .filter(
                snapshot_date__lt=snapshot_date,
                snapshot_date=Subquery(
                    AttorneySnapshot.objects
                    .filter(
                        registration_number=OuterRef('registration_number'),
                        snapshot_date__lt=snapshot_date,
                    )
                    .order_by('-snapshot_date')
                    .values('snapshot_date')[:1]
                )
            )
            .values_list('registration_number', *TRACKED_FIELDS)
        )

        lookup = {}
        for row in latest_snapshots:
            lookup[row[0]] = row[1:]  # reg_number -> (field values)
        return lookup

    def _row_to_fields(self, row):
        """Extract tracked field values from a CSV row as a comparable tuple."""
        govt_emp = row[COL_GOVT_EMPLOYEE].strip().upper() in (
            'Y', 'YES', 'TRUE', '1', 'GOVT. EMP.'
        )
        return (
            row[COL_FIRST_NAME].strip(),
            row[COL_LAST_NAME].strip(),
            row[COL_MIDDLE_INITIAL].strip() or None,
            row[COL_SUFFIX].strip() or None,
            row[COL_FIRM_NAME].strip() or None,
            row[COL_FIRM_LINE2].strip() or None,
            row[COL_STREET_ADDRESS].strip() or None,
            row[COL_ADDRESS_LINE2].strip() or None,
            row[COL_CITY].strip() or None,
            row[COL_STATE].strip() or None,
            row[COL_COUNTRY].strip() or 'US',
            row[COL_POSTAL_CODE].strip() or None,
            row[COL_PHONE].strip() or None,
            row[COL_TYPE].strip() or None,
            govt_emp,
        )

    def _load_snapshot(self, rows, snapshot_date):
        """
        Load one month of snapshot data, only inserting rows where the
        attorney's data has changed from their most recent snapshot.
        """
        # Build lookup of previous state per attorney
        prev_lookup = self._build_previous_lookup(snapshot_date)
        is_first_import = len(prev_lookup) == 0

        # Parse all rows, dedup by registration_number
        parsed = {}  # reg_number -> (fields_tuple, AttorneySnapshot)
        skipped = 0

        for row in rows:
            if len(row) < 16:
                skipped += 1
                continue

            reg_number = row[COL_REG_NUMBER].strip()
            if not reg_number:
                skipped += 1
                continue

            fields = self._row_to_fields(row)
            parsed[reg_number] = fields

        # Filter: only keep rows where data changed (or first appearance)
        to_insert = []
        unchanged = 0

        for reg_number, fields in parsed.items():
            prev_fields = prev_lookup.get(reg_number)
            if prev_fields is not None and prev_fields == fields:
                unchanged += 1
                continue

            to_insert.append(AttorneySnapshot(
                registration_number=reg_number,
                snapshot_date=snapshot_date,
                first_name=fields[0],
                last_name=fields[1],
                middle_initial=fields[2],
                suffix=fields[3],
                firm_name=fields[4],
                firm_line_2=fields[5],
                street_address=fields[6],
                address_line_2=fields[7],
                city=fields[8],
                state=fields[9],
                country=fields[10],
                postal_code=fields[11],
                phone=fields[12],
                practitioner_type=fields[13],
                govt_employee=fields[14],
            ))

        if not to_insert:
            self.stdout.write(
                f'  {snapshot_date} — no changes ({len(parsed):,} attorneys, '
                f'{unchanged:,} unchanged, {skipped} skipped)'
            )
            return 0

        with transaction.atomic():
            created = 0
            for i in range(0, len(to_insert), BATCH_SIZE):
                batch = to_insert[i:i + BATCH_SIZE]
                AttorneySnapshot.objects.bulk_create(
                    batch,
                    update_conflicts=True,
                    unique_fields=['registration_number', 'snapshot_date'],
                    update_fields=[
                        'first_name', 'last_name', 'middle_initial', 'suffix',
                        'firm_name', 'firm_line_2', 'street_address', 'address_line_2',
                        'city', 'state', 'country', 'postal_code', 'phone',
                        'practitioner_type', 'govt_employee',
                    ],
                )
                created += len(batch)

        dupes = len(rows) - skipped - len(parsed)
        self.stdout.write(
            f'  {snapshot_date} — {created:,} changes stored '
            f'({unchanged:,} unchanged, {skipped} skipped, {dupes} dupes)'
        )
        return created
