"""
Patent Prosecution Models
Core models for managing patent applications throughout the prosecution lifecycle
"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model
from domains.accounts.models import Organization

User = get_user_model()


class PatentApplication(models.Model):
    """
    Central model representing a patent application throughout its prosecution lifecycle
    """
    
    APPLICATION_TYPES = [
        ('utility', 'Utility Patent'),
        ('design', 'Design Patent'),
        ('plant', 'Plant Patent'),
        ('provisional', 'Provisional Application'),
        ('pct', 'PCT Application'),
        ('continuation', 'Continuation'),
        ('divisional', 'Divisional'),
        ('cip', 'Continuation-in-Part'),
    ]
    
    APPLICATION_STATUS = [
        ('draft', 'Draft'),
        ('filed', 'Filed'),
        ('pending', 'Pending Examination'),
        ('under_examination', 'Under Examination'),
        ('office_action', 'Office Action Response Due'),
        ('allowed', 'Allowed'),
        ('granted', 'Granted'),
        ('abandoned', 'Abandoned'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
    ]
    
    JURISDICTIONS = [
        ('US', 'United States'),
        ('EP', 'European Patent Office'),
        ('JP', 'Japan'),
        ('CN', 'China'),
        ('KR', 'South Korea'),
        ('CA', 'Canada'),
        ('AU', 'Australia'),
        ('IN', 'India'),
        ('PCT', 'PCT International'),
    ]
    
    # Primary identifiers
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Application details
    title = models.CharField(max_length=500)
    application_number = models.CharField(max_length=50, null=True, blank=True)
    patent_number = models.CharField(max_length=50, null=True, blank=True)  # When granted
    
    # Classification
    application_type = models.CharField(max_length=20, choices=APPLICATION_TYPES)
    jurisdiction = models.CharField(max_length=10, choices=JURISDICTIONS, default='US')
    status = models.CharField(max_length=20, choices=APPLICATION_STATUS, default='draft')
    
    # Relationships
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    attorney = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='prosecution_cases')
    inventors = models.JSONField(default=list, help_text="List of inventor names")
    assignees = models.JSONField(default=list, help_text="List of assignee names")
    
    # Important dates
    priority_date = models.DateField(null=True, blank=True)
    filing_date = models.DateField(null=True, blank=True)
    publication_date = models.DateField(null=True, blank=True)
    grant_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    
    # Patent content
    abstract = models.TextField(blank=True)
    background = models.TextField(blank=True)
    summary = models.TextField(blank=True)
    detailed_description = models.TextField(blank=True)
    
    # Classification and technical details
    technology_area = models.CharField(max_length=200, blank=True)
    ipc_classes = models.JSONField(default=list, help_text="International Patent Classification codes")
    us_classes = models.JSONField(default=list, help_text="US Patent Classification codes")
    keywords = models.JSONField(default=list)
    
    # Financial tracking
    estimated_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    costs_to_date = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    estimated_total_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Settings and metadata
    is_confidential = models.BooleanField(default=True)
    priority_level = models.CharField(max_length=10, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical')
    ], default='medium')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'patent_applications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['attorney', 'status']),
            models.Index(fields=['application_number']),
            models.Index(fields=['filing_date']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.application_number or 'Draft'})"


class Claim(models.Model):
    """
    Individual claims for a patent application
    """
    
    CLAIM_TYPES = [
        ('independent', 'Independent Claim'),
        ('dependent', 'Dependent Claim'),
        ('multiple_dependent', 'Multiple Dependent Claim'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(PatentApplication, on_delete=models.CASCADE, related_name='claims')
    
    claim_number = models.PositiveIntegerField()
    claim_type = models.CharField(max_length=20, choices=CLAIM_TYPES)
    claim_text = models.TextField()
    
    # Dependencies for dependent claims
    depends_on = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='dependents')
    
    # Status and validation
    is_cancelled = models.BooleanField(default=False)
    is_amended = models.BooleanField(default=False)
    rejection_history = models.JSONField(default=list)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'prosecution_claims'
        ordering = ['claim_number']
        unique_together = ['application', 'claim_number']
    
    def __str__(self):
        return f"Claim {self.claim_number} - {self.application.title[:50]}"


class ProsecutionEvent(models.Model):
    """
    Track all events in the prosecution timeline
    """
    
    EVENT_TYPES = [
        ('application_filed', 'Application Filed'),
        ('office_action_received', 'Office Action Received'),
        ('response_filed', 'Response Filed'),
        ('amendment_filed', 'Amendment Filed'),
        ('interview_scheduled', 'Interview Scheduled'),
        ('interview_completed', 'Interview Completed'),
        ('allowance_received', 'Notice of Allowance'),
        ('patent_granted', 'Patent Granted'),
        ('abandonment', 'Application Abandoned'),
        ('continuation_filed', 'Continuation Filed'),
        ('appeal_filed', 'Appeal Filed'),
        ('fee_paid', 'Fee Payment'),
        ('deadline_reminder', 'Deadline Reminder'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(PatentApplication, on_delete=models.CASCADE, related_name='events')
    
    event_type = models.CharField(max_length=30, choices=EVENT_TYPES)
    event_date = models.DateField()
    due_date = models.DateField(null=True, blank=True)  # For deadline-based events
    
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Associated user/attorney
    handled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    # Document attachments (file paths/URLs)
    documents = models.JSONField(default=list)
    
    # Event-specific metadata
    metadata = models.JSONField(default=dict)
    
    # Status
    is_completed = models.BooleanField(default=False)
    is_urgent = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'prosecution_events'
        ordering = ['-event_date', '-created_at']
        indexes = [
            models.Index(fields=['application', 'event_type']),
            models.Index(fields=['due_date', 'is_completed']),
            models.Index(fields=['handled_by', 'is_completed']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.event_date}"


class OfficeAction(models.Model):
    """
    USPTO Office Actions and responses
    """
    
    ACTION_TYPES = [
        ('non_final', 'Non-Final Office Action'),
        ('final', 'Final Office Action'),
        ('restriction', 'Restriction Requirement'),
        ('advisory', 'Advisory Action'),
        ('notice_allowance', 'Notice of Allowance'),
        ('notice_abandonment', 'Notice of Abandonment'),
    ]
    
    RESPONSE_STATUS = [
        ('pending', 'Response Pending'),
        ('in_progress', 'Response In Progress'),
        ('filed', 'Response Filed'),
        ('overdue', 'Response Overdue'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(PatentApplication, on_delete=models.CASCADE, related_name='office_actions')
    
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    mailing_date = models.DateField()
    response_due_date = models.DateField()
    
    # Office Action content
    examiner_name = models.CharField(max_length=100, blank=True)
    examiner_phone = models.CharField(max_length=20, blank=True)
    art_unit = models.CharField(max_length=10, blank=True)
    
    summary = models.TextField(blank=True)
    rejections = models.JSONField(default=list, help_text="Structured rejection data")
    
    # Response tracking
    response_status = models.CharField(max_length=20, choices=RESPONSE_STATUS, default='pending')
    response_strategy = models.TextField(blank=True)
    response_filed_date = models.DateField(null=True, blank=True)
    
    # Documents
    office_action_document = models.CharField(max_length=500, blank=True)  # File path/URL
    response_document = models.CharField(max_length=500, blank=True)  # File path/URL
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'office_actions'
        ordering = ['-mailing_date']
        indexes = [
            models.Index(fields=['application', 'action_type']),
            models.Index(fields=['response_due_date', 'response_status']),
        ]
    
    def __str__(self):
        return f"{self.get_action_type_display()} - {self.mailing_date}"


class ProsecutionDeadline(models.Model):
    """
    Track important deadlines in patent prosecution
    """
    
    DEADLINE_TYPES = [
        ('office_action_response', 'Office Action Response'),
        ('filing_deadline', 'Filing Deadline'),
        ('fee_payment', 'Fee Payment'),
        ('examination_request', 'Examination Request'),
        ('maintenance_fee', 'Maintenance Fee'),
        ('publication_request', 'Publication Request'),
        ('interview_deadline', 'Interview Deadline'),
        ('appeal_deadline', 'Appeal Deadline'),
    ]
    
    PRIORITY_LEVELS = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(PatentApplication, on_delete=models.CASCADE, related_name='deadlines')
    
    deadline_type = models.CharField(max_length=25, choices=DEADLINE_TYPES)
    due_date = models.DateField()
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    priority = models.CharField(max_length=10, choices=PRIORITY_LEVELS, default='medium')
    
    # Status tracking
    is_completed = models.BooleanField(default=False)
    completed_date = models.DateField(null=True, blank=True)
    is_cancelled = models.BooleanField(default=False)
    
    # Reminders
    reminder_sent = models.BooleanField(default=False)
    reminder_dates = models.JSONField(default=list, help_text="List of reminder dates")
    
    # Assignment
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='assigned_deadlines')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'prosecution_deadlines'
        ordering = ['due_date']
        indexes = [
            models.Index(fields=['due_date', 'is_completed']),
            models.Index(fields=['assigned_to', 'is_completed']),
            models.Index(fields=['application', 'deadline_type']),
        ]
    
    def __str__(self):
        return f"{self.title} - Due: {self.due_date}"


class ProsecutionDocument(models.Model):
    """
    Track documents related to patent prosecution
    """
    
    DOCUMENT_TYPES = [
        ('application', 'Patent Application'),
        ('specification', 'Specification'),
        ('claims', 'Claims'),
        ('drawings', 'Drawings'),
        ('office_action', 'Office Action'),
        ('response', 'Response to Office Action'),
        ('amendment', 'Amendment'),
        ('interview_summary', 'Interview Summary'),
        ('appeal', 'Appeal Brief'),
        ('petition', 'Petition'),
        ('correspondence', 'Correspondence'),
        ('fee_payment', 'Fee Payment Receipt'),
        ('power_of_attorney', 'Power of Attorney'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    application = models.ForeignKey(PatentApplication, on_delete=models.CASCADE, related_name='documents')
    
    document_type = models.CharField(max_length=20, choices=DOCUMENT_TYPES)
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    
    # File information
    file_path = models.CharField(max_length=500)
    file_size = models.BigIntegerField(default=0)
    file_type = models.CharField(max_length=10)  # pdf, docx, etc.
    
    # Document metadata
    version = models.CharField(max_length=10, default='1.0')
    is_current_version = models.BooleanField(default=True)
    
    # Status
    is_filed = models.BooleanField(default=False)
    filing_date = models.DateField(null=True, blank=True)
    
    # User tracking
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'prosecution_documents'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['application', 'document_type']),
            models.Index(fields=['is_current_version', 'document_type']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_document_type_display()})"