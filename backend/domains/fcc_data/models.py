"""
FCC Equipment Authorization Data Models
"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class FCCGrantee(models.Model):
    """FCC equipment authorization grantee (imported from FCC XML data)."""

    grantee_code = models.CharField(max_length=10, unique=True, db_index=True)
    grantee_name = models.CharField(max_length=500)
    mailing_address = models.CharField(max_length=1000, blank=True, default='')
    po_box = models.CharField(max_length=100, blank=True, default='')
    city = models.CharField(max_length=200, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='')
    country = models.CharField(max_length=100, blank=True, default='')
    zip_code = models.CharField(max_length=20, blank=True, default='')
    contact_name = models.CharField(max_length=300, blank=True, default='')
    date_received = models.CharField(max_length=20, blank=True, default='')

    class Meta:
        ordering = ['grantee_name']
        indexes = [
            models.Index(fields=['grantee_name']),
            models.Index(fields=['country']),
        ]

    def __str__(self):
        return f"{self.grantee_code} - {self.grantee_name}"


class FCCQueryJob(models.Model):
    """A query session against the FCC OET Lab Services API."""

    QUERY_TYPE_CHOICES = [
        ('fcc_id', 'FCC ID Search'),
        ('bulk_fcc_id', 'Bulk FCC ID Search'),
        ('grantee_search', 'Grantee Name Search'),
        ('whitespace', 'Whitespace Authorizations'),
        ('cbsd', 'CBSD Authorizations'),
        ('afc', 'AFC Authorizations'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500)
    query_type = models.CharField(max_length=30, choices=QUERY_TYPE_CHOICES)

    # Query parameters
    fcc_id = models.CharField(max_length=50, blank=True, default='',
                               help_text='Grantee code (3-5 chars) or full FCC ID')
    product_code = models.CharField(max_length=50, blank=True, default='',
                                     help_text='Optional product code (appended to grantee code)')
    bulk_fcc_ids = models.JSONField(default=list, blank=True,
                                     help_text='List of FCC IDs for bulk search')
    grantee_search_term = models.CharField(max_length=500, blank=True, default='',
                                            help_text='Company name search term for grantee search')
    begin_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    task_id = models.CharField(max_length=255, blank=True, default='')
    results_count = models.IntegerField(default=0)
    error_message = models.TextField(blank=True, default='')
    raw_response = models.JSONField(default=list, blank=True)

    # Metadata
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='fcc_query_jobs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['query_type']),
        ]

    def __str__(self):
        return f"[{self.get_query_type_display()}] {self.title}"


class FCCAuthorization(models.Model):
    """A single FCC equipment authorization record, flattened from API response."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(FCCQueryJob, on_delete=models.CASCADE, related_name='authorizations')

    # Core identification
    fcc_id = models.CharField(max_length=50)
    grantee_name = models.CharField(max_length=500, blank=True, default='')
    application_purpose = models.CharField(max_length=200, blank=True, default='')
    equipment_class = models.CharField(max_length=20, blank=True, default='')
    description = models.TextField(blank=True, default='')

    # Dates and status
    grant_date = models.CharField(max_length=20, blank=True, default='')
    status = models.CharField(max_length=10, blank=True, default='')
    status_date = models.CharField(max_length=20, blank=True, default='')

    # Grantee address (from getFCCIDList)
    address = models.CharField(max_length=500, blank=True, default='')
    city = models.CharField(max_length=200, blank=True, default='')
    state = models.CharField(max_length=50, blank=True, default='')
    zip_code = models.CharField(max_length=20, blank=True, default='')
    country = models.CharField(max_length=100, blank=True, default='')

    # Technical specs (from CBSD/AFC lSpecs)
    freq_min = models.DecimalField(max_digits=20, decimal_places=10, null=True, blank=True)
    freq_max = models.DecimalField(max_digits=20, decimal_places=10, null=True, blank=True)
    power_output = models.DecimalField(max_digits=20, decimal_places=10, null=True, blank=True)
    emission_designator = models.CharField(max_length=50, blank=True, default='')

    # Grant notes (nested array from API)
    grant_notes = models.JSONField(default=list, blank=True)

    # Raw API data for reference
    raw_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['job', 'fcc_id']),
            models.Index(fields=['fcc_id']),
            models.Index(fields=['grantee_name']),
            models.Index(fields=['equipment_class']),
            models.Index(fields=['job', '-created_at']),
        ]

    def __str__(self):
        return f"{self.fcc_id} - {self.grantee_name or self.description[:60]}"


class FCCExportFile(models.Model):
    """An exported file (CSV/JSON/PDF) from query results."""

    FORMAT_CHOICES = [
        ('csv', 'CSV'),
        ('json', 'JSON'),
        ('pdf', 'PDF'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(FCCQueryJob, on_delete=models.CASCADE, related_name='exports')
    file = models.FileField(upload_to='fcc_exports/%Y/%m/')
    filename = models.CharField(max_length=500)
    file_size = models.BigIntegerField(default=0)
    format = models.CharField(max_length=10, choices=FORMAT_CHOICES)
    record_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.filename} ({self.get_format_display()})"


class FCCDocument(models.Model):
    """A document/exhibit discovered from the FCC exhibit page for an FCC ID."""

    DOCUMENT_TYPE_CHOICES = [
        ('test_report', 'Test Report'),
        ('external_photos', 'External Photos'),
        ('internal_photos', 'Internal Photos'),
        ('schematics', 'Schematics'),
        ('block_diagram', 'Block Diagram'),
        ('user_manual', 'User Manual'),
        ('label', 'Label'),
        ('sar_report', 'SAR Report'),
        ('attestation', 'Attestation'),
        ('cover_letter', 'Cover Letter'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(FCCQueryJob, on_delete=models.CASCADE, related_name='documents')
    fcc_id = models.CharField(max_length=50)
    exhibit_name = models.CharField(max_length=500)
    description = models.CharField(max_length=1000, blank=True, default='')
    document_url = models.URLField(max_length=2000)
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPE_CHOICES, default='other')
    file_size_bytes = models.BigIntegerField(null=True, blank=True)
    is_downloaded = models.BooleanField(default=False)
    file = models.FileField(upload_to='fcc_documents/%Y/%m/', blank=True, default='')
    original_filename = models.CharField(max_length=500, blank=True, default='')
    mime_type = models.CharField(max_length=200, blank=True, default='')
    download_error = models.TextField(blank=True, default='')
    discovered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['document_type', 'exhibit_name']
        indexes = [
            models.Index(fields=['job', 'fcc_id']),
            models.Index(fields=['fcc_id']),
            models.Index(fields=['document_type']),
        ]

    def __str__(self):
        return f"[{self.get_document_type_display()}] {self.exhibit_name} ({self.fcc_id})"
