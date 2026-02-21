"""
Management command to load IPC (International Patent Classification) title definitions.

Downloads IPC title list TXT files (sections A-H) from WIPO and bulk-inserts
~80K classification entries.
"""

import os
import re

import requests
from django.core.management.base import BaseCommand
from django.db import transaction

from domains.patents.models import ClassificationDefinition

WIPO_URL_TEMPLATE = (
    "https://www.wipo.int/ipc/itos4ipc/ITSupport_and_download_area"
    "/20250101/IPC_scheme_title_list"
    "/EN_ipc_section_{section}_title_list_20250101.txt"
)

SECTIONS = ["A", "B", "C", "D", "E", "F", "G", "H"]

BATCH_SIZE = 5000


def parse_flat_code(flat: str) -> str:
    """
    Convert a flat IPC code like 'G01B0003020000' to standard notation 'G01B 3/02'.

    Format: XNNX NNNN NN NNNN
            ^--^ ^--^ ^^ ^--^
            subcl grp  subgrp (with leading zeros)

    Section = flat[0]       (e.g. G)
    Class   = flat[0:3]     (e.g. G01)
    Subclass= flat[0:4]     (e.g. G01B)
    Group   = flat[4:8]     (e.g. 0003 -> 3)
    Subgroup= flat[8:]      (e.g. 020000 -> 02)
    """
    if len(flat) < 4:
        return flat

    subclass = flat[0:4]

    if len(flat) <= 4:
        return subclass

    # Extract group number (positions 4-8), strip leading zeros
    group_part = flat[4:8].lstrip("0") or "0"

    if len(flat) <= 8:
        return f"{subclass} {group_part}/00"

    # Extract subgroup (positions 8+), strip trailing zeros then leading zeros
    subgroup_raw = flat[8:]
    # Remove trailing zeros but keep at least 2 chars
    subgroup = subgroup_raw.rstrip("0") or "00"
    if len(subgroup) < 2:
        subgroup = subgroup.ljust(2, "0")

    return f"{subclass} {group_part}/{subgroup}"


def determine_level(code: str) -> str:
    """Determine classification level from a standard IPC code."""
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
    help = "Load IPC classification titles from the WIPO title list files."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            help=(
                "Path to a local directory containing IPC title list TXT files. "
                "Files should be named like EN_ipc_section_A_title_list_*.txt"
            ),
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing IPC entries before loading.",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            count, _ = ClassificationDefinition.objects.filter(system="IPC").delete()
            self.stdout.write(f"Cleared {count} existing IPC entries.")

        entries = []

        for section in SECTIONS:
            lines = self._get_section_lines(section, options)
            if lines is None:
                continue

            for line in lines:
                line = line.strip()
                if not line or "\t" not in line:
                    continue

                parts = line.split("\t", 1)
                if len(parts) < 2:
                    continue

                flat_code = parts[0].strip()
                title = parts[1].strip()

                if not flat_code or not title:
                    continue

                code = parse_flat_code(flat_code)
                level = determine_level(code)
                parent = compute_parent(code, level)

                # Infer indent from subgroup digits length
                indent = 0
                if level == "subgroup" and "/" in code:
                    suffix = code.split("/")[1]
                    # Longer suffixes = deeper nesting: /02=1, /0201=2, /020101=3
                    indent = max(1, (len(suffix) + 1) // 2)

                entries.append(
                    ClassificationDefinition(
                        code=code,
                        system="IPC",
                        level=level,
                        title=title,
                        parent_code=parent,
                        indent_level=indent,
                    )
                )

            self.stdout.write(f"  Section {section}: {len(entries)} entries so far")

        # Deduplicate: keep last occurrence of each code (later entries override)
        seen: dict[str, int] = {}
        deduped: list[ClassificationDefinition] = []
        for entry in entries:
            if entry.code in seen:
                # Replace previous entry
                deduped[seen[entry.code]] = entry
            else:
                seen[entry.code] = len(deduped)
                deduped.append(entry)
        entries = deduped

        self.stdout.write(f"Parsed {len(entries)} IPC entries (after dedup). Inserting ...")

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

        final_count = ClassificationDefinition.objects.filter(system="IPC").count()
        self.stdout.write(
            self.style.SUCCESS(f"Done. {final_count} IPC entries in database.")
        )

    def _get_section_lines(self, section: str, options: dict) -> list[str] | None:
        """Get lines for a given IPC section, either from file or URL."""
        if options.get("file"):
            dir_path = options["file"]
            # Find the matching file in the directory
            import glob

            pattern = os.path.join(
                dir_path, f"EN_ipc_section_{section}_title_list_*.txt"
            )
            matches = glob.glob(pattern)
            if not matches:
                self.stderr.write(f"No file found for section {section} in {dir_path}")
                return None
            file_path = matches[0]
            self.stdout.write(f"Reading section {section} from {file_path}")
            with open(file_path, "r", encoding="utf-8") as f:
                return f.readlines()
        else:
            url = WIPO_URL_TEMPLATE.format(section=section)
            self.stdout.write(f"Downloading section {section} from WIPO ...")
            try:
                resp = requests.get(url, timeout=60)
                resp.raise_for_status()
                return resp.text.splitlines()
            except requests.RequestException as e:
                self.stderr.write(f"Failed to download section {section}: {e}")
                return None
