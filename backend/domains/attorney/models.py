"""
Attorney Network Models
Professional directory for patent attorneys and law firms
"""

import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from domains.accounts.models import User


class LawFirm(models.Model):
    """Law firm or organization entity"""

    SIZE_CHOICES = [
        ('solo', 'Solo Practitioner'),
        ('small', 'Small Firm (2-10)'),
        ('medium', 'Medium Firm (11-50)'),
        ('large', 'Large Firm (51-200)'),
        ('enterprise', 'Enterprise (200+)'),
    ]

    SOURCE_CHOICES = [
        ('manual', 'Manual'),
        ('uspto_roster', 'USPTO Roster'),
    ]

    NORMALIZATION_CONFIDENCE_CHOICES = [
        ('high', 'High'),
        ('needs_review', 'Needs Review'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Basic Information
    name = models.CharField(max_length=255)  # Raw original name from source
    normalized_name = models.CharField(max_length=255, blank=True, null=True)  # Clean display name
    normalization_confidence = models.CharField(
        max_length=20,
        choices=NORMALIZATION_CONFIDENCE_CHOICES,
        blank=True,
        null=True,
    )
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='manual')
    website = models.URLField(blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)

    # Location
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20, blank=True, null=True)

    # Organization Details
    firm_size = models.CharField(max_length=20, choices=SIZE_CHOICES, default='small')
    established_year = models.IntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(1800), MaxValueValidator(2100)]
    )
    description = models.TextField(blank=True, null=True)

    # Practice Areas (stored as comma-separated tags)
    practice_areas = models.JSONField(default=list, blank=True)

    # Technology Focus (stored as comma-separated tags)
    technology_focus = models.JSONField(default=list, blank=True)

    # Ratings & Reviews
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    review_count = models.IntegerField(default=0)

    # Status
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_law_firms'
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Law Firm'
        verbose_name_plural = 'Law Firms'
        unique_together = [('name', 'city', 'country')]

    @property
    def display_name(self):
        return self.normalized_name or self.name

    def __str__(self):
        return self.display_name


class Attorney(models.Model):
    """Individual attorney profile"""

    EXPERIENCE_LEVEL_CHOICES = [
        ('junior', 'Junior (0-3 years)'),
        ('mid_level', 'Mid-Level (4-7 years)'),
        ('senior', 'Senior (8-15 years)'),
        ('partner', 'Partner (15+ years)'),
        ('unknown', 'Unknown'),
    ]

    SOURCE_CHOICES = [
        ('manual', 'Manual'),
        ('uspto_roster', 'USPTO Roster'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Link to User (if registered on platform)
    user = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='network_attorney_profile'
    )

    # Basic Information
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_initial = models.CharField(max_length=50, blank=True, null=True)
    suffix = models.CharField(max_length=10, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='manual')
    practitioner_type = models.CharField(max_length=30, blank=True, null=True)
    govt_employee = models.BooleanField(default=False)

    # Professional Details
    title = models.CharField(max_length=255, blank=True, null=True)  # e.g., "Partner", "Senior Associate"
    law_firm = models.ForeignKey(
        LawFirm,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='attorneys'
    )
    independent = models.BooleanField(default=False)  # Solo practitioner not affiliated with firm

    # Address (direct, from roster data)
    street_address = models.CharField(max_length=255, blank=True, null=True)
    address_line_2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)

    # Credentials
    bar_admissions = models.JSONField(default=list, blank=True)  # e.g., ["California", "New York"]
    registration_number = models.CharField(max_length=100, blank=True, null=True, unique=True, db_index=True)
    admitted_year = models.IntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(1900), MaxValueValidator(2100)]
    )

    # Education
    law_school = models.CharField(max_length=255, blank=True, null=True)
    law_school_grad_year = models.IntegerField(blank=True, null=True)
    undergraduate = models.CharField(max_length=255, blank=True, null=True)
    technical_degree = models.CharField(max_length=255, blank=True, null=True)  # For patent bar

    # Professional Background
    experience_level = models.CharField(
        max_length=20,
        choices=EXPERIENCE_LEVEL_CHOICES,
        default='mid_level'
    )
    years_of_experience = models.IntegerField(default=0)

    # Specializations
    specializations = models.JSONField(default=list, blank=True)  # e.g., ["Patent Prosecution", "Litigation"]
    technology_areas = models.JSONField(default=list, blank=True)  # e.g., ["Software", "Biotechnology"]
    industries_served = models.JSONField(default=list, blank=True)  # e.g., ["Healthcare", "FinTech"]

    # Bio & Profile
    bio = models.TextField(blank=True, null=True)
    linkedin_url = models.URLField(blank=True, null=True)
    profile_photo = models.ImageField(upload_to='attorney/photos/', blank=True, null=True)

    # Practice Statistics
    cases_handled = models.IntegerField(default=0)
    patents_drafted = models.IntegerField(default=0)
    patents_granted = models.IntegerField(default=0)
    success_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )

    # Languages
    languages = models.JSONField(default=list, blank=True)  # e.g., ["English", "Mandarin"]

    # Availability & Rates
    hourly_rate_min = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True
    )
    hourly_rate_max = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True
    )
    accepting_new_clients = models.BooleanField(default=True)
    available_for_consultation = models.BooleanField(default=True)
    consultation_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True
    )

    # Ratings & Reviews
    rating = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0.00,
        validators=[MinValueValidator(0), MaxValueValidator(5)]
    )
    review_count = models.IntegerField(default=0)

    # Status
    is_verified = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_attorneys'
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Attorney'
        verbose_name_plural = 'Attorneys'

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class AttorneyReview(models.Model):
    """Reviews for attorneys"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    attorney = models.ForeignKey(
        Attorney,
        on_delete=models.CASCADE,
        related_name='reviews'
    )
    reviewer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='attorney_reviews_given'
    )

    # Review Content
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    title = models.CharField(max_length=255)
    review_text = models.TextField()

    # Review Categories
    communication_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        blank=True,
        null=True
    )
    expertise_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        blank=True,
        null=True
    )
    value_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        blank=True,
        null=True
    )
    responsiveness_rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        blank=True,
        null=True
    )

    # Service Details
    service_type = models.CharField(max_length=100, blank=True, null=True)  # e.g., "Patent Prosecution"
    service_date = models.DateField(blank=True, null=True)
    would_recommend = models.BooleanField(default=True)

    # Moderation
    is_verified = models.BooleanField(default=False)  # Verified as actual client
    is_approved = models.BooleanField(default=True)
    is_flagged = models.BooleanField(default=False)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Attorney Review'
        verbose_name_plural = 'Attorney Reviews'
        # Prevent multiple reviews from same user for same attorney
        unique_together = ['attorney', 'reviewer']

    def __str__(self):
        return f"Review of {self.attorney.full_name} by {self.reviewer.email if self.reviewer else 'Anonymous'}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update attorney's average rating
        self.attorney.review_count = self.attorney.reviews.filter(is_approved=True).count()
        avg_rating = self.attorney.reviews.filter(is_approved=True).aggregate(
            models.Avg('rating')
        )['rating__avg'] or 0
        self.attorney.rating = round(avg_rating, 2)
        self.attorney.save()


class AttorneyConnection(models.Model):
    """Connections/collaborations between platform users and attorneys"""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('active', 'Active Engagement'),
        ('completed', 'Completed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='attorney_connections'
    )
    attorney = models.ForeignKey(
        Attorney,
        on_delete=models.CASCADE,
        related_name='client_connections'
    )

    # Connection Details
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    connection_type = models.CharField(max_length=100)  # e.g., "Consultation", "Ongoing Representation"
    message = models.TextField(blank=True, null=True)  # Initial contact message
    response = models.TextField(blank=True, null=True)  # Attorney's response

    # Dates
    requested_date = models.DateTimeField(auto_now_add=True)
    responded_date = models.DateTimeField(blank=True, null=True)
    engagement_start_date = models.DateField(blank=True, null=True)
    engagement_end_date = models.DateField(blank=True, null=True)

    # Notes
    notes = models.TextField(blank=True, null=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Attorney Connection'
        verbose_name_plural = 'Attorney Connections'

    def __str__(self):
        return f"{self.user.email} → {self.attorney.full_name} ({self.status})"


class AttorneySnapshot(models.Model):
    """
    Monthly point-in-time snapshot of a practitioner from the USPTO roster.
    Each row captures the state of an attorney at a given month, enabling
    historical tracking of firm changes, address moves, type changes, etc.
    """

    id = models.BigAutoField(primary_key=True)

    # Link to current Attorney record (if exists)
    attorney = models.ForeignKey(
        Attorney,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='snapshots',
        to_field='registration_number',
        db_column='attorney_registration_number',
    )

    # Snapshot identity
    registration_number = models.CharField(max_length=100, db_index=True)
    snapshot_date = models.DateField(db_index=True)  # First of month, e.g. 2023-01-01

    # Practitioner info (as recorded in that month's roster)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    middle_initial = models.CharField(max_length=50, blank=True, null=True)
    suffix = models.CharField(max_length=10, blank=True, null=True)

    # Firm & address
    firm_name = models.CharField(max_length=255, blank=True, null=True)
    firm_line_2 = models.CharField(max_length=255, blank=True, null=True)
    street_address = models.CharField(max_length=255, blank=True, null=True)
    address_line_2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)

    # Contact & classification
    phone = models.CharField(max_length=50, blank=True, null=True)
    practitioner_type = models.CharField(max_length=30, blank=True, null=True)
    govt_employee = models.BooleanField(default=False)

    class Meta:
        ordering = ['registration_number', 'snapshot_date']
        unique_together = [('registration_number', 'snapshot_date')]
        verbose_name = 'Attorney Snapshot'
        verbose_name_plural = 'Attorney Snapshots'
        indexes = [
            models.Index(fields=['registration_number', 'snapshot_date']),
            models.Index(fields=['firm_name', 'snapshot_date']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} (#{self.registration_number}) @ {self.snapshot_date}"
