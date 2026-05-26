"""
FCC Data Views
"""

import logging
import os

from django.db.models import Count, Min, Max, Q
from django.http import FileResponse, Http404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, status, mixins
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import FCCGrantee, FCCQueryJob, FCCAuthorization, FCCExportFile, FCCDocument
from .serializers import (
    FCCGranteeSerializer,
    FCCQueryJobCreateSerializer,
    FCCQueryJobListSerializer,
    FCCQueryJobDetailSerializer,
    FCCAuthorizationSerializer,
    FCCExportFileSerializer,
    FCCDocumentSerializer,
    FetchDocumentsRequestSerializer,
    DownloadDocumentsRequestSerializer,
    ExportRequestSerializer,
)

logger = logging.getLogger(__name__)


class FCCPagination(LimitOffsetPagination):
    default_limit = 50
    max_limit = 200


class FCCGranteeViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Search FCC grantees by name or code. Used for autocomplete."""

    queryset = FCCGrantee.objects.all()
    serializer_class = FCCGranteeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['grantee_name', 'grantee_code']
    ordering_fields = ['grantee_name', 'grantee_code']
    ordering = ['grantee_name']
    pagination_class = FCCPagination
    lookup_field = 'grantee_code'


class FCCQueryJobViewSet(viewsets.ModelViewSet):
    """ViewSet for FCC query jobs."""

    queryset = FCCQueryJob.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['query_type', 'status']
    search_fields = ['title', 'fcc_id']
    ordering_fields = ['created_at', 'results_count']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            return FCCQueryJobCreateSerializer
        if self.action == 'list':
            return FCCQueryJobListSerializer
        return FCCQueryJobDetailSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):
        # Delete export files from disk
        for export in instance.exports.all():
            if export.file and hasattr(export.file, 'path') and os.path.exists(export.file.path):
                os.remove(export.file.path)
        instance.delete()

    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """Kick off the FCC API query as a Celery task."""
        job = self.get_object()

        if job.status == 'running':
            return Response(
                {'error': 'Query is already running.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .tasks import execute_fcc_query
        from django.conf import settings as django_settings

        if getattr(django_settings, 'CELERY_TASK_ALWAYS_EAGER', False):
            # Synchronous execution in dev/test
            result = execute_fcc_query(str(job.pk))
            job.refresh_from_db()
            return Response({
                'status': job.status,
                'results_count': job.results_count,
            })

        try:
            task = execute_fcc_query.delay(str(job.pk))
            job.task_id = task.id
            job.status = 'running'
            job.save(update_fields=['task_id', 'status', 'updated_at'])
            return Response({
                'status': 'running',
                'task_id': task.id,
            })
        except Exception:
            # Celery not available — run synchronously as fallback
            execute_fcc_query(str(job.pk))
            job.refresh_from_db()
            return Response({
                'status': job.status,
                'results_count': job.results_count,
            })

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """Return paginated, filtered authorization results for this job."""
        job = self.get_object()
        queryset = FCCAuthorization.objects.filter(job=job)

        # Filters
        fcc_id = request.query_params.get('fcc_id')
        if fcc_id:
            queryset = queryset.filter(fcc_id__icontains=fcc_id)

        grantee_name = request.query_params.get('grantee_name')
        if grantee_name:
            queryset = queryset.filter(grantee_name__icontains=grantee_name)

        equipment_class = request.query_params.get('equipment_class')
        if equipment_class:
            queryset = queryset.filter(equipment_class=equipment_class)

        auth_status = request.query_params.get('status')
        if auth_status:
            queryset = queryset.filter(status=auth_status)

        q = request.query_params.get('q')
        if q:
            queryset = queryset.filter(
                Q(fcc_id__icontains=q) |
                Q(grantee_name__icontains=q) |
                Q(description__icontains=q)
            )

        # Additional filters
        application_purpose = request.query_params.get('application_purpose')
        if application_purpose:
            queryset = queryset.filter(application_purpose__icontains=application_purpose)

        emission_designator = request.query_params.get('emission_designator')
        if emission_designator:
            queryset = queryset.filter(emission_designator__icontains=emission_designator)

        description = request.query_params.get('description')
        if description:
            queryset = queryset.filter(description__icontains=description)

        freq_min_gte = request.query_params.get('freq_min_gte')
        if freq_min_gte:
            queryset = queryset.filter(freq_min__gte=freq_min_gte)

        freq_max_lte = request.query_params.get('freq_max_lte')
        if freq_max_lte:
            queryset = queryset.filter(freq_max__lte=freq_max_lte)

        power_min = request.query_params.get('power_min')
        if power_min:
            queryset = queryset.filter(power_output__gte=power_min)

        power_max = request.query_params.get('power_max')
        if power_max:
            queryset = queryset.filter(power_output__lte=power_max)

        city = request.query_params.get('city')
        if city:
            queryset = queryset.filter(city__icontains=city)

        state_filter = request.query_params.get('state')
        if state_filter:
            queryset = queryset.filter(state__iexact=state_filter)

        # Ordering
        ordering = request.query_params.get('ordering', '-created_at')
        allowed = ['fcc_id', '-fcc_id', 'grantee_name', '-grantee_name',
                    'grant_date', '-grant_date', 'freq_min', '-freq_min',
                    'created_at', '-created_at', 'equipment_class', '-equipment_class']
        if ordering in allowed:
            queryset = queryset.order_by(ordering)

        paginator = FCCPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = FCCAuthorizationSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @action(detail=True, methods=['post'])
    def export(self, request, pk=None):
        """Export query results as CSV, JSON, or PDF."""
        job = self.get_object()

        ser = ExportRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        fmt = ser.validated_data['format']

        queryset = FCCAuthorization.objects.filter(job=job).order_by('fcc_id', 'created_at')

        if queryset.count() == 0:
            return Response(
                {'error': 'No results to export. Run the query first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from . import exporters
        if fmt == 'csv':
            export_file = exporters.export_csv(job, queryset)
        elif fmt == 'json':
            export_file = exporters.export_json(job, queryset)
        elif fmt == 'pdf':
            export_file = exporters.export_pdf(job, queryset)
        else:
            return Response({'error': 'Invalid format'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(FCCExportFileSerializer(export_file).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def remove_results(self, request, pk=None):
        """Remove specific authorization results from a query job."""
        job = self.get_object()

        result_ids = request.data.get('result_ids', [])
        fcc_ids = request.data.get('fcc_ids', [])

        if not result_ids and not fcc_ids:
            return Response(
                {'error': 'Provide result_ids (list of UUIDs) or fcc_ids (list of FCC ID strings).'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = FCCAuthorization.objects.filter(job=job)

        if result_ids:
            deleted, _ = queryset.filter(id__in=result_ids).delete()
        elif fcc_ids:
            deleted, _ = queryset.filter(fcc_id__in=fcc_ids).delete()
        else:
            deleted = 0

        # Update job results count
        job.results_count = FCCAuthorization.objects.filter(job=job).count()
        job.save(update_fields=['results_count', 'updated_at'])

        return Response({
            'deleted': deleted,
            'remaining': job.results_count,
        })

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Return summary statistics for the job's results."""
        job = self.get_object()
        qs = FCCAuthorization.objects.filter(job=job)

        # Equipment class distribution
        class_counts = dict(
            qs.values_list('equipment_class')
            .annotate(count=Count('id'))
            .values_list('equipment_class', 'count')
        )

        # Status distribution
        status_counts = dict(
            qs.values_list('status')
            .annotate(count=Count('id'))
            .values_list('status', 'count')
        )

        # Unique grantees
        unique_grantees = qs.values('grantee_name').distinct().count()

        # Frequency range
        freq_range = qs.aggregate(
            min_freq=Min('freq_min'),
            max_freq=Max('freq_max'),
        )

        # Application purpose distribution
        purpose_counts = dict(
            qs.exclude(application_purpose='')
            .values_list('application_purpose')
            .annotate(count=Count('id'))
            .values_list('application_purpose', 'count')
        )

        return Response({
            'total_records': job.results_count,
            'unique_grantees': unique_grantees,
            'equipment_class_counts': class_counts,
            'status_counts': status_counts,
            'purpose_counts': purpose_counts,
            'freq_min': str(freq_range['min_freq']) if freq_range['min_freq'] else None,
            'freq_max': str(freq_range['max_freq']) if freq_range['max_freq'] else None,
        })

    # --- Document actions ---

    @action(detail=True, methods=['post'])
    def fetch_documents(self, request, pk=None):
        """Discover exhibits for an FCC ID from fccid.io."""
        job = self.get_object()
        ser = FetchDocumentsRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        fcc_id = ser.validated_data['fcc_id']

        from .tasks import fetch_fcc_documents

        try:
            result = fetch_fcc_documents(str(job.pk), fcc_id)
            return Response(result)
        except Exception as e:
            return Response(
                {'error': str(e)[:500]},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=['get'])
    def documents(self, request, pk=None):
        """List discovered documents for this job."""
        job = self.get_object()
        queryset = FCCDocument.objects.filter(job=job)

        fcc_id = request.query_params.get('fcc_id')
        if fcc_id:
            queryset = queryset.filter(fcc_id=fcc_id)

        document_type = request.query_params.get('document_type')
        if document_type:
            queryset = queryset.filter(document_type=document_type)

        is_downloaded = request.query_params.get('is_downloaded')
        if is_downloaded is not None:
            queryset = queryset.filter(is_downloaded=is_downloaded.lower() == 'true')

        paginator = FCCPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = FCCDocumentSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @action(detail=True, methods=['post'])
    def download_documents(self, request, pk=None):
        """Download selected FCC documents."""
        job = self.get_object()
        ser = DownloadDocumentsRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        # Determine which document IDs to download
        doc_ids = None
        if data.get('document_ids'):
            doc_ids = [str(d) for d in data['document_ids']]
        elif data.get('fcc_id'):
            doc_ids = list(
                FCCDocument.objects.filter(
                    job=job, fcc_id=data['fcc_id'], is_downloaded=False
                ).values_list('id', flat=True)
            )
            doc_ids = [str(d) for d in doc_ids]
        elif data.get('all'):
            doc_ids = list(
                FCCDocument.objects.filter(
                    job=job, is_downloaded=False
                ).values_list('id', flat=True)
            )
            doc_ids = [str(d) for d in doc_ids]

        if not doc_ids:
            return Response({'error': 'No documents to download.'}, status=status.HTTP_400_BAD_REQUEST)

        from .tasks import download_fcc_documents

        try:
            result = download_fcc_documents(str(job.pk), doc_ids)
            return Response(result)
        except Exception as e:
            return Response(
                {'error': str(e)[:500]},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class FCCDocumentViewSet(
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """ViewSet for downloading individual FCC documents."""

    queryset = FCCDocument.objects.all()
    serializer_class = FCCDocumentSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download an individual FCC document file."""
        doc = self.get_object()

        if doc.file and hasattr(doc.file, 'path') and os.path.exists(doc.file.path):
            response = FileResponse(
                open(doc.file.path, 'rb'),
                content_type=doc.mime_type or 'application/octet-stream',
            )
            response['Content-Disposition'] = f'attachment; filename="{doc.original_filename}"'
            return response

        raise Http404("Document file not found on disk.")


class FCCExportFileViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """ViewSet for browsing and downloading export files."""

    queryset = FCCExportFile.objects.select_related('job').all()
    serializer_class = FCCExportFileSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['job', 'format']
    ordering = ['-created_at']

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download the exported file."""
        export = self.get_object()

        if export.file and hasattr(export.file, 'path') and os.path.exists(export.file.path):
            content_types = {
                'csv': 'text/csv',
                'json': 'application/json',
                'pdf': 'application/pdf',
            }
            response = FileResponse(
                open(export.file.path, 'rb'),
                content_type=content_types.get(export.format, 'application/octet-stream'),
            )
            response['Content-Disposition'] = f'attachment; filename="{export.filename}"'
            return response

        raise Http404("Export file not found on disk.")
