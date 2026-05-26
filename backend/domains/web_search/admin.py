"""
Web Search Admin
"""

from django.contrib import admin
from .models import SearchSession, SearchQuery, SearchResult, DailyQuotaUsage, GoogleSearchConfig


@admin.register(SearchSession)
class SearchSessionAdmin(admin.ModelAdmin):
    list_display = ['title', 'source_type', 'status', 'created_by', 'created_at']
    list_filter = ['source_type', 'status']
    search_fields = ['title', 'notes']
    readonly_fields = ['id', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(SearchQuery)
class SearchQueryAdmin(admin.ModelAdmin):
    list_display = ['query_text_short', 'session', 'category', 'is_auto_generated', 'results_count', 'executed_at']
    list_filter = ['category', 'is_auto_generated']
    search_fields = ['query_text', 'session__title']
    readonly_fields = ['id', 'created_at']

    def query_text_short(self, obj):
        return obj.query_text[:80]
    query_text_short.short_description = 'Query'


@admin.register(SearchResult)
class SearchResultAdmin(admin.ModelAdmin):
    list_display = ['title_short', 'source_domain', 'position', 'is_flagged', 'is_saved', 'created_at']
    list_filter = ['is_flagged', 'is_saved', 'source_domain']
    search_fields = ['title', 'url', 'snippet']
    readonly_fields = ['id', 'created_at']

    def title_short(self, obj):
        return obj.title[:80]
    title_short.short_description = 'Title'


@admin.register(DailyQuotaUsage)
class DailyQuotaUsageAdmin(admin.ModelAdmin):
    list_display = ['date', 'queries_used']
    list_filter = ['date']
    readonly_fields = ['date']


@admin.register(GoogleSearchConfig)
class GoogleSearchConfigAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'is_active', 'daily_limit', 'updated_at']
    readonly_fields = ['updated_at', 'updated_by']

    def has_add_permission(self, request):
        # Singleton — prevent creating multiple rows
        return not GoogleSearchConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
