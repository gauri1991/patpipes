"""
FCC Data Serializers
"""

from rest_framework import serializers
from .models import FCCGrantee, FCCQueryJob, FCCAuthorization, FCCExportFile, FCCDocument


class FCCGranteeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FCCGrantee
        fields = ['grantee_code', 'grantee_name', 'city', 'state', 'country', 'contact_name']
        read_only_fields = fields


class FCCQueryJobCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FCCQueryJob
        fields = ['title', 'query_type', 'fcc_id', 'product_code', 'bulk_fcc_ids',
                  'grantee_search_term', 'begin_date', 'end_date']

    def validate(self, data):
        qt = data.get('query_type')
        if qt == 'fcc_id':
            fcc_id = data.get('fcc_id', '').strip()
            if not fcc_id or len(fcc_id) < 3:
                raise serializers.ValidationError({
                    'fcc_id': 'Grantee code (min 3 characters) is required for FCC ID search.'
                })
        if qt == 'grantee_search':
            term = data.get('grantee_search_term', '').strip()
            if not term or len(term) < 2:
                raise serializers.ValidationError({
                    'grantee_search_term': 'Search term must be at least 2 characters.'
                })
        if qt == 'bulk_fcc_id':
            ids = data.get('bulk_fcc_ids', [])
            if not ids:
                raise serializers.ValidationError({
                    'bulk_fcc_ids': 'At least one FCC ID is required for bulk search.'
                })
            # Validate each ID is at least 3 chars
            invalid = [fid for fid in ids if len(fid.strip()) < 3]
            if invalid:
                raise serializers.ValidationError({
                    'bulk_fcc_ids': f'Each FCC ID must be at least 3 characters. Invalid: {", ".join(invalid)}'
                })
        if qt in ('whitespace', 'cbsd', 'afc'):
            if not data.get('begin_date') or not data.get('end_date'):
                raise serializers.ValidationError('Both begin_date and end_date are required for date-range queries.')
            if data['begin_date'] > data['end_date']:
                raise serializers.ValidationError({'end_date': 'End date must be after begin date.'})
        return data


class FCCQueryJobListSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    exports_count = serializers.SerializerMethodField()

    class Meta:
        model = FCCQueryJob
        fields = [
            'id', 'title', 'query_type', 'fcc_id', 'product_code', 'bulk_fcc_ids',
            'grantee_search_term', 'begin_date', 'end_date',
            'status', 'results_count', 'error_message',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'exports_count',
        ]
        read_only_fields = fields

    def get_created_by_name(self, obj):
        if obj.created_by:
            name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
            return name or obj.created_by.email
        return None

    def get_exports_count(self, obj):
        return obj.exports.count()


class FCCQueryJobDetailSerializer(FCCQueryJobListSerializer):
    class Meta(FCCQueryJobListSerializer.Meta):
        fields = FCCQueryJobListSerializer.Meta.fields


class FCCAuthorizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = FCCAuthorization
        fields = [
            'id', 'job', 'fcc_id', 'grantee_name', 'application_purpose',
            'equipment_class', 'description', 'grant_date', 'status', 'status_date',
            'address', 'city', 'state', 'zip_code', 'country',
            'freq_min', 'freq_max', 'power_output', 'emission_designator',
            'grant_notes', 'created_at',
        ]
        read_only_fields = fields


class FCCExportFileSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = FCCExportFile
        fields = [
            'id', 'job', 'filename', 'file_size', 'format',
            'record_count', 'created_at', 'download_url',
        ]
        read_only_fields = fields

    def get_download_url(self, obj):
        if obj.file:
            return obj.file.url
        return None


class FCCDocumentSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = FCCDocument
        fields = [
            'id', 'job', 'fcc_id', 'exhibit_name', 'description',
            'document_url', 'document_type', 'file_size_bytes',
            'is_downloaded', 'original_filename', 'mime_type',
            'download_error', 'discovered_at', 'download_url',
        ]
        read_only_fields = fields

    def get_download_url(self, obj):
        if obj.file:
            return obj.file.url
        return None


class FetchDocumentsRequestSerializer(serializers.Serializer):
    fcc_id = serializers.CharField(max_length=50)


class DownloadDocumentsRequestSerializer(serializers.Serializer):
    document_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, default=[]
    )
    fcc_id = serializers.CharField(max_length=50, required=False, default='')
    all = serializers.BooleanField(required=False, default=False)

    def validate(self, data):
        if not data.get('document_ids') and not data.get('fcc_id') and not data.get('all'):
            raise serializers.ValidationError(
                "Provide document_ids, fcc_id, or set all=true."
            )
        return data


class ExportRequestSerializer(serializers.Serializer):
    format = serializers.ChoiceField(choices=['csv', 'json', 'pdf'])
