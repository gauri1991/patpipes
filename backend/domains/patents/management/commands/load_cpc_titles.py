"""
Management command to load CPC (Cooperative Patent Classification) title definitions.

Downloads the CPC Title List ZIP from the CPC website, extracts the TXT files
(one per section), and bulk-inserts ~260K classification entries.
"""

import io
import zipfile

import requests
from django.core.management.base import BaseCommand
from django.db import transaction

from domains.patents.models import ClassificationDefinition

# Default URL for the CPC title list ZIP
DEFAULT_URL = (
    "https://www.cooperativepatentclassification.org"
    "/sites/default/files/cpc/bulk/CPCTitleList202601.zip"
)

BATCH_SIZE = 5000


def determine_level(code: str) -> str:
    """Determine classification level from a CPC code."""
    clean = code.replace(" ", "")
    if len(clean) == 1:
        return "section"
    if len(clean) <= 3:
        return "class"
    if "/" not in code and len(clean) == 4:
        return "subclass"
    if "/" in code:
        suffix = code.split("/")[1].strip()
        if suffix == "00":
            return "group"
        return "subgroup"
    return "subclass"


def compute_parent(code: str, level: str) -> str:
    """Compute the parent code for a given classification code."""
    if level == "section":
        return ""
    if level == "class":
        return code[0]
    if level == "subclass":
        return code[:3].strip()
    if level == "group":
        return code.split("/")[0].strip()[:4]
    if level == "subgroup":
        prefix = code.split("/")[0].strip()
        return f"{prefix}/00"
    return ""


class Command(BaseCommand):
    help = "Load CPC classification titles from the official CPC title list."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            help="Path to a local CPC title list ZIP file instead of downloading.",
        )
        parser.add_argument(
            "--url",
            type=str,
            default=DEFAULT_URL,
            help="URL to download the CPC title list ZIP from.",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing CPC entries before loading.",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            count, _ = ClassificationDefinition.objects.filter(system="CPC").delete()
            self.stdout.write(f"Cleared {count} existing CPC entries.")

        # Get the ZIP data
        if options.get("file"):
            file_path = options["file"]
            self.stdout.write(f"Reading from local file: {file_path}")
            with open(file_path, "rb") as f:
                zip_data = f.read()
        else:
            url = options["url"]
            self.stdout.write(f"Downloading CPC title list from {url} ...")
            resp = requests.get(url, timeout=120)
            resp.raise_for_status()
            zip_data = resp.content
            self.stdout.write(f"Downloaded {len(zip_data) / 1024 / 1024:.1f} MB")

        # Extract and parse TXT files from ZIP
        entries = []
        with zipfile.ZipFile(io.BytesIO(zip_data)) as zf:
            txt_names = sorted(n for n in zf.namelist() if n.endswith(".txt"))
            if not txt_names:
                self.stderr.write("No TXT files found in ZIP archive.")
                return

            for txt_name in txt_names:
                self.stdout.write(f"Parsing {txt_name} ...")
                data = zf.read(txt_name).decode("utf-8", errors="replace")
                for line in data.splitlines():
                    line = line.strip()
                    if not line:
                        continue

                    # Format: CODE\t[INDENT]\tTITLE  or  CODE\t\tTITLE
                    parts = line.split("\t")
                    if len(parts) < 2:
                        continue

                    code = parts[0].strip()
                    if not code:
                        continue

                    # Parse indent level (column 1) and title (last column)
                    indent = 0
                    if len(parts) >= 3:
                        try:
                            indent = int(parts[1].strip())
                        except (ValueError, IndexError):
                            indent = 0
                        title = parts[2].strip()
                    else:
                        title = parts[-1].strip()

                    if not title:
                        title = code

                    level = determine_level(code)
                    parent = compute_parent(code, level)

                    entries.append(
                        ClassificationDefinition(
                            code=code,
                            system="CPC",
                            level=level,
                            title=title,
                            parent_code=parent,
                            indent_level=indent,
                        )
                    )

        self.stdout.write(f"Parsed {len(entries)} CPC entries. Inserting ...")

        # Bulk insert with upsert
        with transaction.atomic():
            for i in range(0, len(entries), BATCH_SIZE):
                batch = entries[i : i + BATCH_SIZE]
                ClassificationDefinition.objects.bulk_create(
                    batch,
                    update_conflicts=True,
                    unique_fields=["code", "system"],
                    update_fields=["level", "title", "parent_code", "indent_level"],
                )
                self.stdout.write(
                    f"  Inserted {min(i + BATCH_SIZE, len(entries))}/{len(entries)}"
                )

        final_count = ClassificationDefinition.objects.filter(system="CPC").count()
        self.stdout.write(
            self.style.SUCCESS(f"Done. {final_count} CPC entries in database.")
        )
