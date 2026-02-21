"""
Management command to import USPTO practitioner roster data.

Data source: https://oedci.uspto.gov/OEDCI/practitionerRoster
Format: ZIP containing WebRoster.txt (CSV, no header row, 16 columns)
"""

import csv
import io
import os
import tempfile
import zipfile
from collections import defaultdict
from urllib.request import urlopen

from django.core.management.base import BaseCommand
from django.db import transaction

from domains.attorney.models import Attorney, LawFirm


ROSTER_URL = 'https://oedci.uspto.gov/OEDCI/practitionerRoster?hid_action=download'
BATCH_SIZE = 5000

# CSV column indices (no header row)
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


def map_practitioner_title(ptype):
    """Map roster practitioner type to a human-readable title."""
    mapping = {
        'ATTORNEY': 'Patent Attorney',
        'AGENT': 'Patent Agent',
        'LIMITED': 'Limited Recognition',
        'DESIGN AGENT': 'Design Agent',
    }
    return mapping.get(ptype, ptype)


class Command(BaseCommand):
    help = 'Import USPTO practitioner roster into the Attorney directory'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            help='Path to local roster ZIP or TXT file (skip download)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Delete all roster-sourced entries before importing',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Parse and report counts without writing to the database',
        )

    def handle(self, *args, **options):
        file_path = options.get('file')
        clear = options.get('clear', False)
        dry_run = options.get('dry_run', False)

        if clear:
            self.stdout.write('Clearing existing roster-sourced entries...')
            att_count = Attorney.objects.filter(source='uspto_roster').count()
            firm_count = LawFirm.objects.filter(source='uspto_roster').count()
            if not dry_run:
                Attorney.objects.filter(source='uspto_roster').delete()
                LawFirm.objects.filter(source='uspto_roster').delete()
            self.stdout.write(self.style.SUCCESS(
                f'  Deleted {att_count} attorneys and {firm_count} law firms'
                + (' (dry-run)' if dry_run else '')
            ))

        # --- Get the CSV text ---
        rows = self._load_rows(file_path)
        self.stdout.write(f'Parsed {len(rows)} roster rows')

        if dry_run:
            self._report_stats(rows)
            self.stdout.write(self.style.WARNING('Dry-run mode — no changes written.'))
            return

        with transaction.atomic():
            firm_lookup = self._create_firms(rows)
            self._create_attorneys(rows, firm_lookup)

        self.stdout.write(self.style.SUCCESS('USPTO roster import complete.'))

    # ------------------------------------------------------------------
    # Data loading
    # ------------------------------------------------------------------

    def _load_rows(self, file_path):
        """Return list of parsed CSV rows (each row is a list of strings)."""
        if file_path:
            return self._load_from_file(file_path)
        return self._load_from_url()

    def _load_from_file(self, path):
        if path.endswith('.zip'):
            return self._parse_zip(path)
        # Assume plain text / CSV
        with open(path, 'r', encoding='utf-8', errors='replace') as f:
            return list(csv.reader(f))

    def _load_from_url(self):
        self.stdout.write(f'Downloading roster from {ROSTER_URL} ...')
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
        try:
            with urlopen(ROSTER_URL) as resp:
                tmp.write(resp.read())
            tmp.close()
            return self._parse_zip(tmp.name)
        finally:
            os.unlink(tmp.name)

    def _parse_zip(self, zip_path):
        with zipfile.ZipFile(zip_path, 'r') as zf:
            # Find the roster text file inside
            names = zf.namelist()
            txt_name = next(
                (n for n in names if n.lower().endswith('.txt')),
                names[0],
            )
            self.stdout.write(f'  Extracting {txt_name}')
            raw = zf.read(txt_name).decode('utf-8', errors='replace')
            return list(csv.reader(io.StringIO(raw)))

    # ------------------------------------------------------------------
    # Phase 1: Law firms
    # ------------------------------------------------------------------

    def _create_firms(self, rows):
        """Create/update LawFirm records. Returns lookup dict."""
        firm_keys = set()
        for row in rows:
            if len(row) < 16:
                continue
            firm_name = row[COL_FIRM_NAME].strip()
            if not firm_name:
                continue
            city = row[COL_CITY].strip()
            country = row[COL_COUNTRY].strip() or 'US'
            firm_keys.add((firm_name, city, country))

        self.stdout.write(f'Found {len(firm_keys)} unique law firms')

        # Build firm objects
        firms_to_create = []
        for name, city, country in firm_keys:
            firms_to_create.append(LawFirm(
                name=name,
                city=city,
                country=country,
                source='uspto_roster',
                firm_size='small',
                is_active=True,
            ))

        # Bulk upsert in batches
        created_count = 0
        for i in range(0, len(firms_to_create), BATCH_SIZE):
            batch = firms_to_create[i:i + BATCH_SIZE]
            LawFirm.objects.bulk_create(
                batch,
                update_conflicts=True,
                unique_fields=['name', 'city', 'country'],
                update_fields=['source'],
            )
            created_count += len(batch)
            self.stdout.write(f'  Firms processed: {created_count}/{len(firms_to_create)}')

        # Build lookup
        firm_lookup = {}
        for firm in LawFirm.objects.filter(source='uspto_roster').values('id', 'name', 'city', 'country'):
            key = (firm['name'], firm['city'], firm['country'])
            firm_lookup[key] = firm['id']

        return firm_lookup

    # ------------------------------------------------------------------
    # Phase 2: Attorneys
    # ------------------------------------------------------------------

    def _create_attorneys(self, rows, firm_lookup):
        """Create/update Attorney records."""
        attorneys_to_create = []
        skipped = 0

        for row in rows:
            if len(row) < 16:
                skipped += 1
                continue

            reg_number = row[COL_REG_NUMBER].strip()
            if not reg_number:
                skipped += 1
                continue

            last_name = row[COL_LAST_NAME].strip()
            first_name = row[COL_FIRST_NAME].strip()
            middle_initial = row[COL_MIDDLE_INITIAL].strip() or None
            suffix = row[COL_SUFFIX].strip() or None
            firm_name = row[COL_FIRM_NAME].strip()
            street_address = row[COL_STREET_ADDRESS].strip() or None
            address_line_2 = row[COL_ADDRESS_LINE2].strip() or None
            city = row[COL_CITY].strip() or None
            state = row[COL_STATE].strip() or None
            country = row[COL_COUNTRY].strip() or 'US'
            postal_code = row[COL_POSTAL_CODE].strip() or None
            phone = row[COL_PHONE].strip() or None
            ptype = row[COL_TYPE].strip()
            govt_emp = row[COL_GOVT_EMPLOYEE].strip().upper() in ('Y', 'YES', 'TRUE', '1', 'GOVT. EMP.')

            # Resolve firm
            law_firm_id = None
            if firm_name:
                firm_city = city or ''
                law_firm_id = firm_lookup.get((firm_name, firm_city, country))

            attorneys_to_create.append(Attorney(
                registration_number=reg_number,
                first_name=first_name,
                last_name=last_name,
                middle_initial=middle_initial,
                suffix=suffix,
                title=map_practitioner_title(ptype),
                practitioner_type=ptype,
                source='uspto_roster',
                is_verified=True,
                experience_level='unknown',
                law_firm_id=law_firm_id,
                independent=not bool(firm_name),
                street_address=street_address,
                address_line_2=address_line_2,
                city=city,
                state=state,
                country=country,
                postal_code=postal_code,
                phone=phone,
                govt_employee=govt_emp,
            ))

        self.stdout.write(f'Prepared {len(attorneys_to_create)} attorneys ({skipped} rows skipped)')

        # Bulk upsert in batches
        update_fields = [
            'first_name', 'last_name', 'middle_initial', 'suffix',
            'title', 'practitioner_type', 'law_firm_id', 'independent',
            'street_address', 'address_line_2', 'city', 'state',
            'country', 'postal_code', 'phone', 'govt_employee',
        ]

        created_count = 0
        for i in range(0, len(attorneys_to_create), BATCH_SIZE):
            batch = attorneys_to_create[i:i + BATCH_SIZE]
            Attorney.objects.bulk_create(
                batch,
                update_conflicts=True,
                unique_fields=['registration_number'],
                update_fields=update_fields,
            )
            created_count += len(batch)
            self.stdout.write(f'  Attorneys processed: {created_count}/{len(attorneys_to_create)}')

    # ------------------------------------------------------------------
    # Reporting
    # ------------------------------------------------------------------

    def _report_stats(self, rows):
        types = defaultdict(int)
        firms = set()
        govt = 0
        for row in rows:
            if len(row) < 16:
                continue
            ptype = row[COL_TYPE].strip()
            types[ptype] += 1
            firm = row[COL_FIRM_NAME].strip()
            if firm:
                firms.add(firm)
            if row[COL_GOVT_EMPLOYEE].strip().upper() in ('Y', 'YES', 'TRUE', '1', 'GOVT. EMP.'):
                govt += 1

        self.stdout.write('\n--- Roster Statistics ---')
        self.stdout.write(f'Total rows: {len(rows)}')
        self.stdout.write(f'Unique firms: {len(firms)}')
        self.stdout.write(f'Government employees: {govt}')
        for ptype, count in sorted(types.items(), key=lambda x: -x[1]):
            self.stdout.write(f'  {ptype}: {count}')
