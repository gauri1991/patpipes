"""
Web Search Models
"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class SearchSession(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('archived', 'Archived'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500)
    source_type = models.CharField(max_length=50, default='manual')  # 'infringement', 'prior_art', 'portfolio', 'manual'
    source_id = models.UUIDField(null=True, blank=True)  # FK-free cross-module reference
    context_data = models.JSONField(default=dict, blank=True)  # snapshot of source data for query generation
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='search_sessions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['source_type', 'source_id']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return self.title


class SearchQuery(models.Model):
    CATEGORY_CHOICES = [
        ('product_evidence', 'Product Evidence'),
        ('litigation', 'Litigation'),
        ('prior_art', 'Prior Art'),
        ('competitor', 'Competitor'),
        ('technical', 'Technical'),
        ('market', 'Market'),
        ('general', 'General'),
    ]

    FILE_TYPE_CHOICES = [
        ('pdf', 'PDF'),
        ('doc', 'Word Document'),
        ('ppt', 'PowerPoint'),
        ('xls', 'Excel'),
        ('txt', 'Plain Text'),
    ]

    DATE_RESTRICT_CHOICES = [
        ('d1', 'Past day'),
        ('w1', 'Past week'),
        ('m1', 'Past month'),
        ('m3', 'Past 3 months'),
        ('m6', 'Past 6 months'),
        ('y1', 'Past year'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(SearchSession, on_delete=models.CASCADE, related_name='queries')
    query_text = models.CharField(max_length=2000)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='general')
    is_auto_generated = models.BooleanField(default=True)
    executed_at = models.DateTimeField(null=True, blank=True)
    results_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    # Advanced search filters
    site_filter = models.CharField(max_length=253, blank=True, default='')
    file_type = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES, blank=True, default='')
    date_restrict = models.CharField(max_length=10, choices=DATE_RESTRICT_CHOICES, blank=True, default='')
    exact_terms = models.CharField(max_length=500, blank=True, default='')
    exclude_terms = models.CharField(max_length=500, blank=True, default='')

    class Meta:
        ordering = ['category', 'created_at']

    def __str__(self):
        return f"[{self.category}] {self.query_text[:80]}"


class SearchResult(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    query = models.ForeignKey(SearchQuery, on_delete=models.CASCADE, related_name='results')
    title = models.CharField(max_length=1000)
    url = models.URLField(max_length=2000)
    snippet = models.TextField(blank=True)
    display_link = models.CharField(max_length=500, blank=True)
    source_domain = models.CharField(max_length=500, blank=True)
    thumbnail_url = models.URLField(max_length=2000, null=True, blank=True)
    position = models.IntegerField(default=0)  # rank in Google results
    is_flagged = models.BooleanField(default=False)
    is_saved = models.BooleanField(default=False)
    relevance_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['position']
        indexes = [
            models.Index(fields=['is_flagged']),
            models.Index(fields=['is_saved']),
        ]

    def __str__(self):
        return self.title[:80]


class DailyQuotaUsage(models.Model):
    date = models.DateField(unique=True)
    queries_used = models.IntegerField(default=0)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.date}: {self.queries_used}/100"


class GoogleSearchConfig(models.Model):
    """
    Singleton model storing Google Custom Search API configuration.
    Stored in DB so admins can update from the UI without restarting the server.
    Falls back to .env values when no DB row exists.
    """
    api_key = models.CharField(max_length=255, blank=True)
    search_engine_id = models.CharField(max_length=255, blank=True)
    daily_limit = models.IntegerField(default=100)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        verbose_name = 'Google Search Configuration'
        verbose_name_plural = 'Google Search Configuration'

    def __str__(self):
        masked_key = f"{self.api_key[:8]}...{self.api_key[-4:]}" if len(self.api_key) > 12 else '(not set)'
        return f"Google CSE Config (key: {masked_key})"

    @property
    def has_valid_api_key(self):
        """Google API keys are 39 chars. Treat short/placeholder values as missing."""
        return bool(self.api_key and len(self.api_key.strip()) > 10)

    @property
    def search_mode(self):
        """Return the available search mode based on configured credentials."""
        if self.has_valid_api_key and self.search_engine_id:
            return 'server'
        elif self.search_engine_id:
            return 'client'
        return 'none'

    def save(self, *args, **kwargs):
        # Enforce singleton: always use pk=1
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        """Load the singleton config, creating from .env defaults if needed."""
        from decouple import config as env_config
        obj, created = cls.objects.get_or_create(
            pk=1,
            defaults={
                'api_key': env_config('GOOGLE_CSE_API_KEY', default=''),
                'search_engine_id': env_config('GOOGLE_CSE_ID', default=''),
            }
        )
        return obj
