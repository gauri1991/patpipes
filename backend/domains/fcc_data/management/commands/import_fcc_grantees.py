"""
Import FCC grantees from XML file.

Usage:
    python manage.py import_fcc_grantees /path/to/results.xml
    python manage.py import_fcc_grantees /path/to/results.xml --clear  # Clear existing data first
"""

import xml.etree.ElementTree as ET
from django.core.management.base import BaseCommand
from domains.fcc_data.models import FCCGrantee


class Command(BaseCommand):
    help = 'Import FCC grantee data from XML file into FCCGrantee model'

    def add_arguments(self, parser):
        parser.add_argument('xml_file', type=str, help='Path to the FCC grantees XML file')
        parser.add_argument('--clear', action='store_true', help='Clear existing grantees before import')
        parser.add_argument('--batch-size', type=int, default=500, help='Batch size for bulk operations')

    def handle(self, *args, **options):
        xml_file = options['xml_file']
        batch_size = options['batch_size']

        if options['clear']:
            count = FCCGrantee.objects.count()
            FCCGrantee.objects.all().delete()
            self.stdout.write(f"Cleared {count} existing grantees")

        self.stdout.write(f"Parsing {xml_file}...")

        # Use iterparse for memory efficiency with large XML files
        created = 0
        updated = 0
        skipped = 0
        batch = []
        existing_codes = set(FCCGrantee.objects.values_list('grantee_code', flat=True))

        context = ET.iterparse(xml_file, events=('end',))

        for event, elem in context:
            if elem.tag != 'Row':
                continue

            code = (elem.findtext('grantee_code') or '').strip()
            if not code:
                skipped += 1
                elem.clear()
                continue

            name = (elem.findtext('grantee_name') or '').strip()
            address = (elem.findtext('mailing_address') or '').strip()
            po_box = (elem.findtext('po_box') or '').strip()
            city = (elem.findtext('city') or '').strip()
            state = (elem.findtext('state') or '').strip()
            country = (elem.findtext('country') or '').strip()
            zip_code = (elem.findtext('zip_code') or '').strip()
            contact = (elem.findtext('contact_name') or '').strip()
            date_recv = (elem.findtext('date_received') or '').strip()

            # Clean up N/A values
            if po_box == 'N/A':
                po_box = ''
            if state == 'N/A':
                state = ''
            if zip_code == 'N/A':
                zip_code = ''

            if code in existing_codes:
                # Update existing
                FCCGrantee.objects.filter(grantee_code=code).update(
                    grantee_name=name,
                    mailing_address=address,
                    po_box=po_box,
                    city=city,
                    state=state,
                    country=country,
                    zip_code=zip_code,
                    contact_name=contact,
                    date_received=date_recv,
                )
                updated += 1
            else:
                batch.append(FCCGrantee(
                    grantee_code=code,
                    grantee_name=name,
                    mailing_address=address,
                    po_box=po_box,
                    city=city,
                    state=state,
                    country=country,
                    zip_code=zip_code,
                    contact_name=contact,
                    date_received=date_recv,
                ))
                existing_codes.add(code)

            if len(batch) >= batch_size:
                FCCGrantee.objects.bulk_create(batch, batch_size=batch_size)
                created += len(batch)
                self.stdout.write(f"  Imported {created} grantees...")
                batch.clear()

            elem.clear()

        # Flush remaining
        if batch:
            FCCGrantee.objects.bulk_create(batch, batch_size=batch_size)
            created += len(batch)

        total = FCCGrantee.objects.count()
        self.stdout.write(self.style.SUCCESS(
            f"Done! Created: {created}, Updated: {updated}, Skipped: {skipped}. "
            f"Total grantees in DB: {total}"
        ))
