"""
Infringement Analysis Admin
"""

from django.contrib import admin
from .models import (
    InfringementCase,
    ClaimMapping,
    Evidence,
    RiskAssessment,
    InfringementReport
)


@admin.register(InfringementCase)
class InfringementCaseAdmin(admin.ModelAdmin):
    list_display = ['case_number', 'case_name', 'status', 'risk_level', 'patent_number', 'accused_party_name', 'created_at']
    list_filter = ['status', 'analysis_type', 'risk_level', 'is_confidential']
    search_fields = ['case_name', 'case_number', 'patent_number', 'accused_product_name', 'accused_party_name']
    readonly_fields = ['case_number', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(ClaimMapping)
class ClaimMappingAdmin(admin.ModelAdmin):
    list_display = ['case', 'claim_number', 'mapping_type', 'match_confidence', 'limitations_met']
    list_filter = ['mapping_type', 'limitations_met']
    search_fields = ['case__case_name', 'claim_number', 'product_feature']


@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):
    list_display = ['case', 'title', 'evidence_type', 'relevance_score', 'created_at']
    list_filter = ['evidence_type']
    search_fields = ['title', 'description', 'case__case_name']


@admin.register(RiskAssessment)
class RiskAssessmentAdmin(admin.ModelAdmin):
    list_display = ['case', 'risk_factor', 'risk_score', 'assessed_date']
    list_filter = ['risk_factor']
    search_fields = ['case__case_name', 'description']


@admin.register(InfringementReport)
class InfringementReportAdmin(admin.ModelAdmin):
    list_display = ['case', 'title', 'report_type', 'status', 'created_at']
    list_filter = ['report_type', 'status']
    search_fields = ['title', 'case__case_name']
