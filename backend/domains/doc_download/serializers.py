"""
Document Download Serializers
"""

from rest_framework import serializers
from .models import CrawlJob, DiscoveredLink, DownloadedFile


class CrawlJobCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating crawl jobs."""

    class Meta:
        model = CrawlJob
        fields = [
            'title', 'target_url', 'max_depth', 'max_pages',
            'allowed_domains', 'url_patterns_include', 'url_patterns_exclude',
            'crawl_delay', 'proxy_url', 'save_rendered_pages',
        ]

    def validate_crawl_delay(self, value):
        if value < 1.0 or value > 5.0:
            raise serializers.ValidationError("Crawl delay must be between 1 and 5 seconds.")
        return value

    def validate_max_depth(self, value):
        if value > 10:
            raise serializers.ValidationError("Max depth cannot exceed 10.")
        return value

    def validate_max_pages(self, value):
        if value > 1000:
            raise serializers.ValidationError("Max pages cannot exceed 1000.")
        return value


class CrawlJobListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views — excludes heavy fields."""
    links_count = serializers.SerializerMethodField()
    files_count = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CrawlJob
        fields = [
            'id', 'title', 'target_url', 'status', 'max_depth', 'max_pages',
            'crawl_delay', 'save_rendered_pages', 'progress',
            'started_at', 'paused_at', 'completed_at',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'links_count', 'files_count',
        ]
        read_only_fields = (
            'id', 'status', 'progress', 'started_at', 'paused_at',
            'completed_at', 'created_by', 'created_at', 'updated_at',
        )

    def get_links_count(self, obj):
        return obj.links.count()

    def get_files_count(self, obj):
        return obj.downloaded_files.count()

    def get_created_by_name(self, obj):
        if obj.created_by:
            name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
            return name or obj.created_by.email
        return None


class CrawlJobDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer including progress but excluding BFS state."""
    links_count = serializers.SerializerMethodField()
    files_count = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CrawlJob
        fields = [
            'id', 'title', 'target_url', 'max_depth', 'max_pages',
            'allowed_domains', 'url_patterns_include', 'url_patterns_exclude',
            'crawl_delay', 'proxy_url', 'save_rendered_pages',
            'status', 'progress', 'error_message',
            'started_at', 'paused_at', 'completed_at',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'links_count', 'files_count',
        ]
        read_only_fields = (
            'id', 'status', 'progress', 'error_message',
            'started_at', 'paused_at', 'completed_at',
            'created_by', 'created_at', 'updated_at',
        )

    def get_links_count(self, obj):
        return obj.links.count()

    def get_files_count(self, obj):
        return obj.downloaded_files.count()

    def get_created_by_name(self, obj):
        if obj.created_by:
            name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
            return name or obj.created_by.email
        return None


class DiscoveredLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscoveredLink
        fields = [
            'id', 'job', 'url', 'title', 'link_text', 'parent_url',
            'depth', 'category', 'content_type', 'file_extension',
            'file_size_bytes', 'is_selected', 'is_downloaded',
            'download_error', 'meta_description', 'has_downloadable_doc',
            'discovered_at',
        ]
        read_only_fields = (
            'id', 'job', 'url', 'title', 'link_text', 'parent_url',
            'depth', 'category', 'content_type', 'file_extension',
            'file_size_bytes', 'is_downloaded', 'download_error',
            'meta_description', 'has_downloadable_doc', 'discovered_at',
        )


class DownloadedFileListSerializer(serializers.ModelSerializer):
    """Lightweight file serializer — excludes extracted_text."""
    link_url = serializers.CharField(source='link.url', read_only=True)
    link_title = serializers.CharField(source='link.title', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)

    class Meta:
        model = DownloadedFile
        fields = [
            'id', 'job', 'job_title', 'link_url', 'link_title',
            'original_filename', 'file_size', 'mime_type', 'category',
            'is_rendered_page', 'downloaded_at', 'access_count',
        ]
        read_only_fields = fields


class DownloadedFileDetailSerializer(serializers.ModelSerializer):
    """Full file serializer with extracted text."""
    link_url = serializers.CharField(source='link.url', read_only=True)
    link_title = serializers.CharField(source='link.title', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = DownloadedFile
        fields = [
            'id', 'job', 'job_title', 'link_url', 'link_title',
            'original_filename', 'file_size', 'mime_type', 'category',
            'is_rendered_page', 'checksum_sha256', 'extracted_text',
            'downloaded_at', 'access_count', 'last_accessed_at',
            'download_url',
        ]
        read_only_fields = fields

    def get_download_url(self, obj):
        if obj.file:
            return obj.file.url
        return None


class BulkSelectSerializer(serializers.Serializer):
    """Serializer for bulk link selection."""
    link_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, default=[]
    )
    categories = serializers.ListField(
        child=serializers.CharField(), required=False, default=[]
    )
    select = serializers.BooleanField(default=True)
    select_all = serializers.BooleanField(default=False)

    def validate(self, data):
        if not data.get('link_ids') and not data.get('categories') and not data.get('select_all'):
            raise serializers.ValidationError(
                "Provide at least one of: link_ids, categories, or select_all."
            )
        return data
