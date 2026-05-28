"""
Analytics admin
"""

from django import forms
from django.contrib import admin
from django.utils.html import format_html
from .models import (
    AnalyticsProject, TechnologyArea, PatentDataset, CompetitorProfile,
    GlobalCompetitorProfile, GlobalTechnologyArea,
    AnalyticsVisualization, AnalyticsReport, AnalyticsInsight, PatentRecord,
    ColumnMappingRule, DatasetColumnMapping, DynamicPatentField,
    LLMProviderConfig, AnalysisPromptTemplate,
)


@admin.register(AnalyticsProject)
class AnalyticsProjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'status', 'priority', 'created_by', 'assigned_to', 'progress_percentage', 'created_at']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['name', 'description', 'created_by__email']
    readonly_fields = ['id', 'created_at', 'updated_at', 'progress_percentage']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'status', 'priority')
        }),
        ('Assignment', {
            'fields': ('created_by', 'assigned_to')
        }),
        ('Timeline', {
            'fields': ('start_date', 'due_date', 'completed_date')
        }),
        ('Configuration', {
            'fields': ('analysis_scope', 'content_type', 'object_id'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at', 'progress_percentage'),
            'classes': ('collapse',)
        })
    )


@admin.register(GlobalTechnologyArea)
class GlobalTechnologyAreaAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'maturity_level', 'patent_count', 'innovation_score', 'market_potential']
    list_filter = ['category', 'maturity_level', 'market_potential', 'created_at']
    search_fields = ['name', 'description', 'ipc_class', 'cpc_class']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(TechnologyArea)
class TechnologyAreaAdmin(admin.ModelAdmin):
    list_display = ['name', 'project', 'project_relevance_score', 'added_by', 'added_at']
    list_filter = ['project', 'added_at']
    search_fields = ['global_technology__name', 'project__name', 'project_notes']
    readonly_fields = ['id', 'added_at']
    
    def name(self, obj):
        return obj.global_technology.name
    name.short_description = 'Technology Name'


@admin.register(PatentDataset)
class PatentDatasetAdmin(admin.ModelAdmin):
    list_display = ['name', 'project', 'data_source', 'processing_status', 'processing_progress', 'total_patents', 'created_by']
    list_filter = ['processing_status', 'data_source', 'created_at']
    search_fields = ['name', 'description', 'project__name']
    readonly_fields = ['id', 'processing_progress', 'total_patents', 'processed_patents', 'classification_confidence', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'project', 'data_source', 'data_file')
        }),
        ('Processing Status', {
            'fields': ('processing_status', 'processing_progress', 'processing_log')
        }),
        ('Statistics', {
            'fields': ('total_patents', 'processed_patents', 'classification_confidence'),
            'classes': ('collapse',)
        }),
        ('Analysis Results', {
            'fields': ('technology_distribution', 'temporal_distribution', 'geographic_distribution', 'assignee_distribution'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(GlobalCompetitorProfile)
class GlobalCompetitorProfileAdmin(admin.ModelAdmin):
    list_display = ['name', 'industry', 'total_patents', 'active_patents', 'competitive_strength', 'patent_quality_score']
    list_filter = ['industry', 'competitive_strength', 'created_at']
    search_fields = ['name', 'legal_name', 'industry', 'aliases']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(CompetitorProfile)
class CompetitorProfileAdmin(admin.ModelAdmin):
    list_display = ['name', 'project', 'project_relevance_score', 'added_by', 'added_at']
    list_filter = ['project', 'added_at']
    search_fields = ['global_competitor__name', 'project__name', 'project_notes']
    readonly_fields = ['id', 'added_at']
    
    def name(self, obj):
        return obj.global_competitor.name
    name.short_description = 'Competitor Name'


@admin.register(AnalyticsVisualization)
class AnalyticsVisualizationAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'visualization_type', 'status', 'created_by', 'created_at']
    list_filter = ['visualization_type', 'status', 'created_at']
    search_fields = ['title', 'description', 'project__name']
    readonly_fields = ['id', 'chart_data', 'insights', 'created_at', 'updated_at']


@admin.register(AnalyticsReport)
class AnalyticsReportAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'report_type', 'status', 'created_by', 'reviewed_by', 'approved_at']
    list_filter = ['report_type', 'status', 'created_at']
    search_fields = ['title', 'project__name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(AnalyticsInsight)
class AnalyticsInsightAdmin(admin.ModelAdmin):
    list_display = ['title', 'project', 'insight_type', 'confidence_level', 'impact_score', 'priority', 'is_reviewed']
    list_filter = ['insight_type', 'confidence_level', 'priority', 'is_reviewed', 'created_at']
    search_fields = ['title', 'description', 'project__name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    actions = ['mark_as_reviewed', 'mark_as_actionable']
    
    def mark_as_reviewed(self, request, queryset):
        queryset.update(is_reviewed=True, reviewed_by=request.user)
        self.message_user(request, f"Marked {queryset.count()} insights as reviewed.")
    mark_as_reviewed.short_description = "Mark selected insights as reviewed"
    
    def mark_as_actionable(self, request, queryset):
        queryset.update(is_actionable=True)
        self.message_user(request, f"Marked {queryset.count()} insights as actionable.")
    mark_as_actionable.short_description = "Mark selected insights as actionable"


@admin.register(PatentRecord)
class PatentRecordAdmin(admin.ModelAdmin):
    list_display = ['patent_id', 'title', 'assignee', 'filing_date', 'dataset', 'row_number', 'created_at']
    list_filter = ['dataset', 'filing_date', 'country_code', 'patent_type']
    search_fields = ['patent_id', 'title', 'assignee', 'inventor']
    ordering = ['dataset', 'row_number']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('dataset', 'row_number', 'patent_id', 'title', 'abstract')
        }),
        ('People & Organization', {
            'fields': ('assignee', 'inventor')
        }),
        ('Dates', {
            'fields': ('filing_date', 'publication_date', 'grant_date')
        }),
        ('Classifications', {
            'fields': ('ipc_classification', 'cpc_classification', 'uspc_classification')
        }),
        ('Geographic & Legal', {
            'fields': ('country_code', 'jurisdiction', 'patent_type', 'legal_status')
        }),
        ('Technical Data', {
            'fields': ('claims_count', 'forward_citations', 'backward_citations')
        }),
        ('Processing Data', {
            'fields': ('raw_data', 'parsing_notes'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )


@admin.register(ColumnMappingRule)
class ColumnMappingRuleAdmin(admin.ModelAdmin):
    list_display = ['target_field', 'field_type', 'confidence_level', 'is_core_field', 'is_active', 'usage_count', 'success_rate', 'created_at']
    list_filter = ['field_type', 'confidence_level', 'is_core_field', 'is_active', 'created_at']
    search_fields = ['target_field', 'column_patterns']
    readonly_fields = ['id', 'usage_count', 'success_rate', 'created_at', 'updated_at']
    ordering = ['-confidence_level', '-success_rate', 'target_field']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('target_field', 'field_type', 'confidence_level', 'is_core_field', 'is_active')
        }),
        ('Column Patterns', {
            'fields': ('column_patterns',),
            'description': 'JSON array of column name patterns/variations (case-insensitive)'
        }),
        ('Field Configuration', {
            'fields': ('field_params',),
            'description': 'Field parameters for dynamic field creation',
            'classes': ('collapse',)
        }),
        ('Usage Statistics', {
            'fields': ('usage_count', 'success_rate'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['activate_rules', 'deactivate_rules', 'reset_statistics']
    
    def activate_rules(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"Activated {updated} mapping rules.")
    activate_rules.short_description = "Activate selected mapping rules"
    
    def deactivate_rules(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"Deactivated {updated} mapping rules.")
    deactivate_rules.short_description = "Deactivate selected mapping rules"
    
    def reset_statistics(self, request, queryset):
        updated = queryset.update(usage_count=0, success_rate=0.0)
        self.message_user(request, f"Reset statistics for {updated} mapping rules.")
    reset_statistics.short_description = "Reset usage statistics"


@admin.register(DatasetColumnMapping)
class DatasetColumnMappingAdmin(admin.ModelAdmin):
    list_display = ['dataset', 'source_column', 'target_field', 'confidence_score', 'status', 'records_processed', 'reviewed_by', 'created_at']
    list_filter = ['status', 'confidence_score', 'reviewed_at', 'created_at', 'dataset__project']
    search_fields = ['source_column', 'target_field', 'dataset__name', 'dataset__project__name']
    readonly_fields = ['id', 'confidence_score', 'records_processed', 'processing_errors', 'sample_values', 'created_at', 'updated_at']
    ordering = ['-confidence_score', 'dataset', 'source_column']
    
    fieldsets = (
        ('Mapping Details', {
            'fields': ('dataset', 'mapping_rule', 'source_column', 'target_field')
        }),
        ('Status & Quality', {
            'fields': ('status', 'confidence_score', 'records_processed')
        }),
        ('Sample Data', {
            'fields': ('sample_values', 'processing_errors'),
            'classes': ('collapse',)
        }),
        ('Admin Review', {
            'fields': ('reviewed_by', 'reviewed_at', 'admin_notes')
        }),
        ('Metadata', {
            'fields': ('id', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['confirm_mappings', 'reject_mappings', 'reset_review_status']
    
    def confirm_mappings(self, request, queryset):
        updated = 0
        for mapping in queryset:
            mapping.mark_confirmed(request.user)
            updated += 1
        self.message_user(request, f"Confirmed {updated} column mappings.")
    confirm_mappings.short_description = "Confirm selected mappings"
    
    def reject_mappings(self, request, queryset):
        updated = 0
        for mapping in queryset:
            mapping.mark_rejected(request.user, "Rejected via admin action")
            updated += 1
        self.message_user(request, f"Rejected {updated} column mappings.")
    reject_mappings.short_description = "Reject selected mappings"
    
    def reset_review_status(self, request, queryset):
        updated = queryset.update(status='pending', reviewed_by=None, reviewed_at=None, admin_notes='')
        self.message_user(request, f"Reset review status for {updated} mappings.")
    reset_review_status.short_description = "Reset review status to pending"


@admin.register(DynamicPatentField)
class DynamicPatentFieldAdmin(admin.ModelAdmin):
    list_display = ['field_name', 'display_name', 'field_type', 'is_active', 'migration_applied', 'total_records', 'created_at']
    list_filter = ['field_type', 'is_active', 'migration_applied', 'created_at']
    search_fields = ['field_name', 'display_name', 'description']
    readonly_fields = ['id', 'total_records', 'migration_applied', 'migration_name', 'created_at', 'updated_at']
    filter_horizontal = ['datasets_using']
    
    fieldsets = (
        ('Field Definition', {
            'fields': ('field_name', 'display_name', 'field_type', 'field_params')
        }),
        ('Metadata', {
            'fields': ('description', 'is_active')
        }),
        ('Usage Tracking', {
            'fields': ('datasets_using', 'total_records'),
            'classes': ('collapse',)
        }),
        ('Migration Status', {
            'fields': ('migration_applied', 'migration_name'),
            'classes': ('collapse',)
        }),
        ('System Info', {
            'fields': ('id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    actions = ['activate_fields', 'deactivate_fields']
    
    def activate_fields(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"Activated {updated} dynamic fields.")
    activate_fields.short_description = "Activate selected fields"
    
    def deactivate_fields(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"Deactivated {updated} dynamic fields.")
    deactivate_fields.short_description = "Deactivate selected fields"


# ── LLM Provider Config ──────────────────────────────────────────────────────

class LLMProviderConfigForm(forms.ModelForm):
    """Admin form with dynamic model choices based on selected provider."""

    model_name = forms.ChoiceField(
        choices=[],
        required=False,
        help_text='Select the model for this provider. Leave at "Provider default" to use the recommended model.',
    )

    class Meta:
        model = LLMProviderConfig
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        provider = None
        if self.instance and self.instance.pk:
            provider = self.instance.provider
        elif self.data.get('provider'):
            provider = self.data['provider']

        if provider and provider in LLMProviderConfig.MODELS_BY_PROVIDER:
            model_choices = LLMProviderConfig.MODELS_BY_PROVIDER[provider]
        else:
            # Show all models when provider not yet selected
            model_choices = [
                m for choices in LLMProviderConfig.MODELS_BY_PROVIDER.values()
                for m in choices
            ]

        self.fields['model_name'].choices = (
            [('', f'Provider default ({LLMProviderConfig.DEFAULT_MODEL.get(provider, "see below")})'
              if provider else 'Provider default')]
            + model_choices
        )

    def clean_model_name(self):
        value = self.cleaned_data.get('model_name') or ''
        provider = self.cleaned_data.get('provider') or (self.instance.provider if self.instance else '')
        if value and provider in LLMProviderConfig.MODELS_BY_PROVIDER:
            valid = [m for m, _ in LLMProviderConfig.MODELS_BY_PROVIDER[provider]]
            if value not in valid:
                raise forms.ValidationError(
                    f'"{value}" is not a known model for {provider}. '
                    f'Valid: {", ".join(valid)}'
                )
        return value


@admin.register(LLMProviderConfig)
class LLMProviderConfigAdmin(admin.ModelAdmin):
    form = LLMProviderConfigForm
    list_display = [
        'display_name', 'provider', 'resolved_model_display',
        'masked_key_display', 'is_active', 'test_status', 'last_tested_at', 'updated_at',
    ]
    list_filter = ['provider', 'is_active', 'test_status']
    search_fields = ['display_name', 'provider', 'notes']
    readonly_fields = [
        'id', 'masked_key_display', 'resolved_model_display',
        'last_tested_at', 'test_status', 'test_error', 'created_at', 'updated_at',
    ]

    fieldsets = (
        ('Provider', {
            'fields': ('provider', 'display_name', 'is_active'),
        }),
        ('Model Selection', {
            'fields': ('model_name', 'resolved_model_display'),
            'description': (
                'Choose which model to use for AI patent scoring and narrative generation. '
                'Anthropic models support prompt caching (saves cost on bulk runs). '
                'Opus is most capable; Sonnet is the recommended balance of quality and cost; '
                'Haiku is fastest and cheapest.'
            ),
        }),
        ('Credentials', {
            'fields': ('api_key', 'masked_key_display', 'api_base_url'),
            'description': 'The API key is stored in plaintext. Only superusers should access this page.',
        }),
        ('Test Status', {
            'fields': ('test_status', 'test_error', 'last_tested_at'),
            'classes': ('collapse',),
        }),
        ('Notes', {
            'fields': ('notes',),
        }),
        ('Metadata', {
            'fields': ('id', 'updated_by', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def masked_key_display(self, obj):
        return obj.masked_key
    masked_key_display.short_description = 'Masked Key'

    def resolved_model_display(self, obj):
        return obj.resolved_model or '—'
    resolved_model_display.short_description = 'Active Model'

    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


# ── Analysis Prompt Templates ────────────────────────────────────────────────

@admin.register(AnalysisPromptTemplate)
class AnalysisPromptTemplateAdmin(admin.ModelAdmin):
    list_display = [
        'section_display', 'category', 'version', 'is_active',
        'description', 'created_by', 'updated_at',
    ]
    list_filter = ['section', 'category', 'is_active']
    search_fields = ['section', 'category', 'description', 'prompt_text']
    readonly_fields = ['id', 'created_at', 'updated_at', 'placeholders_help']

    fieldsets = (
        ('Identity', {
            'fields': ('section', 'category', 'version', 'is_active'),
        }),
        ('Prompt', {
            'fields': ('description', 'placeholders_help', 'prompt_text'),
        }),
        ('Metadata', {
            'fields': ('id', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    PLACEHOLDER_DOCS = {
        'bundle_attribute_extraction': (
            '{patent_text} — title + abstract + first 5 claims\n'
            '{fields_prompt} — bullet list of fields to score with descriptions'
        ),
        'group_a_classification': (
            '{patent_text} — title + abstract + first 5 claims\n'
            '{ipc_codes} — IPC classification codes from the patent record\n'
            '{cpc_codes} — CPC classification codes from the patent record\n'
            '{taxonomy_lines} — bullet list of GlobalTechnologyArea names/categories'
        ),
    }

    def section_display(self, obj):
        return obj.get_section_display()
    section_display.short_description = 'Section'
    section_display.admin_order_field = 'section'

    def placeholders_help(self, obj):
        docs = self.PLACEHOLDER_DOCS.get(obj.section, '')
        if not docs:
            return '—'
        return format_html('<pre style="font-size:11px;background:#f8f8f8;padding:8px;border-radius:4px">{}</pre>', docs)
    placeholders_help.short_description = 'Available Placeholders'

    def save_model(self, request, obj, form, change):
        if not obj.created_by_id:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    actions = ['activate_prompts', 'deactivate_prompts', 'duplicate_as_new_version']

    def activate_prompts(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f'Activated {updated} prompt template(s).')
    activate_prompts.short_description = 'Activate selected prompts'

    def deactivate_prompts(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f'Deactivated {updated} prompt template(s).')
    deactivate_prompts.short_description = 'Deactivate selected prompts'

    def duplicate_as_new_version(self, request, queryset):
        created = 0
        for tpl in queryset:
            latest = (
                AnalysisPromptTemplate.objects
                .filter(section=tpl.section, category=tpl.category)
                .order_by('-version')
                .values_list('version', flat=True)
                .first()
            ) or 0
            AnalysisPromptTemplate.objects.create(
                section=tpl.section,
                category=tpl.category,
                version=latest + 1,
                prompt_text=tpl.prompt_text,
                description=f'Copy of v{tpl.version}',
                is_active=False,
                created_by=request.user,
            )
            created += 1
        self.message_user(request, f'Created {created} new version(s) as drafts (inactive).')
    duplicate_as_new_version.short_description = 'Duplicate as new version (draft)'