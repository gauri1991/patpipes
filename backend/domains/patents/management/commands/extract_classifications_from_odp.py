"""
One-off backfill: split classification codes that were stuffed into
`Patent.ipc_classifications` (and into `odp_raw_data`) into the correct
typed fields: ipc_classifications / cpc_classifications / uspc_classifications.

Reads from existing `odp_raw_data.applicationMetaData` — no API calls.
"""
import re
from django.core.management.base import BaseCommand
from django.db.models import Q

from domains.patents.models import Patent, Portfolio


# USPC format: "726/1", "382/100"
_USPC_RE = re.compile(r'^\d{3}/\d+')
# CPC/IPC root: e.g. "H04L63/1416" (also matches "H04L  63/1416" after whitespace strip)
_CPC_LIKE_RE = re.compile(r'^[A-Z]\d{2,3}[A-Z]\d')


def _normalize_cpc(code: str) -> str:
    """Strip all internal whitespace from a CPC code: 'H04L  63/1416' -> 'H04L63/1416'."""
    return ''.join(str(code).split())


class Command(BaseCommand):
    help = 'Split classification codes from odp_raw_data into typed fields (no API calls).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--portfolio',
            type=str,
            default=None,
            help='Only process patents in this portfolio ID. Default: all patents.',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Report what would change without writing.',
        )

    def handle(self, *args, **opts):
        qs = Patent.objects.all()
        if opts['portfolio']:
            qs = qs.filter(portfolio_id=opts['portfolio'])

        total = qs.count()
        self.stdout.write(f'Scanning {total} patent(s)...')

        stats = {
            'cpc_from_odp': 0,
            'uspc_from_odp': 0,
            'ipc_from_odp': 0,
            'cpc_moved_from_ipc_field': 0,
            'uspc_moved_from_ipc_field': 0,
            'patents_updated': 0,
        }

        to_update: list[Patent] = []
        for patent in qs.iterator(chunk_size=500):
            old_ipc = list(patent.ipc_classifications or [])
            old_cpc = list(patent.cpc_classifications or [])
            old_uspc = list(patent.uspc_classifications or [])

            new_cpc: set = set(old_cpc)
            new_uspc: set = set(old_uspc)
            new_ipc: list = []

            # 1) Extract from odp_raw_data.applicationMetaData
            meta = (patent.odp_raw_data or {}).get('applicationMetaData', {}) or {}

            for raw in (meta.get('cpcClassificationBag') or []):
                if isinstance(raw, str) and raw.strip():
                    new_cpc.add(_normalize_cpc(raw))
                    stats['cpc_from_odp'] += 1

            for raw in (meta.get('ipcClassificationBag') or []):
                if isinstance(raw, str) and raw.strip():
                    new_ipc.append(_normalize_cpc(raw))
                    stats['ipc_from_odp'] += 1

            uspc_class = meta.get('class')
            uspc_sub = meta.get('subclass')
            if uspc_class is not None:
                code = f'{uspc_class}/{uspc_sub}' if uspc_sub is not None else str(uspc_class)
                new_uspc.add(code)
                stats['uspc_from_odp'] += 1

            # 2) Re-route values currently misfiled in ipc_classifications
            kept_in_ipc: list = []
            for raw in old_ipc:
                code_str = str(raw).strip()
                if not code_str:
                    continue
                if _USPC_RE.match(code_str):
                    new_uspc.add(code_str)
                    stats['uspc_moved_from_ipc_field'] += 1
                elif _CPC_LIKE_RE.match(_normalize_cpc(code_str)):
                    # Could be CPC or IPC — both have similar root. Heuristic:
                    # CPC codes are typically more granular (subclass+group), keep
                    # the original-cased value in cpc; very short ones stay in ipc.
                    if '/' in code_str:
                        new_cpc.add(_normalize_cpc(code_str))
                        stats['cpc_moved_from_ipc_field'] += 1
                    else:
                        kept_in_ipc.append(_normalize_cpc(code_str))
                else:
                    kept_in_ipc.append(code_str)

            # Combine with anything pulled from odp_raw_data IPC bag
            final_ipc = list(dict.fromkeys([*kept_in_ipc, *new_ipc]))
            final_cpc = sorted(new_cpc)
            final_uspc = sorted(new_uspc)

            # Only flag as changed if something actually differs
            if (final_ipc != old_ipc or final_cpc != old_cpc or final_uspc != old_uspc):
                patent.ipc_classifications = final_ipc
                patent.cpc_classifications = final_cpc
                patent.uspc_classifications = final_uspc
                to_update.append(patent)
                stats['patents_updated'] += 1

        if opts['dry_run']:
            self.stdout.write(self.style.WARNING('DRY RUN — no changes written.'))
        else:
            # bulk_update in chunks
            updated_n = 0
            for i in range(0, len(to_update), 500):
                chunk = to_update[i:i + 500]
                Patent.objects.bulk_update(
                    chunk,
                    ['ipc_classifications', 'cpc_classifications', 'uspc_classifications'],
                )
                updated_n += len(chunk)
            self.stdout.write(self.style.SUCCESS(f'Wrote {updated_n} patents.'))

        self.stdout.write('Stats:')
        for k, v in stats.items():
            self.stdout.write(f'  {k}: {v}')
