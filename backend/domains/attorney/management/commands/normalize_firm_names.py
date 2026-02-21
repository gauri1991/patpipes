"""
Management command to normalize law firm names.

Takes raw ALL-CAPS firm names from the USPTO roster and produces
clean display names with proper capitalization and legal suffixes removed.

Usage:
    python manage.py normalize_firm_names
    python manage.py normalize_firm_names --dry-run
    python manage.py normalize_firm_names --reset   # re-normalize all
"""

import re
from django.core.management.base import BaseCommand
from django.db import transaction
from domains.attorney.models import LawFirm

# Legal suffixes to strip from the display name (case-insensitive matching)
LEGAL_SUFFIXES = [
    # Longest first to avoid partial matches
    'A PROFESSIONAL CORPORATION',
    'A PROFESSIONAL LAW CORPORATION',
    'A PROFESSIONAL ASSOCIATION',
    'PROFESSIONAL CORPORATION',
    'PROFESSIONAL ASSOCIATION',
    'PROFESSIONAL LIMITED LIABILITY COMPANY',
    'LIMITED LIABILITY PARTNERSHIP',
    'LIMITED LIABILITY COMPANY',
    'LIMITED PARTNERSHIP',
    'PATENT ATTORNEYS',
    'PATENT ATTORNEY',
    'ATTORNEYS AT LAW',
    'ATTORNEY AT LAW',
    'ATTORNEYS-AT-LAW',
    'ATTORNEY-AT-LAW',
    'PATENT & TRADEMARK ATTORNEYS',
    'INTELLECTUAL PROPERTY LAW',
    'INTELLECTUAL PROPERTY',
    'IP LAW GROUP',
    'IP GROUP',
    'LAW OFFICES',
    'LAW OFFICE',
    'LAW GROUP',
    'LAW FIRM',
    'LAW CORP',
    'LEGAL GROUP',
    'PLLC',
    'P.L.L.C.',
    'PLLP',
    'P.L.L.P.',
    'LLP',
    'L.L.P.',
    'LLC',
    'L.L.C.',
    'PLC',
    'P.L.C.',
    'P.C.',
    'PC',
    'P.A.',
    'PA',
    'P.S.',
    'PS',
    'S.C.',
    'SC',
    'INC.',
    'INC',
    'CORP.',
    'CORP',
    'LTD.',
    'LTD',
    'CO.',
    'CO',
    'LP',
    'L.P.',
    'PTE.',
    'PTE',
    'PTE. LTD.',
    'PTE LTD',
]

# Words to keep lowercase (unless first word)
LOWERCASE_WORDS = {'a', 'an', 'and', 'at', 'by', 'de', 'del', 'du', 'el',
                   'for', 'in', 'la', 'le', 'les', 'of', 'on', 'or', 'the',
                   'to', 'van', 'von', 'y'}

# Known acronyms that should stay uppercase
KNOWN_ACRONYMS = {
    'IBM', 'AT&T', 'HP', 'GE', 'LG', 'SK', 'JD', 'IP', 'IT', 'US', 'USA',
    'UK', 'EU', 'AI', 'ML', 'KK', 'AG', 'SA', 'SE', 'NV', 'BV', 'AB',
    'BASF', 'BMW', 'SAP', 'DSM', 'TDK', 'NTT', 'NEC', 'JVC',
    'SMS', 'TRW', 'DTS', 'IPS', 'JTT', 'MWR', 'VSN', 'RBC', 'RPG',
    'MLT', 'KWM', 'MJW', 'SG', 'PRD', 'GRP', 'DLA', 'CRH', 'TD',
    'RB', 'CT', 'DZ', 'PHD', 'MD', 'JR', 'SR', 'II', 'III', 'IV',
}

# Prefixes where the next letter should be capitalized: Mc, Mac, O', De
MC_PATTERN = re.compile(r'^(Mc|Mac)([a-z])')
O_APOSTROPHE_PATTERN = re.compile(r"^(O')([a-z])")
# De prefix only for longer words (DePaul, DeVries, DeWitt — not Dept, Desk)
DE_PATTERN = re.compile(r'^(De)([a-z]\w{3,})')  # min 4 chars after De


def strip_legal_suffixes(name: str) -> tuple[str, list[str]]:
    """Remove legal suffixes from firm name. Returns (cleaned, removed_suffixes)."""
    upper = name.upper().strip()
    removed = []

    # Strip parenthetical legal indicators first: "(US)", "(UK)", etc.
    upper = re.sub(r'\s*\([^)]*\)\s*$', '', upper).strip()

    # Iteratively strip suffixes (a name might have multiple: "FOO LLP INC")
    changed = True
    while changed:
        changed = False
        # Strip trailing punctuation each round
        upper = upper.rstrip('.').rstrip(',').strip()
        # Also create a dot-free version for matching dotted suffixes
        upper_nodots = upper.replace('.', '')
        for suffix in LEGAL_SUFFIXES:
            suffix_nodots = suffix.replace('.', '')
            for sep in [', ', ' ', ',']:
                pattern = sep + suffix
                pattern_nodots = sep + suffix_nodots
                # Match with or without dots
                if upper.endswith(pattern):
                    removed.append(suffix)
                    upper = upper[: -len(pattern)].strip()
                    changed = True
                    break
                elif upper_nodots.endswith(pattern_nodots) and len(pattern_nodots) > 2:
                    # Find how much to trim from original (accounting for dots)
                    # Count chars in suffix region of original string
                    trim_len = 0
                    matched = 0
                    for ch in reversed(upper):
                        trim_len += 1
                        if ch != '.':
                            matched += 1
                        if matched >= len(pattern_nodots):
                            break
                    removed.append(suffix)
                    upper = upper[: -trim_len].strip()
                    changed = True
                    break
            if changed:
                break

    # Clean trailing punctuation and dangling separators
    upper = upper.strip().rstrip(',').rstrip('.').rstrip('-').strip()
    return upper, removed


def title_case_word(word: str) -> str:
    """Smart title-case a single word."""
    upper = word.upper()

    # Known acronyms stay uppercase
    if upper in KNOWN_ACRONYMS:
        return upper

    # Single character — capitalize
    if len(word) <= 1:
        return word.upper()

    # Handle hyphenated words: "SMITH-JONES" → "Smith-Jones"
    if '-' in word:
        return '-'.join(title_case_word(part) for part in word.split('-'))

    # Handle slash: "PATENT/TRADEMARK" → "Patent/Trademark"
    if '/' in word:
        return '/'.join(title_case_word(part) for part in word.split('/'))

    # Basic title case
    result = word[0].upper() + word[1:].lower()

    # Mc prefix: "Mccarthy" → "McCarthy"
    result = MC_PATTERN.sub(lambda m: m.group(1) + m.group(2).upper(), result)

    # O' prefix: "O'brien" → "O'Brien"
    result = O_APOSTROPHE_PATTERN.sub(lambda m: m.group(1) + m.group(2).upper(), result)

    # De prefix: "Depaul" → "DePaul", "Devries" → "DeVries"
    result = DE_PATTERN.sub(lambda m: m.group(1) + m.group(2).upper(), result)

    return result


def normalize_firm_name(raw_name: str) -> tuple[str, str]:
    """
    Normalize a firm name.

    Returns (normalized_name, confidence) where confidence is 'high' or 'needs_review'.
    """
    if not raw_name or not raw_name.strip():
        return '', 'needs_review'

    # Step 1: Strip legal suffixes
    stripped, _ = strip_legal_suffixes(raw_name)

    if not stripped.strip():
        # Name was entirely a legal suffix (e.g., "PC")
        return raw_name.strip().title(), 'needs_review'

    # Step 2: Title-case each word
    words = stripped.split()
    result_words = []
    confidence = 'high'

    for i, word in enumerate(words):
        upper = word.upper()

        # Check if it's a connector word (not first word)
        if i > 0 and upper.lower() in LOWERCASE_WORDS:
            result_words.append(upper.lower())
            continue

        # Check for & — keep as-is
        if word == '&':
            result_words.append('&')
            continue

        # Check for all-consonant short words that might be acronyms
        # but aren't in our known list (flag for review)
        vowels = set('AEIOU')
        if (len(upper) <= 3 and len(upper) >= 2
                and not any(c in vowels for c in upper)
                and upper not in KNOWN_ACRONYMS
                and upper.isalpha()):
            # Could be an acronym we don't know about
            confidence = 'needs_review'

        result_words.append(title_case_word(word))

    normalized = ' '.join(result_words)

    # Step 3: Additional checks for review flagging
    # Very short names
    if len(normalized) <= 3:
        confidence = 'needs_review'

    # Names that are just numbers or have unusual characters
    if re.search(r'^\d+$', normalized):
        confidence = 'needs_review'

    # Names with all single-letter words (initials): "A B C"
    if all(len(w) <= 1 for w in result_words):
        confidence = 'needs_review'

    return normalized, confidence


class Command(BaseCommand):
    help = 'Normalize law firm names for proper display'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without saving',
        )
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Re-normalize all firms (including already normalized ones)',
        )
        parser.add_argument(
            '--show-reviews',
            action='store_true',
            help='Show all names flagged for review',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        reset = options['reset']
        show_reviews = options['show_reviews']

        if show_reviews:
            firms = LawFirm.objects.filter(normalization_confidence='needs_review')
            self.stdout.write(f"\n{'='*80}")
            self.stdout.write(f"Firms needing review: {firms.count()}")
            self.stdout.write(f"{'='*80}\n")
            for firm in firms[:100]:
                self.stdout.write(
                    f"  [{firm.id}] {firm.name!r} → {firm.normalized_name!r}"
                )
            if firms.count() > 100:
                self.stdout.write(f"\n  ... and {firms.count() - 100} more")
            return

        # Select firms to normalize
        if reset:
            firms = LawFirm.objects.all()
        else:
            firms = LawFirm.objects.filter(normalized_name__isnull=True)

        total = firms.count()
        if total == 0:
            self.stdout.write(self.style.SUCCESS('All firms already normalized.'))
            return

        self.stdout.write(f"Normalizing {total} firm names...")

        updated = 0
        flagged = 0
        batch = []
        BATCH_SIZE = 2000

        for firm in firms.iterator(chunk_size=BATCH_SIZE):
            normalized, confidence = normalize_firm_name(firm.name)
            firm.normalized_name = normalized
            firm.normalization_confidence = confidence
            batch.append(firm)

            if confidence == 'needs_review':
                flagged += 1

            updated += 1

            if len(batch) >= BATCH_SIZE:
                if not dry_run:
                    with transaction.atomic():
                        LawFirm.objects.bulk_update(
                            batch, ['normalized_name', 'normalization_confidence']
                        )
                self.stdout.write(f"  Processed {updated}/{total}...")
                batch = []

        # Final batch
        if batch and not dry_run:
            with transaction.atomic():
                LawFirm.objects.bulk_update(
                    batch, ['normalized_name', 'normalization_confidence']
                )

        # Attorney law_firm_name is derived from the FK via serializer,
        # so updating LawFirm.normalized_name is sufficient.

        # Summary
        self.stdout.write(f"\n{'='*60}")
        self.stdout.write(self.style.SUCCESS(f"Normalized: {updated} firms"))
        self.stdout.write(
            self.style.WARNING(f"Flagged for review: {flagged}")
            if flagged else f"Flagged for review: 0"
        )
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN — no changes saved'))

        # Show sample of flagged names
        if flagged > 0:
            self.stdout.write(f"\nSample flagged names:")
            review_firms = LawFirm.objects.filter(
                normalization_confidence='needs_review'
            )[:20] if not dry_run else []
            for f in review_firms:
                self.stdout.write(f"  {f.name!r} → {f.normalized_name!r}")
