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
    EvidenceScreenshot,
    RiskAssessment,
    DamagesAnalysis,
    ExpertOpinion,
    LitigationStrategy,
    InfringementReport
)


def _screenshot_briefs(obj, request=None):
    """Lightweight briefs of the screenshots mapped to a claim element (reverse M2M)."""
    briefs = []
    for s in obj.screenshots.all():
        url = s.image.url if s.image else ''
        if request and url:
            url = request.build_absolute_uri(url)
        briefs.append({
            'id': str(s.id),
            'image': url,
            'page_number': s.page_number,
            'caption': s.caption,
            # provenance: which PDF + which region on the page the crop came from.
            'evidence_id': str(s.evidence_id),
            'evidence_title': s.evidence.title if s.evidence_id else '',
            'evidence_url': (s.evidence.url or '') if s.evidence_id else '',
            'bbox': {'x': s.bbox_x, 'y': s.bbox_y, 'width': s.bbox_width, 'height': s.bbox_height},
            'annotations': s.annotations or [],
            # all elements this screenshot maps to — lets the UI unmap from one vs delete.
            'claim_elements': [str(e_id) for e_id in s.claim_elements.values_list('id', flat=True)],
        })
    return briefs


def _evidence_briefs(ids):
    """Resolve a list of Evidence IDs into lightweight display briefs, order-preserved."""
    if not ids:
        return []
    rows = Evidence.objects.filter(id__in=ids).values(
        'id', 'title', 'evidence_type', 'url', 'file'
    )
    by_id = {str(r['id']): r for r in rows}
    briefs = []
    for i in ids:
        r = by_id.get(str(i))
        if r:
            briefs.append({
                'id': str(r['id']),
                'title': r['title'],
                'evidence_type': r['evidence_type'],
                'url': r['url'] or '',
                'has_file': bool(r['file']),
            })
    return briefs


class ClaimElementSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    linked_evidence = serializers.SerializerMethodField()
    screenshots = serializers.SerializerMethodField()

    class Meta:
        model = ClaimElement
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')

    def get_linked_evidence(self, obj):
        return _evidence_briefs(obj.evidence_references or [])

    def get_screenshots(self, obj):
        return _screenshot_briefs(obj, self.context.get('request'))


class ClaimMappingSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    elements = ClaimElementSerializer(many=True, read_only=True)
    linked_evidence = serializers.SerializerMethodField()

    class Meta:
        model = ClaimMapping
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'created_by')

    def get_linked_evidence(self, obj):
        return _evidence_briefs(obj.evidence_references or [])


class EvidenceSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)

    class Meta:
        model = Evidence
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at', 'uploaded_by')


class EvidenceScreenshotSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    claim_element_labels = serializers.SerializerMethodField()

    class Meta:
        model = EvidenceScreenshot
        fields = '__all__'
        # case is derived from evidence server-side; claim_elements is writable (M2M).
        read_only_fields = ('id', 'created_at', 'created_by', 'case')

    def get_claim_element_labels(self, obj):
        return [
            {
                'id': str(el.id),
                'label': f"{el.claim_mapping.claim_number}.{el.element_order}",
            }
            for el in obj.claim_elements.select_related('claim_mapping').all()
        ]


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
    # Assignees (list of names) — lets the UI sanity-check that a live USPTO lookup
    # actually matches this patent before showing/applying enrichment.
    assignees = serializers.JSONField(read_only=True, required=False)
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
