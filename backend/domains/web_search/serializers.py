"""
Web Search Serializers
"""

from rest_framework import serializers
from .models import SearchSession, SearchQuery, SearchResult, GoogleSearchConfig


class SearchResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = SearchResult
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'query', 'title', 'url', 'snippet',
                            'display_link', 'source_domain', 'thumbnail_url', 'position')


class SearchQuerySerializer(serializers.ModelSerializer):
    results = SearchResultSerializer(many=True, read_only=True)

    class Meta:
        model = SearchQuery
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'executed_at', 'results_count')


class SearchSessionSerializer(serializers.ModelSerializer):
    """Full detail serializer with nested queries."""
    queries = SearchQuerySerializer(many=True, read_only=True)

    class Meta:
        model = SearchSession
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')


class SearchSessionListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    queries_count = serializers.SerializerMethodField()
    results_count = serializers.SerializerMethodField()

    class Meta:
        model = SearchSession
        fields = [
            'id', 'title', 'source_type', 'source_id', 'status',
            'notes', 'created_by', 'created_at', 'updated_at',
            'queries_count', 'results_count',
        ]
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')

    def get_queries_count(self, obj):
        return obj.queries.count()

    def get_results_count(self, obj):
        total = 0
        for query in obj.queries.all():
            total += query.results.count()
        return total


class QuotaSerializer(serializers.Serializer):
    used = serializers.IntegerField()
    limit = serializers.IntegerField()
    remaining = serializers.IntegerField()
    date = serializers.CharField()
    mode = serializers.CharField(required=False, default='server')
    unlimited = serializers.BooleanField(required=False, default=False)


class GoogleSearchConfigSerializer(serializers.ModelSerializer):
    """Serializer for the Google CSE configuration singleton."""
    api_key_masked = serializers.SerializerMethodField()
    search_engine_id_masked = serializers.SerializerMethodField()
    is_configured = serializers.SerializerMethodField()
    search_mode = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = GoogleSearchConfig
        fields = [
            'api_key', 'api_key_masked',
            'search_engine_id', 'search_engine_id_masked',
            'daily_limit', 'is_active', 'is_configured', 'search_mode',
            'updated_at', 'updated_by_name',
        ]
        extra_kwargs = {
            'api_key': {'write_only': True},
            'search_engine_id': {'write_only': True},
        }

    def get_api_key_masked(self, obj):
        if not obj.api_key:
            return ''
        return f"{obj.api_key[:8]}{'*' * (len(obj.api_key) - 12)}{obj.api_key[-4:]}" if len(obj.api_key) > 12 else '****'

    def get_search_engine_id_masked(self, obj):
        if not obj.search_engine_id:
            return ''
        return f"{obj.search_engine_id[:4]}{'*' * (len(obj.search_engine_id) - 8)}{obj.search_engine_id[-4:]}" if len(obj.search_engine_id) > 8 else '****'

    def get_is_configured(self, obj):
        return bool(obj.search_engine_id)

    def get_search_mode(self, obj):
        return obj.search_mode

    def get_updated_by_name(self, obj):
        if obj.updated_by:
            return f"{obj.updated_by.first_name} {obj.updated_by.last_name}".strip() or obj.updated_by.email
        return None


# ==================== Client-Side Search Result Serializers ====================

class ClientSearchResultItemSerializer(serializers.Serializer):
    """Accepts a single result from client-side CSE JSONP response."""
    title = serializers.CharField(max_length=1000)
    url = serializers.URLField(max_length=2000)
    snippet = serializers.CharField(allow_blank=True, default='')
    display_link = serializers.CharField(max_length=500, allow_blank=True, default='')
    visible_url = serializers.CharField(max_length=500, allow_blank=True, default='')
    thumbnail_url = serializers.URLField(max_length=2000, required=False, allow_null=True, allow_blank=True)
    position = serializers.IntegerField(min_value=1)


class ClientSearchSubmissionSerializer(serializers.Serializer):
    """Accepts the full payload of client-side search results for a query."""
    query_id = serializers.UUIDField()
    results = ClientSearchResultItemSerializer(many=True)
