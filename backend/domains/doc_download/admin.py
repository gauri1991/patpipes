"""
Document Download Admin
"""

from django.contrib import admin
from .models import CrawlJob, DiscoveredLink, DownloadedFile


@admin.register(CrawlJob)
class CrawlJobAdmin(admin.ModelAdmin):
    list_display = ['title', 'target_url_short', 'status', 'max_depth', 'max_pages', 'created_by', 'created_at']
    list_filter = ['status', 'save_rendered_pages']
    search_fields = ['title', 'target_url']
    readonly_fields = ['id', 'crawl_task_id', 'download_task_id', 'progress', 'crawl_queue', 'visited_urls',
                       'started_at', 'paused_at', 'completed_at', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'

    def target_url_short(self, obj):
        return obj.target_url[:80]
    target_url_short.short_description = 'Target URL'


@admin.register(DiscoveredLink)
class DiscoveredLinkAdmin(admin.ModelAdmin):
    list_display = ['url_short', 'job', 'category', 'depth', 'is_selected', 'is_downloaded', 'discovered_at']
    list_filter = ['category', 'is_selected', 'is_downloaded', 'has_downloadable_doc']
    search_fields = ['url', 'title', 'link_text', 'meta_description']
    readonly_fields = ['id', 'discovered_at']
    raw_id_fields = ['job']

    def url_short(self, obj):
        return obj.url[:80]
    url_short.short_description = 'URL'


@admin.register(DownloadedFile)
class DownloadedFileAdmin(admin.ModelAdmin):
    list_display = ['original_filename', 'job', 'category', 'file_size_display', 'is_rendered_page',
                    'access_count', 'downloaded_at']
    list_filter = ['category', 'is_rendered_page']
    search_fields = ['original_filename', 'extracted_text']
    readonly_fields = ['id', 'checksum_sha256', 'downloaded_at', 'last_accessed_at']
    raw_id_fields = ['job', 'link']

    def file_size_display(self, obj):
        if obj.file_size < 1024:
            return f"{obj.file_size} B"
        elif obj.file_size < 1024 * 1024:
            return f"{obj.file_size / 1024:.1f} KB"
        return f"{obj.file_size / (1024 * 1024):.1f} MB"
    file_size_display.short_description = 'Size'
