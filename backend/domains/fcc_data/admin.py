"""
FCC Data Admin
"""

from django.contrib import admin
from .models import FCCGrantee, FCCQueryJob, FCCAuthorization, FCCExportFile, FCCDocument


@admin.register(FCCGrantee)
class FCCGranteeAdmin(admin.ModelAdmin):
    list_display = ['grantee_code', 'grantee_name', 'city', 'country', 'date_received']
    search_fields = ['grantee_code', 'grantee_name']
    list_filter = ['country']


@admin.register(FCCQueryJob)
class FCCQueryJobAdmin(admin.ModelAdmin):
    list_display = ['title', 'query_type', 'status', 'results_count', 'created_by', 'created_at']
    list_filter = ['query_type', 'status']
    search_fields = ['title', 'fcc_id']
    readonly_fields = ['id', 'task_id', 'results_count', 'raw_response', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(FCCAuthorization)
class FCCAuthorizationAdmin(admin.ModelAdmin):
    list_display = ['fcc_id', 'grantee_name', 'equipment_class', 'status', 'grant_date', 'application_purpose']
    list_filter = ['equipment_class', 'status', 'application_purpose']
    search_fields = ['fcc_id', 'grantee_name', 'description']
    readonly_fields = ['id', 'raw_data', 'created_at']
    raw_id_fields = ['job']


@admin.register(FCCExportFile)
class FCCExportFileAdmin(admin.ModelAdmin):
    list_display = ['filename', 'job', 'format', 'record_count', 'file_size_display', 'created_at']
    list_filter = ['format']
    readonly_fields = ['id', 'created_at']
    raw_id_fields = ['job']

    def file_size_display(self, obj):
        if obj.file_size < 1024:
            return f"{obj.file_size} B"
        elif obj.file_size < 1024 * 1024:
            return f"{obj.file_size / 1024:.1f} KB"
        return f"{obj.file_size / (1024 * 1024):.1f} MB"
    file_size_display.short_description = 'Size'


@admin.register(FCCDocument)
class FCCDocumentAdmin(admin.ModelAdmin):
    list_display = ['exhibit_name', 'fcc_id', 'document_type', 'is_downloaded', 'file_size_bytes', 'discovered_at']
    list_filter = ['document_type', 'is_downloaded']
    search_fields = ['exhibit_name', 'fcc_id']
    readonly_fields = ['id', 'discovered_at']
    raw_id_fields = ['job']
