"""
Document Download Views

REST API for crawl jobs, discovered links, and downloaded files.
"""

import logging
import os

from django.db.models import Count, Sum, Q
from django.http import FileResponse, Http404
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, filters, status, mixins
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import CrawlJob, DiscoveredLink, DownloadedFile
from .serializers import (
    CrawlJobCreateSerializer,
    CrawlJobListSerializer,
    CrawlJobDetailSerializer,
    DiscoveredLinkSerializer,
    DownloadedFileListSerializer,
    DownloadedFileDetailSerializer,
    BulkSelectSerializer,
)

logger = logging.getLogger(__name__)


class DocDownloadPagination(LimitOffsetPagination):
    default_limit = 50
    max_limit = 200


class CrawlJobViewSet(viewsets.ModelViewSet):
    """ViewSet for CrawlJob CRUD and crawl/download lifecycle."""

    queryset = CrawlJob.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['title', 'target_url']
    ordering_fields = ['created_at', 'updated_at', 'started_at', 'completed_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return CrawlJobListSerializer
        if self.action == 'create':
            return CrawlJobCreateSerializer
        return CrawlJobDetailSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def perform_destroy(self, instance):
        """Delete job and all associated files from disk."""
        for df in instance.downloaded_files.all():
            if df.file and hasattr(df.file, 'path') and os.path.exists(df.file.path):
                os.remove(df.file.path)
        instance.delete()

    # --- Crawl lifecycle actions ---

    @action(detail=True, methods=['post'])
    def start_crawl(self, request, pk=None):
        """Start or resume crawling."""
        job = self.get_object()
        resume = request.query_params.get('resume', 'false').lower() == 'true'

        if job.status not in ('pending', 'paused', 'failed', 'discovered'):
            return Response(
                {'error': f'Cannot start crawl from status: {job.status}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .tasks import crawl_website
        task = crawl_website.delay(str(job.pk), resume=resume)

        job.crawl_task_id = task.id
        job.status = 'crawling'
        if not job.started_at:
            job.started_at = timezone.now()
        job.save(update_fields=['crawl_task_id', 'status', 'started_at', 'updated_at'])

        return Response({
            'status': 'crawling',
            'task_id': task.id,
            'resume': resume,
        })

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pause an active crawl. The task will checkpoint state and exit."""
        job = self.get_object()

        if job.status != 'crawling':
            return Response(
                {'error': f'Cannot pause from status: {job.status}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        job.status = 'paused'
        job.paused_at = timezone.now()
        job.save(update_fields=['status', 'paused_at', 'updated_at'])

        return Response({'status': 'paused'})

    @action(detail=True, methods=['post'])
    def stop(self, request, pk=None):
        """Stop and cancel a crawl or download. Keeps discovered data."""
        job = self.get_object()

        if job.status not in ('crawling', 'paused', 'downloading'):
            return Response(
                {'error': f'Cannot stop from status: {job.status}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Revoke active Celery task
        from celery import current_app
        if job.status == 'crawling' and job.crawl_task_id:
            current_app.control.revoke(job.crawl_task_id, terminate=True)
        if job.status == 'downloading' and job.download_task_id:
            current_app.control.revoke(job.download_task_id, terminate=True)

        job.status = 'cancelled'
        job.save(update_fields=['status', 'updated_at'])

        return Response({'status': 'cancelled'})

    @action(detail=True, methods=['post'])
    def start_download(self, request, pk=None):
        """Start downloading selected files."""
        job = self.get_object()
        resume = request.query_params.get('resume', 'false').lower() == 'true'

        if job.status not in ('discovered', 'paused', 'failed', 'completed', 'cancelled'):
            return Response(
                {'error': f'Cannot start download from status: {job.status}'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        selected_count = job.links.filter(is_selected=True, is_downloaded=False).count()
        if selected_count == 0:
            return Response(
                {'error': 'No undownloaded selected links found.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .tasks import download_selected_files
        task = download_selected_files.delay(str(job.pk), resume=resume)

        job.download_task_id = task.id
        job.status = 'downloading'
        job.save(update_fields=['download_task_id', 'status', 'updated_at'])

        return Response({
            'status': 'downloading',
            'task_id': task.id,
            'files_to_download': selected_count,
        })

    # --- Data query actions ---

    @action(detail=True, methods=['get'])
    def progress(self, request, pk=None):
        """Return current job progress (polling endpoint)."""
        job = self.get_object()
        return Response({
            'status': job.status,
            'progress': job.progress,
            'started_at': job.started_at,
            'paused_at': job.paused_at,
            'completed_at': job.completed_at,
            'error_message': job.error_message,
        })

    @action(detail=True, methods=['get'])
    def links(self, request, pk=None):
        """Return paginated, filtered discovered links for this job."""
        job = self.get_object()
        queryset = DiscoveredLink.objects.filter(job=job)

        # Filtering
        category = request.query_params.get('category')
        if category:
            categories = [c.strip() for c in category.split(',')]
            queryset = queryset.filter(category__in=categories)

        is_selected = request.query_params.get('is_selected')
        if is_selected is not None:
            queryset = queryset.filter(is_selected=is_selected.lower() == 'true')

        is_downloaded = request.query_params.get('is_downloaded')
        if is_downloaded is not None:
            queryset = queryset.filter(is_downloaded=is_downloaded.lower() == 'true')

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(url__icontains=search) |
                Q(link_text__icontains=search) |
                Q(meta_description__icontains=search)
            )

        # Ordering
        ordering = request.query_params.get('ordering', '-discovered_at')
        allowed_ordering = ['discovered_at', '-discovered_at', 'file_size_bytes',
                            '-file_size_bytes', 'category', '-category', 'depth', '-depth']
        if ordering in allowed_ordering:
            queryset = queryset.order_by(ordering)

        # Pagination
        paginator = DocDownloadPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = DiscoveredLinkSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @action(detail=True, methods=['post'])
    def select_links(self, request, pk=None):
        """Bulk select/deselect links."""
        job = self.get_object()
        serializer = BulkSelectSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        queryset = DiscoveredLink.objects.filter(job=job)

        if data.get('select_all'):
            updated = queryset.update(is_selected=data['select'])
        elif data.get('link_ids'):
            updated = queryset.filter(id__in=data['link_ids']).update(is_selected=data['select'])
        elif data.get('categories'):
            updated = queryset.filter(category__in=data['categories']).update(is_selected=data['select'])
        else:
            updated = 0

        return Response({
            'updated': updated,
            'select': data['select'],
            'total_selected': queryset.filter(is_selected=True).count(),
        })

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Return aggregated statistics for the job."""
        job = self.get_object()

        links_qs = DiscoveredLink.objects.filter(job=job)

        # Category counts — single query with conditional aggregation
        category_counts = dict(
            links_qs.values_list('category')
            .annotate(count=Count('id'))
            .values_list('category', 'count')
        )

        # Aggregate stats
        agg = links_qs.aggregate(
            total_links=Count('id'),
            selected_count=Count('id', filter=Q(is_selected=True)),
            downloaded_count=Count('id', filter=Q(is_downloaded=True)),
            total_estimated_size=Sum('file_size_bytes', filter=Q(file_size_bytes__isnull=False)),
        )

        files_agg = DownloadedFile.objects.filter(job=job).aggregate(
            total_files=Count('id'),
            total_download_size=Sum('file_size'),
            rendered_pages=Count('id', filter=Q(is_rendered_page=True)),
        )

        return Response({
            'category_counts': category_counts,
            'total_links': agg['total_links'],
            'selected_count': agg['selected_count'],
            'downloaded_count': agg['downloaded_count'],
            'total_estimated_size': agg['total_estimated_size'] or 0,
            'total_files': files_agg['total_files'],
            'total_download_size': files_agg['total_download_size'] or 0,
            'rendered_pages': files_agg['rendered_pages'],
            'progress': job.progress,
        })


class DownloadedFileViewSet(
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """ViewSet for browsing and downloading files."""

    queryset = DownloadedFile.objects.select_related('link', 'job').all()
    permission_classes = [IsAuthenticated]
    pagination_class = DocDownloadPagination
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['job', 'category', 'is_rendered_page']
    search_fields = ['original_filename', 'extracted_text', 'link__title', 'link__url']
    ordering_fields = ['downloaded_at', 'file_size', 'category', 'access_count']
    ordering = ['-downloaded_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return DownloadedFileListSerializer
        return DownloadedFileDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Size range filters
        min_size = self.request.query_params.get('min_size')
        max_size = self.request.query_params.get('max_size')
        if min_size:
            queryset = queryset.filter(file_size__gte=int(min_size))
        if max_size:
            queryset = queryset.filter(file_size__lte=int(max_size))

        return queryset

    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download the actual file."""
        file_obj = self.get_object()
        file_obj.increment_access_count()

        if file_obj.file and hasattr(file_obj.file, 'path'):
            file_path = file_obj.file.path
            if os.path.exists(file_path):
                response = FileResponse(
                    open(file_path, 'rb'),
                    content_type=file_obj.mime_type or 'application/octet-stream',
                )
                response['Content-Disposition'] = f'attachment; filename="{file_obj.original_filename}"'
                return response

        if file_obj.file:
            return Response({'download_url': file_obj.file.url})

        raise Http404("File not found on disk.")

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Return inline preview of the file."""
        file_obj = self.get_object()

        if file_obj.mime_type and 'html' in file_obj.mime_type:
            # Return rendered HTML inline
            if file_obj.file and hasattr(file_obj.file, 'path') and os.path.exists(file_obj.file.path):
                response = FileResponse(
                    open(file_obj.file.path, 'rb'),
                    content_type='text/html',
                )
                response['Content-Disposition'] = 'inline'
                return response

        if file_obj.mime_type and 'pdf' in file_obj.mime_type:
            if file_obj.file and hasattr(file_obj.file, 'path') and os.path.exists(file_obj.file.path):
                response = FileResponse(
                    open(file_obj.file.path, 'rb'),
                    content_type='application/pdf',
                )
                response['Content-Disposition'] = 'inline'
                return response

        if file_obj.mime_type and file_obj.mime_type.startswith('image/'):
            if file_obj.file and hasattr(file_obj.file, 'path') and os.path.exists(file_obj.file.path):
                response = FileResponse(
                    open(file_obj.file.path, 'rb'),
                    content_type=file_obj.mime_type,
                )
                response['Content-Disposition'] = 'inline'
                return response

        # Fallback: return extracted text
        if file_obj.extracted_text:
            return Response({
                'type': 'text',
                'content': file_obj.extracted_text[:10000],
                'filename': file_obj.original_filename,
            })

        return Response(
            {'error': 'Preview not available for this file type.'},
            status=status.HTTP_404_NOT_FOUND,
        )
