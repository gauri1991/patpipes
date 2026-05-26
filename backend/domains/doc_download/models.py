"""
Document Download Models

Models for website crawling, link discovery, and document downloading.
"""

import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class CrawlJob(models.Model):
    """A crawl session targeting one website."""

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('crawling', 'Crawling'),
        ('paused', 'Paused'),
        ('discovered', 'Discovered'),
        ('downloading', 'Downloading'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500)
    target_url = models.URLField(max_length=2000)

    # Crawl configuration
    max_depth = models.PositiveIntegerField(default=2)
    max_pages = models.PositiveIntegerField(default=100)
    allowed_domains = models.JSONField(default=list, blank=True)
    url_patterns_include = models.JSONField(default=list, blank=True)
    url_patterns_exclude = models.JSONField(default=list, blank=True)
    crawl_delay = models.FloatField(default=2.0, help_text='Seconds between requests (1-5)')
    proxy_url = models.URLField(max_length=2000, blank=True, default='')
    save_rendered_pages = models.BooleanField(
        default=True,
        help_text='Auto-save rendered HTML/PDF when no downloadable doc found for product pages'
    )

    # Status and task tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    crawl_task_id = models.CharField(max_length=255, blank=True, default='')
    download_task_id = models.CharField(max_length=255, blank=True, default='')
    progress = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True, default='')

    # Resume support — serialized BFS state
    crawl_queue = models.JSONField(default=list, blank=True)
    visited_urls = models.JSONField(default=list, blank=True)

    # Timestamps
    started_at = models.DateTimeField(null=True, blank=True)
    paused_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='crawl_jobs')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at']),
            models.Index(fields=['status']),
            models.Index(fields=['created_by', '-created_at']),
        ]

    def __str__(self):
        return f"{self.title} ({self.target_url})"

    def get_default_progress(self):
        return {
            'pages_crawled': 0,
            'pages_total': 0,
            'links_discovered': 0,
            'files_downloaded': 0,
            'files_total': 0,
            'rendered_pages_saved': 0,
            'total_download_size_bytes': 0,
            'current_url': '',
            'crawl_rate_pages_per_min': 0.0,
            'errors_count': 0,
            'blocked_count': 0,
            'category_counts': {},
            'errors': [],
        }

    def save(self, *args, **kwargs):
        if not self.progress:
            self.progress = self.get_default_progress()
        # Auto-populate allowed_domains from target_url if empty
        if not self.allowed_domains and self.target_url:
            from urllib.parse import urlparse
            parsed = urlparse(self.target_url)
            if parsed.hostname:
                self.allowed_domains = [parsed.hostname]
        super().save(*args, **kwargs)


class DiscoveredLink(models.Model):
    """A link discovered during crawling."""

    CATEGORY_CHOICES = [
        ('product_page', 'Product Page'),
        ('technical_doc', 'Technical Documentation'),
        ('datasheet', 'Datasheet'),
        ('legal_ip', 'Legal / IP'),
        ('marketing', 'Marketing'),
        ('image', 'Image'),
        ('pdf', 'PDF'),
        ('document', 'Document'),
        ('page', 'Web Page'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.ForeignKey(CrawlJob, on_delete=models.CASCADE, related_name='links')
    url = models.URLField(max_length=2000)
    title = models.CharField(max_length=1000, blank=True, default='')
    link_text = models.CharField(max_length=1000, blank=True, default='')
    parent_url = models.URLField(max_length=2000, blank=True, default='')
    depth = models.PositiveIntegerField(default=0)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='page')
    content_type = models.CharField(max_length=200, blank=True, default='')
    file_extension = models.CharField(max_length=20, blank=True, default='')
    file_size_bytes = models.BigIntegerField(null=True, blank=True)
    is_selected = models.BooleanField(default=False)
    is_downloaded = models.BooleanField(default=False)
    download_error = models.TextField(blank=True, default='')
    meta_description = models.TextField(blank=True, default='')
    meta_keywords = models.TextField(blank=True, default='')
    has_downloadable_doc = models.BooleanField(default=True)
    discovered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-discovered_at']
        indexes = [
            models.Index(fields=['job', 'category']),
            models.Index(fields=['job', 'is_selected']),
            models.Index(fields=['job', 'is_downloaded']),
            models.Index(fields=['url']),
            models.Index(fields=['job', '-discovered_at']),
        ]

    def __str__(self):
        return f"[{self.category}] {self.url[:80]}"


class DownloadedFile(models.Model):
    """An actual downloaded file stored on disk."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    link = models.OneToOneField(DiscoveredLink, on_delete=models.CASCADE, related_name='downloaded_file')
    job = models.ForeignKey(CrawlJob, on_delete=models.CASCADE, related_name='downloaded_files')
    file = models.FileField(upload_to='doc_downloads/%Y/%m/')
    original_filename = models.CharField(max_length=500)
    file_size = models.BigIntegerField(default=0)
    mime_type = models.CharField(max_length=200, blank=True, default='')
    category = models.CharField(max_length=50, choices=DiscoveredLink.CATEGORY_CHOICES, default='other')
    is_rendered_page = models.BooleanField(
        default=False,
        help_text='True if this is a saved rendered HTML/PDF (no original downloadable doc found)'
    )
    checksum_sha256 = models.CharField(max_length=64, blank=True, default='')
    extracted_text = models.TextField(blank=True, default='')
    downloaded_at = models.DateTimeField(auto_now_add=True)
    access_count = models.IntegerField(default=0)
    last_accessed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-downloaded_at']
        indexes = [
            models.Index(fields=['job', 'category']),
            models.Index(fields=['checksum_sha256']),
            models.Index(fields=['job', '-downloaded_at']),
            models.Index(fields=['job', 'is_rendered_page']),
        ]

    def __str__(self):
        return self.original_filename

    def increment_access_count(self):
        from django.utils import timezone
        self.access_count += 1
        self.last_accessed_at = timezone.now()
        self.save(update_fields=['access_count', 'last_accessed_at'])
