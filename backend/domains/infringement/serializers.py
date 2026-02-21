"""
Infringement Analysis Serializers
"""

from rest_framework import serializers
from domains.accounts.serializers import UserSerializer
from .models import (
    InfringementCase,
    ClaimMapping,
    ClaimElement,
    Evidence,
    RiskAssessment,
    DamagesAnalysis,
    ExpertOpinion,
    LitigationStrategy,
    InfringementReport
)


class ClaimElementSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = ClaimElement
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')


class ClaimMappingSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    elements = ClaimElementSerializer(many=True, read_only=True)

    class Meta:
        model = ClaimMapping
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')


class EvidenceSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)

    class Meta:
        model = Evidence
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'uploaded_by')


class RiskAssessmentSerializer(serializers.ModelSerializer):
    assessed_by = UserSerializer(read_only=True)

    class Meta:
        model = RiskAssessment
        fields = '__all__'
        read_only_fields = ('id', 'assessed_date', 'created_at', 'updated_at', 'assessed_by')


class DamagesAnalysisSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    calculated_damages = serializers.SerializerMethodField()

    class Meta:
        model = DamagesAnalysis
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')

    def get_calculated_damages(self, obj):
        return obj.calculate_damages()


class ExpertOpinionSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = ExpertOpinion
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')


class LitigationStrategySerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = LitigationStrategy
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')


class InfringementReportSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    reviewed_by = UserSerializer(read_only=True)

    class Meta:
        model = InfringementReport
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')


class PatentBriefSerializer(serializers.Serializer):
    """Inline brief patent info for infringement case responses"""
    id = serializers.UUIDField()
    title = serializers.CharField()
    patent_number = serializers.CharField(allow_null=True)
    portfolio_id = serializers.UUIDField(source='portfolio.id', allow_null=True)
    portfolio_name = serializers.CharField(source='portfolio.name', allow_null=True, default=None)


class InfringementCaseSerializer(serializers.ModelSerializer):
    analyst = UserSerializer(read_only=True)
    assigned_attorney = UserSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    claim_mappings = ClaimMappingSerializer(many=True, read_only=True)
    evidence = EvidenceSerializer(many=True, read_only=True)
    risk_assessments = RiskAssessmentSerializer(many=True, read_only=True)
    reports = InfringementReportSerializer(many=True, read_only=True)
    patent_detail = PatentBriefSerializer(source='patent', read_only=True)
    patent_portfolio_id = serializers.SerializerMethodField()

    class Meta:
        model = InfringementCase
        fields = '__all__'
        read_only_fields = ('id', 'case_number', 'created_at', 'updated_at', 'created_by')

    def get_patent_portfolio_id(self, obj):
        if obj.patent and obj.patent.portfolio_id:
            return str(obj.patent.portfolio_id)
        return None


class InfringementCaseListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views"""
    analyst = UserSerializer(read_only=True)
    assigned_attorney = UserSerializer(read_only=True)
    claim_mappings_count = serializers.SerializerMethodField()
    evidence_count = serializers.SerializerMethodField()
    patent_detail = PatentBriefSerializer(source='patent', read_only=True)

    class Meta:
        model = InfringementCase
        fields = [
            'id', 'case_name', 'case_number', 'status', 'analysis_type',
            'risk_level', 'patent_number', 'patent_title', 'accused_product_name',
            'accused_party_name', 'infringement_likelihood', 'confidence_level',
            'analyst', 'assigned_attorney', 'created_at', 'updated_at',
            'claim_mappings_count', 'evidence_count', 'patent', 'patent_detail'
        ]
        read_only_fields = ('id', 'case_number', 'created_at', 'updated_at')

    def get_claim_mappings_count(self, obj):
        return obj.claim_mappings.count()

    def get_evidence_count(self, obj):
        return obj.evidence.count()
