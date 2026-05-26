"""
FCC Data Exporters

Export FCCAuthorization query results as CSV, JSON, or PDF files.
"""

import csv
import io
import json
import logging
from datetime import datetime

from django.core.files.base import ContentFile

from .models import FCCExportFile

logger = logging.getLogger(__name__)

# Columns for CSV/PDF export
EXPORT_COLUMNS = [
    ('fcc_id', 'FCC ID'),
    ('grantee_name', 'Grantee'),
    ('application_purpose', 'Application Purpose'),
    ('equipment_class', 'Equipment Class'),
    ('description', 'Description'),
    ('status', 'Status'),
    ('status_date', 'Status Date'),
    ('grant_date', 'Grant Date'),
    ('freq_min', 'Freq Min (MHz)'),
    ('freq_max', 'Freq Max (MHz)'),
    ('power_output', 'Power Output (W)'),
    ('emission_designator', 'Emission Designator'),
    ('address', 'Address'),
    ('city', 'City'),
    ('state', 'State'),
    ('zip_code', 'Zip Code'),
    ('country', 'Country'),
]


def _get_record_values(auth):
    """Extract export values from an FCCAuthorization model instance."""
    row = {}
    for field, _ in EXPORT_COLUMNS:
        val = getattr(auth, field, '')
        if val is None:
            val = ''
        elif isinstance(val, (int, float)):
            val = str(val)
        row[field] = str(val)
    return row


def export_csv(job, queryset):
    """
    Export authorization records as CSV.

    Returns:
        FCCExportFile instance with saved file.
    """
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[col[0] for col in EXPORT_COLUMNS])
    writer.writerow({col[0]: col[1] for col in EXPORT_COLUMNS})  # Header with labels

    count = 0
    for auth in queryset.iterator():
        writer.writerow(_get_record_values(auth))
        count += 1

    csv_bytes = output.getvalue().encode('utf-8')
    filename = f"fcc_{job.query_type}_{job.id.hex[:8]}_{datetime.now().strftime('%Y%m%d')}.csv"

    export = FCCExportFile(
        job=job,
        filename=filename,
        file_size=len(csv_bytes),
        format='csv',
        record_count=count,
    )
    export.file.save(filename, ContentFile(csv_bytes), save=False)
    export.save()
    return export


def export_json(job, queryset):
    """
    Export authorization records as JSON with metadata.

    Returns:
        FCCExportFile instance with saved file.
    """
    records = []
    for auth in queryset.iterator():
        record = _get_record_values(auth)
        # Include grant notes as structured data
        record['grant_notes'] = auth.grant_notes or []
        records.append(record)

    export_data = {
        'metadata': {
            'source': 'FCC OET Lab Services API',
            'query_type': job.query_type,
            'title': job.title,
            'exported_at': datetime.now().isoformat(),
            'total_records': len(records),
        },
        'query_params': {},
        'records': records,
    }

    if job.fcc_id:
        export_data['query_params']['fcc_id'] = job.fcc_id
    if job.begin_date:
        export_data['query_params']['begin_date'] = job.begin_date.isoformat()
    if job.end_date:
        export_data['query_params']['end_date'] = job.end_date.isoformat()

    json_bytes = json.dumps(export_data, indent=2, ensure_ascii=False).encode('utf-8')
    filename = f"fcc_{job.query_type}_{job.id.hex[:8]}_{datetime.now().strftime('%Y%m%d')}.json"

    export = FCCExportFile(
        job=job,
        filename=filename,
        file_size=len(json_bytes),
        format='json',
        record_count=len(records),
    )
    export.file.save(filename, ContentFile(json_bytes), save=False)
    export.save()
    return export


def export_pdf(job, queryset):
    """
    Export authorization records as a PDF table.

    Uses a simple HTML-to-text approach for PDF generation.
    Falls back to plain text if reportlab is not available.

    Returns:
        FCCExportFile instance with saved file.
    """
    records = list(queryset.values_list(
        *[col[0] for col in EXPORT_COLUMNS]
    ))

    try:
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.lib.units import inch

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4),
                                leftMargin=0.5 * inch, rightMargin=0.5 * inch)

        styles = getSampleStyleSheet()
        elements = []

        # Title
        elements.append(Paragraph(
            f"FCC Equipment Authorization Data - {job.title}",
            styles['Title']
        ))
        elements.append(Spacer(1, 12))
        elements.append(Paragraph(
            f"Query: {job.get_query_type_display()} | Records: {len(records)} | "
            f"Exported: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            styles['Normal']
        ))
        elements.append(Spacer(1, 20))

        # Select key columns for PDF (not all fit on a page)
        pdf_cols = [
            ('fcc_id', 'FCC ID'),
            ('grantee_name', 'Grantee'),
            ('equipment_class', 'Class'),
            ('description', 'Description'),
            ('status', 'Status'),
            ('grant_date', 'Grant Date'),
            ('freq_min', 'Freq Min'),
            ('freq_max', 'Freq Max'),
            ('power_output', 'Power (W)'),
        ]
        col_indices = [i for i, (field, _) in enumerate(EXPORT_COLUMNS)
                       if field in [c[0] for c in pdf_cols]]

        # Table header
        header = [col[1] for col in pdf_cols]
        table_data = [header]

        for record in records[:500]:  # Limit PDF to 500 rows
            row = []
            for idx in col_indices:
                val = record[idx] if idx < len(record) else ''
                val = str(val) if val is not None else ''
                if len(val) > 40:
                    val = val[:37] + '...'
                row.append(val)
            table_data.append(row)

        table = Table(table_data, repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a1a1a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTSIZE', (0, 0), (-1, 0), 8),
            ('FONTSIZE', (0, 1), (-1, -1), 7),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f5f5f5')]),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))

        elements.append(table)
        doc.build(elements)

        pdf_bytes = buffer.getvalue()

    except ImportError:
        # Fallback: generate a simple text-based "PDF" (actually plain text)
        logger.warning("reportlab not installed, generating plain text export instead of PDF")
        lines = [f"FCC Equipment Authorization Data - {job.title}\n"]
        lines.append(f"Query: {job.get_query_type_display()} | Records: {len(records)}\n")
        lines.append('=' * 80 + '\n\n')

        headers = [col[1] for col in EXPORT_COLUMNS]
        lines.append('\t'.join(headers) + '\n')
        lines.append('-' * 80 + '\n')

        for record in records[:500]:
            vals = [str(v) if v is not None else '' for v in record]
            lines.append('\t'.join(vals) + '\n')

        pdf_bytes = ''.join(lines).encode('utf-8')

    filename = f"fcc_{job.query_type}_{job.id.hex[:8]}_{datetime.now().strftime('%Y%m%d')}.pdf"

    export = FCCExportFile(
        job=job,
        filename=filename,
        file_size=len(pdf_bytes),
        format='pdf',
        record_count=len(records),
    )
    export.file.save(filename, ContentFile(pdf_bytes), save=False)
    export.save()
    return export
