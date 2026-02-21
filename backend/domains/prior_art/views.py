"""
Prior Art Domain Views
Professional API views for prior art search and analysis
"""

from django.db.models import Q, Count, Avg, Sum
from django.utils import timezone
from rest_framework import status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.pagination import LimitOffsetPagination
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import FilterSet, CharFilter, DateFilter, ChoiceFilter

from .models import (
    PriorArtProject, PriorArtProjectMembership, TargetPatent, PatentClaim,
    ClaimElement, SearchSession, EvidenceItem, ClaimEvidenceMapping,
    PriorArtReport, PriorArtProjectType, PriorArtProjectStatus
)
from .serializers import (
    PriorArtProjectSerializer, PriorArtProjectListSerializer,
    CreatePriorArtProjectSerializer, PriorArtProjectStatisticsSerializer,
    PriorArtProjectMembershipSerializer, TargetPatentSerializer,
    TargetPatentListSerializer, PatentClaimSerializer, PatentClaimListSerializer,
    ClaimElementSerializer, SearchSessionSerializer, SearchSessionListSerializer,
    EvidenceItemSerializer, EvidenceItemListSerializer,
    ClaimEvidenceMappingSerializer, PriorArtReportSerializer,
    PriorArtReportListSerializer
)


class LargeResultsSetPagination(LimitOffsetPagination):
    """Custom pagination for large result sets"""
    default_limit = 20
    limit_query_param = 'page_size'
    max_limit = 500


class PriorArtProjectFilter(FilterSet):
    """Advanced filtering for prior art projects"""

    status = ChoiceFilter(choices=PriorArtProjectStatus.choices)
    project_type = ChoiceFilter(choices=PriorArtProjectType.choices)
    created_by = CharFilter(field_name='created_by__email', lookup_expr='icontains')
    assigned_to = CharFilter(field_name='assigned_to__email', lookup_expr='icontains')
    target_patent = CharFilter(field_name='target_patent_number', lookup_expr='icontains')
    created_after = DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = DateFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = PriorArtProject
        fields = ['status', 'project_type', 'created_by', 'assigned_to', 'target_patent']


class PriorArtProjectViewSet(ModelViewSet):
    """Main prior art project management viewset"""

    queryset = PriorArtProject.objects.select_related(
        'created_by', 'assigned_to', 'analytics_project'
    ).prefetch_related(
        'team_members', 'search_sessions', 'evidence_items', 'reports'
    )
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = LargeResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PriorArtProjectFilter
    search_fields = ['name', 'description', 'target_patent_number', 'target_patent_title']
    ordering_fields = ['name', 'created_at', 'updated_at', 'progress_percentage', 'status']
    ordering = ['-updated_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return PriorArtProjectListSerializer
        elif self.action == 'create':
            return CreatePriorArtProjectSerializer
        return PriorArtProjectSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by user's projects (owned, assigned, or team member)
        user = self.request.user
        if not user.is_staff:
            queryset = queryset.filter(
                Q(created_by=user) |
                Q(assigned_to=user) |
                Q(team_members=user)
            ).distinct()

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a prior art project"""
        project = self.get_object()
        new_name = request.data.get('name', f"{project.name} (Copy)")

        new_project = PriorArtProject.objects.create(
            name=new_name,
            description=project.description,
            project_type=project.project_type,
            target_patent_number=project.target_patent_number,
            target_patent_title=project.target_patent_title,
            target_jurisdiction=project.target_jurisdiction,
            search_objectives=project.search_objectives.copy() if project.search_objectives else {},
            geographic_scope=project.geographic_scope.copy() if project.geographic_scope else [],
            time_scope=project.time_scope.copy() if project.time_scope else {},
            technology_scope=project.technology_scope.copy() if project.technology_scope else {},
            created_by=request.user
        )

        # Copy team members
        for membership in project.priorartprojectmembership_set.all():
            PriorArtProjectMembership.objects.create(
                project=new_project,
                user=membership.user,
                role=membership.role
            )

        serializer = PriorArtProjectSerializer(new_project, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive a prior art project"""
        project = self.get_object()
        project.status = PriorArtProjectStatus.ARCHIVED
        project.save()

        serializer = self.get_serializer(project)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore an archived project"""
        project = self.get_object()
        project.status = PriorArtProjectStatus.DRAFT
        project.save()

        serializer = self.get_serializer(project)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update project status"""
        project = self.get_object()
        new_status = request.data.get('status')

        if new_status not in [choice[0] for choice in PriorArtProjectStatus.choices]:
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        project.status = new_status
        if new_status == PriorArtProjectStatus.COMPLETED:
            project.actual_completion_date = timezone.now().date()
        project.save()

        serializer = self.get_serializer(project)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_team_member(self, request, pk=None):
        """Add a team member to the project"""
        project = self.get_object()
        user_id = request.data.get('user_id')
        role = request.data.get('role', 'researcher')

        from django.contrib.auth import get_user_model
        User = get_user_model()

        try:
            user = User.objects.get(id=user_id)
            membership, created = PriorArtProjectMembership.objects.get_or_create(
                project=project,
                user=user,
                defaults={'role': role}
            )
            if not created:
                membership.role = role
                membership.save()

            serializer = PriorArtProjectMembershipSerializer(membership)
            return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def remove_team_member(self, request, pk=None):
        """Remove a team member from the project"""
        project = self.get_object()
        user_id = request.data.get('user_id')

        try:
            membership = PriorArtProjectMembership.objects.get(
                project=project,
                user_id=user_id
            )
            membership.delete()
            return Response({'message': 'Team member removed'}, status=status.HTTP_200_OK)
        except PriorArtProjectMembership.DoesNotExist:
            return Response(
                {'error': 'Team member not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def update_metrics(self, request, pk=None):
        """Manually trigger metrics update"""
        project = self.get_object()
        project.update_metrics()

        serializer = self.get_serializer(project)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get overall prior art project statistics"""
        queryset = self.get_queryset()

        total_projects = queryset.count()
        active_projects = queryset.filter(
            status__in=[PriorArtProjectStatus.ACTIVE, PriorArtProjectStatus.ANALYSIS]
        ).count()
        completed_projects = queryset.filter(status=PriorArtProjectStatus.COMPLETED).count()

        # By type counts
        by_type = {}
        for choice in PriorArtProjectType.choices:
            by_type[choice[0]] = queryset.filter(project_type=choice[0]).count()

        # By status counts
        by_status = {}
        for choice in PriorArtProjectStatus.choices:
            by_status[choice[0]] = queryset.filter(status=choice[0]).count()

        # Aggregate metrics
        total_searches = queryset.aggregate(total=Sum('total_searches'))['total'] or 0
        total_evidence = queryset.aggregate(total=Sum('selected_references'))['total'] or 0
        total_reports = PriorArtReport.objects.filter(project__in=queryset).count()
        avg_completion = queryset.aggregate(avg=Avg('progress_percentage'))['avg'] or 0

        statistics = {
            'total_projects': total_projects,
            'active_projects': active_projects,
            'completed_projects': completed_projects,
            'by_type': by_type,
            'by_status': by_status,
            'total_searches': total_searches,
            'total_evidence': total_evidence,
            'total_reports': total_reports,
            'average_completion_percentage': avg_completion
        }

        serializer = PriorArtProjectStatisticsSerializer(statistics)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update multiple projects"""
        updates = request.data.get('updates', [])
        updated_projects = []

        for update_data in updates:
            project_id = update_data.get('projectId')
            data = update_data.get('data', {})

            try:
                project = self.get_queryset().get(id=project_id)
                for key, value in data.items():
                    if hasattr(project, key):
                        setattr(project, key, value)
                project.save()
                updated_projects.append(project)
            except PriorArtProject.DoesNotExist:
                continue

        serializer = PriorArtProjectListSerializer(
            updated_projects, many=True, context={'request': request}
        )
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Bulk delete multiple projects"""
        project_ids = request.data.get('projectIds', [])
        deleted_count = self.get_queryset().filter(id__in=project_ids).delete()[0]

        return Response({'deleted_count': deleted_count}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    def bulk_archive(self, request):
        """Bulk archive multiple projects"""
        project_ids = request.data.get('projectIds', [])
        projects = self.get_queryset().filter(id__in=project_ids)
        projects.update(status=PriorArtProjectStatus.ARCHIVED)

        serializer = PriorArtProjectListSerializer(
            projects, many=True, context={'request': request}
        )
        return Response(serializer.data)


class TargetPatentViewSet(ModelViewSet):
    """Target patent management viewset"""

    serializer_class = TargetPatentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['analysis_status', 'jurisdiction']
    search_fields = ['patent_number', 'title', 'abstract']
    ordering_fields = ['patent_number', 'priority_date', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        project_id = self.kwargs.get('project_pk')
        if project_id:
            return TargetPatent.objects.filter(
                project_id=project_id
            ).prefetch_related('claims__elements')
        return TargetPatent.objects.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return TargetPatentListSerializer
        return TargetPatentSerializer

    @action(detail=True, methods=['post'])
    def analyze(self, request, project_pk=None, pk=None):
        """Trigger patent analysis"""
        target_patent = self.get_object()
        target_patent.analysis_status = 'analyzing'
        target_patent.save()

        # In production, this would trigger async analysis task
        # For now, just update status
        return Response({
            'message': 'Analysis started',
            'status': target_patent.analysis_status
        })


class PatentClaimViewSet(ModelViewSet):
    """Patent claim management viewset"""

    serializer_class = PatentClaimSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['claim_type', 'analysis_status']
    ordering_fields = ['claim_number', 'created_at']
    ordering = ['claim_number']

    def get_queryset(self):
        target_patent_id = self.kwargs.get('target_patent_pk')
        if target_patent_id:
            return PatentClaim.objects.filter(
                target_patent_id=target_patent_id
            ).prefetch_related('elements')
        return PatentClaim.objects.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return PatentClaimListSerializer
        return PatentClaimSerializer

    @action(detail=True, methods=['post'])
    def analyze(self, request, target_patent_pk=None, pk=None):
        """Trigger claim analysis"""
        claim = self.get_object()
        claim.analysis_status = 'analyzing'
        claim.save()

        return Response({
            'message': 'Claim analysis started',
            'status': claim.analysis_status
        })


class ClaimElementViewSet(ModelViewSet):
    """Claim element management viewset"""

    serializer_class = ClaimElementSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['primary_feature_type']
    ordering_fields = ['element_position', 'created_at']
    ordering = ['element_position']

    def get_queryset(self):
        claim_id = self.kwargs.get('claim_pk')
        if claim_id:
            return ClaimElement.objects.filter(claim_id=claim_id)
        return ClaimElement.objects.none()


class SearchSessionViewSet(ModelViewSet):
    """Search session management viewset"""

    serializer_class = SearchSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'search_purpose']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'completed_at']
    ordering = ['-created_at']

    def get_queryset(self):
        project_id = self.kwargs.get('project_pk')
        if project_id:
            return SearchSession.objects.filter(
                project_id=project_id
            ).select_related('created_by').prefetch_related('evidence_items')
        return SearchSession.objects.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return SearchSessionListSerializer
        return SearchSessionSerializer

    def perform_create(self, serializer):
        project_id = self.kwargs.get('project_pk')
        serializer.save(
            project_id=project_id,
            created_by=self.request.user
        )

    @action(detail=True, methods=['post'])
    def execute(self, request, project_pk=None, pk=None):
        """Execute search session"""
        session = self.get_object()
        session.status = 'running'
        session.save()

        # In production, this would trigger async search task
        return Response({
            'message': 'Search execution started',
            'status': session.status
        })

    @action(detail=True, methods=['post'])
    def cancel(self, request, project_pk=None, pk=None):
        """Cancel search session"""
        session = self.get_object()
        if session.status == 'running':
            session.status = 'cancelled'
            session.save()

        serializer = self.get_serializer(session)
        return Response(serializer.data)


class EvidenceItemViewSet(ModelViewSet):
    """Evidence item management viewset"""

    serializer_class = EvidenceItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = LargeResultsSetPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['evidence_type', 'relevance_level', 'analysis_status', 'is_relevant']
    search_fields = ['reference_id', 'title', 'abstract_summary', 'key_disclosure']
    ordering_fields = ['title', 'publication_date', 'legal_relevance_score', 'created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        project_id = self.kwargs.get('project_pk')
        if project_id:
            return EvidenceItem.objects.filter(
                project_id=project_id
            ).select_related('search_session', 'analyzed_by')
        return EvidenceItem.objects.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return EvidenceItemListSerializer
        return EvidenceItemSerializer

    @action(detail=True, methods=['post'])
    def mark_relevant(self, request, project_pk=None, pk=None):
        """Mark evidence as relevant"""
        evidence = self.get_object()
        evidence.is_relevant = True
        evidence.relevance_level = request.data.get('relevance_level', 'medium')
        evidence.save()

        serializer = self.get_serializer(evidence)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_primary(self, request, project_pk=None, pk=None):
        """Mark evidence as primary reference"""
        evidence = self.get_object()
        evidence.is_primary_reference = True
        evidence.is_relevant = True
        evidence.save()

        serializer = self.get_serializer(evidence)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_update_relevance(self, request, project_pk=None):
        """Bulk update relevance for multiple evidence items"""
        evidence_ids = request.data.get('evidenceIds', [])
        relevance_level = request.data.get('relevanceLevel')
        is_relevant = request.data.get('isRelevant', True)

        evidence_items = self.get_queryset().filter(id__in=evidence_ids)
        update_data = {'is_relevant': is_relevant}
        if relevance_level:
            update_data['relevance_level'] = relevance_level

        updated_count = evidence_items.update(**update_data)

        return Response({
            'message': f'Updated {updated_count} evidence items',
            'updated_count': updated_count
        })

    @action(detail=False, methods=['get'])
    def statistics(self, request, project_pk=None):
        """Get evidence statistics for the project"""
        queryset = self.get_queryset()

        stats = {
            'total_evidence': queryset.count(),
            'relevant_evidence': queryset.filter(is_relevant=True).count(),
            'primary_references': queryset.filter(is_primary_reference=True).count(),
            'by_type': {},
            'by_relevance': {},
            'by_analysis_status': {}
        }

        for choice in EvidenceItem.EVIDENCE_TYPE_CHOICES:
            stats['by_type'][choice[0]] = queryset.filter(evidence_type=choice[0]).count()

        for choice in EvidenceItem.RELEVANCE_LEVEL_CHOICES:
            stats['by_relevance'][choice[0]] = queryset.filter(relevance_level=choice[0]).count()

        for choice in EvidenceItem.ANALYSIS_STATUS_CHOICES:
            stats['by_analysis_status'][choice[0]] = queryset.filter(analysis_status=choice[0]).count()

        return Response(stats)


class ClaimEvidenceMappingViewSet(ModelViewSet):
    """Claim-evidence mapping management viewset"""

    serializer_class = ClaimEvidenceMappingSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['coverage_type', 'confidence_level']
    ordering_fields = ['coverage_percentage', 'created_at']
    ordering = ['-coverage_percentage']

    def get_queryset(self):
        evidence_id = self.kwargs.get('evidence_pk')
        if evidence_id:
            return ClaimEvidenceMapping.objects.filter(
                evidence_id=evidence_id
            ).select_related('claim', 'evidence', 'created_by')
        return ClaimEvidenceMapping.objects.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PriorArtReportViewSet(ModelViewSet):
    """Prior art report management viewset"""

    serializer_class = PriorArtReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['report_type', 'status', 'file_format']
    search_fields = ['title', 'description']
    ordering_fields = ['title', 'created_at', 'completed_at']
    ordering = ['-created_at']

    def get_queryset(self):
        project_id = self.kwargs.get('project_pk')
        if project_id:
            return PriorArtReport.objects.filter(
                project_id=project_id
            ).select_related('created_by')
        return PriorArtReport.objects.none()

    def get_serializer_class(self):
        if self.action == 'list':
            return PriorArtReportListSerializer
        return PriorArtReportSerializer

    def perform_create(self, serializer):
        project_id = self.kwargs.get('project_pk')
        serializer.save(
            project_id=project_id,
            created_by=self.request.user
        )

    @action(detail=True, methods=['post'])
    def generate(self, request, project_pk=None, pk=None):
        """Generate report"""
        report = self.get_object()
        report.status = 'generating'
        report.generation_progress = 0
        report.save()

        # In production, this would trigger async report generation
        return Response({
            'message': 'Report generation started',
            'status': report.status
        })

    @action(detail=True, methods=['get'])
    def download(self, request, project_pk=None, pk=None):
        """Download generated report"""
        report = self.get_object()

        if report.status != 'completed' or not report.file_path:
            return Response(
                {'error': 'Report not ready for download'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Return file URL for download
        return Response({'download_url': report.file_path.url})

    @action(detail=True, methods=['post'])
    def add_evidence(self, request, project_pk=None, pk=None):
        """Add evidence to report"""
        report = self.get_object()
        evidence_ids = request.data.get('evidence_ids', [])

        evidence_items = EvidenceItem.objects.filter(
            id__in=evidence_ids,
            project_id=project_pk
        )
        report.included_evidence.add(*evidence_items)

        serializer = self.get_serializer(report)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def remove_evidence(self, request, project_pk=None, pk=None):
        """Remove evidence from report"""
        report = self.get_object()
        evidence_ids = request.data.get('evidence_ids', [])

        evidence_items = EvidenceItem.objects.filter(id__in=evidence_ids)
        report.included_evidence.remove(*evidence_items)

        serializer = self.get_serializer(report)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def export_pdf(self, request, project_pk=None, pk=None):
        """Export prior art report as PDF"""
        from utils.export import export_prior_art_report_pdf

        report = self.get_object()
        project = report.project

        # Prepare data for export
        report_data = {
            'project_name': project.name,
            'report_type': report.get_report_type_display(),
            'target_patent': project.target_patent_number or 'N/A',
            'date_range': f"{project.time_scope.get('start', 'N/A')} - {project.time_scope.get('end', 'N/A')}" if project.time_scope else 'N/A',
            'total_references': project.total_results,
            'selected_references': project.selected_references,
            'evidence': [
                {
                    'reference_id': e.reference_id,
                    'publication_date': str(e.publication_date) if e.publication_date else '',
                    'evidence_type': e.get_evidence_type_display(),
                    'relevance_level': e.get_relevance_level_display(),
                    'title': e.title or ''
                }
                for e in report.included_evidence.all()
            ],
            'claim_mappings': [
                {
                    'claim_number': m.claim.claim_number if m.claim else '',
                    'reference_id': m.evidence.reference_id if m.evidence else '',
                    'coverage_percentage': m.coverage_percentage,
                    'analysis': m.legal_analysis or ''
                }
                for e in report.included_evidence.all()
                for m in e.claimevidencemapping_set.all()
            ]
        }

        return export_prior_art_report_pdf(report_data)

    @action(detail=True, methods=['get'])
    def export_excel(self, request, project_pk=None, pk=None):
        """Export prior art report as Excel"""
        from utils.export import export_prior_art_report_excel

        report = self.get_object()
        project = report.project

        # Prepare data for export
        report_data = {
            'project_name': project.name,
            'report_type': report.get_report_type_display(),
            'target_patent': project.target_patent_number or 'N/A',
            'date_range': f"{project.time_scope.get('start', 'N/A')} - {project.time_scope.get('end', 'N/A')}" if project.time_scope else 'N/A',
            'total_references': project.total_results,
            'selected_references': project.selected_references,
            'evidence': [
                {
                    'reference_id': e.reference_id,
                    'publication_date': str(e.publication_date) if e.publication_date else '',
                    'evidence_type': e.get_evidence_type_display(),
                    'relevance_level': e.get_relevance_level_display(),
                    'relevance_score': e.legal_relevance_score or '',
                    'title': e.title or '',
                    'summary': e.abstract_summary or ''
                }
                for e in report.included_evidence.all()
            ],
            'claim_mappings': [
                {
                    'claim_number': m.claim.claim_number if m.claim else '',
                    'reference_id': m.evidence.reference_id if m.evidence else '',
                    'coverage_type': m.get_coverage_type_display() if hasattr(m, 'get_coverage_type_display') else m.coverage_type,
                    'coverage_percentage': m.coverage_percentage,
                    'confidence': m.confidence_level,
                    'analysis': m.legal_analysis or ''
                }
                for e in report.included_evidence.all()
                for m in e.claimevidencemapping_set.all()
            ]
        }

        return export_prior_art_report_excel(report_data)
