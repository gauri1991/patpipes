"""
API Views for Patent Portfolio Management
"""

from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Sum
from django.shortcuts import get_object_or_404
from .models import Portfolio, PortfolioAccess, Patent, ODPImportJob, ClassificationDefinition
from .serializers import (
    PortfolioSerializer, PortfolioListSerializer,
    PortfolioAccessSerializer, PatentSerializer,
    PatentListSerializer, UserPortfolioAccessSerializer,
    ClassificationDefinitionSerializer,
)
from .tasks import build_odp_query_body, start_import_job, fetch_odp_count


class PortfolioViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing patent portfolios
    """
    serializer_class = PortfolioSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Filter portfolios based on user access
        """
        user = self.request.user
        
        # Admin sees all portfolios
        if user.role in ['admin', 'manager']:
            return Portfolio.objects.all()
        
        # Others see only their accessible portfolios
        return Portfolio.objects.filter(
            Q(owner=user) | 
            Q(users=user) |
            Q(organization__users=user)
        ).distinct()
    
    def get_serializer_class(self):
        """Use lightweight serializer for list action"""
        if self.action == 'list':
            return PortfolioListSerializer
        return PortfolioSerializer
    
    def perform_create(self, serializer):
        """Set owner when creating portfolio, auto-fetch ODP count."""
        portfolio = serializer.save(owner=self.request.user)
        # Fire-and-forget ODP count fetch in background thread
        if portfolio.company_name:
            import threading
            def _fetch(pid, company):
                count = fetch_odp_count(company)
                if count is not None:
                    Portfolio.objects.filter(id=pid).update(estimated_odp_count=count)
            threading.Thread(target=_fetch, args=[portfolio.id, portfolio.company_name], daemon=True).start()

    @action(detail=True, methods=['post'], url_path='refresh-odp-count')
    def refresh_odp_count(self, request, pk=None):
        """Re-fetch estimated ODP patent count for this portfolio."""
        portfolio = self.get_object()
        if not portfolio.company_name:
            return Response({'error': 'No company_name set'}, status=status.HTTP_400_BAD_REQUEST)
        count = fetch_odp_count(portfolio.company_name)
        if count is not None:
            portfolio.estimated_odp_count = count
            portfolio.save(update_fields=['estimated_odp_count'])
            return Response({'estimated_odp_count': count})
        return Response({'error': 'Failed to fetch from ODP'}, status=status.HTTP_502_BAD_GATEWAY)

    @action(detail=False, methods=['get'])
    def user_access(self, request):
        """
        Get user's portfolio access information
        Returns portfolio count and list for the portfolio selector
        """
        user = request.user
        portfolios = self.get_queryset()
        
        # Get user's default portfolio (if set in user profile)
        default_portfolio = getattr(user, 'default_portfolio_id', None)
        
        data = {
            'portfolio_count': portfolios.count(),
            'portfolios': PortfolioListSerializer(portfolios, many=True).data,
            'default_portfolio': default_portfolio
        }
        
        return Response(data)
    
    @action(detail=True, methods=['get'])
    def metrics(self, request, pk=None):
        """
        Get detailed metrics for a specific portfolio
        """
        portfolio = self.get_object()
        
        # Calculate metrics
        patents = portfolio.patents.all()
        # Infringement summary for this portfolio's patents
        from domains.infringement.models import InfringementCase
        patent_ids = list(patents.values_list('id', flat=True))
        patent_numbers = list(patents.exclude(patent_number__isnull=True).values_list('patent_number', flat=True))
        infringement_cases = InfringementCase.objects.filter(
            Q(patent_id__in=patent_ids) |
            Q(patent_number__in=patent_numbers)
        ).distinct()

        metrics = {
            'total_patents': patents.count(),
            'by_status': list(patents.values('status').annotate(count=Count('id'))),
            'by_type': list(patents.values('patent_type').annotate(count=Count('id'))),
            'total_value': patents.aggregate(Sum('estimated_value'))['estimated_value__sum'] or 0,
            'total_maintenance': patents.aggregate(Sum('maintenance_cost'))['maintenance_cost__sum'] or 0,
            'by_technology': list(patents.values('technology_area').annotate(count=Count('id')).order_by('-count')[:10]),
            'recent_filings': PatentListSerializer(
                patents.filter(filing_date__isnull=False).order_by('-filing_date')[:5],
                many=True
            ).data,
            'expiring_soon': PatentListSerializer(
                patents.filter(
                    expiry_date__isnull=False,
                    status='granted'
                ).order_by('expiry_date')[:5],
                many=True
            ).data,
            'infringement_summary': {
                'total_cases': infringement_cases.count(),
                'active_cases': infringement_cases.filter(status='active').count(),
                'high_risk_cases': infringement_cases.filter(risk_level__in=['high', 'critical']).count(),
            },
        }

        return Response(metrics)
    
    @action(detail=True, methods=['post'])
    def update_metrics(self, request, pk=None):
        """
        Trigger portfolio metrics update
        """
        portfolio = self.get_object()
        
        # Update cached metrics
        patents = portfolio.patents.all()
        portfolio.total_patents = patents.count()
        portfolio.active_patents = patents.filter(status='granted').count()
        portfolio.pending_patents = patents.filter(status__in=['filed', 'pending']).count()
        portfolio.expired_patents = patents.filter(status='expired').count()
        
        # Update financial metrics
        portfolio.total_value = patents.aggregate(Sum('estimated_value'))['estimated_value__sum'] or 0
        portfolio.annual_maintenance_cost = patents.filter(
            status='granted'
        ).aggregate(Sum('maintenance_cost'))['maintenance_cost__sum'] or 0
        
        portfolio.save()
        
        return Response(PortfolioSerializer(portfolio).data)
    
    @action(detail=True, methods=['get', 'post'])
    def access(self, request, pk=None):
        """
        Manage user access to portfolio
        """
        portfolio = self.get_object()
        
        if request.method == 'GET':
            # Get all users with access
            access_list = PortfolioAccess.objects.filter(portfolio=portfolio)
            return Response(PortfolioAccessSerializer(access_list, many=True).data)
        
        elif request.method == 'POST':
            # Grant access to a user
            user_id = request.data.get('user_id')
            access_level = request.data.get('access_level', 'viewer')
            
            if not user_id:
                return Response(
                    {'error': 'user_id is required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if requesting user can manage access
            if not (request.user == portfolio.owner or 
                    request.user.role in ['admin', 'manager'] or
                    PortfolioAccess.objects.filter(
                        portfolio=portfolio,
                        user=request.user,
                        can_manage_users=True
                    ).exists()):
                return Response(
                    {'error': 'You do not have permission to manage access'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Create or update access
            access, created = PortfolioAccess.objects.update_or_create(
                portfolio=portfolio,
                user_id=user_id,
                defaults={
                    'access_level': access_level,
                    'granted_by': request.user,
                    'can_view': True,
                    'can_edit': access_level in ['editor', 'manager', 'owner'],
                    'can_delete': access_level in ['manager', 'owner'],
                    'can_manage_users': access_level in ['manager', 'owner']
                }
            )
            
            return Response(
                PortfolioAccessSerializer(access).data,
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )


class PatentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing patents within portfolios
    """
    serializer_class = PatentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'patent_type', 'portfolio']
    search_fields = ['title', 'patent_number', 'application_number', 'technology_area']
    ordering_fields = ['filing_date', 'created_at', 'title', 'status', 'estimated_value']
    ordering = ['-filing_date']

    def get_queryset(self):
        """
        Filter patents based on portfolio access
        """
        user = self.request.user
        portfolio_id = self.request.query_params.get('portfolio')

        # Start with patents user has access to
        if user.role in ['admin', 'manager']:
            queryset = Patent.objects.all()
        else:
            # Get accessible portfolios
            accessible_portfolios = Portfolio.objects.filter(
                Q(owner=user) |
                Q(users=user) |
                Q(organization__users=user)
            ).distinct()
            queryset = Patent.objects.filter(portfolio__in=accessible_portfolios)

        # Filter by specific portfolio if provided
        if portfolio_id:
            queryset = queryset.filter(portfolio_id=portfolio_id)

        # Text search via 'search' query param (in addition to DRF SearchFilter)
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(patent_number__icontains=search) |
                Q(application_number__icontains=search) |
                Q(technology_area__icontains=search)
            )

        # Filter by assignee (matches any element in the JSON array)
        assignee = self.request.query_params.get('assignee')
        if assignee:
            queryset = queryset.filter(assignees__contains=[assignee])

        return queryset
    
    def get_serializer_class(self):
        """Use lightweight serializer for list action"""
        if self.action == 'list':
            return PatentListSerializer
        return PatentSerializer
    
    @action(detail=True, methods=['get'])
    def infringement_cases(self, request, pk=None):
        """
        Get infringement cases linked to this patent (via FK or patent_number match).
        """
        from domains.infringement.models import InfringementCase
        from domains.infringement.serializers import InfringementCaseListSerializer

        patent = self.get_object()
        cases = InfringementCase.objects.filter(
            Q(patent=patent) |
            Q(patent_number=patent.patent_number)
        ).distinct().select_related('analyst', 'assigned_attorney')

        serializer = InfringementCaseListSerializer(cases, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='assignee-groups')
    def assignee_groups(self, request):
        """Return distinct assignees with patent counts for a portfolio."""
        portfolio_id = request.query_params.get('portfolio')
        if not portfolio_id:
            return Response({'error': 'portfolio query param required'}, status=status.HTTP_400_BAD_REQUEST)

        from django.db.models import Value
        from django.db.models.functions import JSONObject
        import json

        queryset = self.get_queryset().filter(portfolio_id=portfolio_id)

        # Use raw SQL for JSON array unnesting (PostgreSQL)
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT elem::text, COUNT(*) as cnt
                FROM patents,
                     jsonb_array_elements(assignees) AS elem
                WHERE portfolio_id = %s
                GROUP BY elem::text
                ORDER BY cnt DESC
            """, [portfolio_id])
            rows = cursor.fetchall()

        groups = []
        for raw_val, count in rows:
            # raw_val is JSON-encoded string like '"Apple Inc."'
            try:
                val = json.loads(raw_val)
            except (json.JSONDecodeError, TypeError):
                val = raw_val
            if val:  # skip empty strings
                groups.append({'assignee': val, 'count': count})

        return Response({'groups': groups, 'total_patents': queryset.count()})

    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        """Delete multiple patents by IDs or by assignee filter."""
        patent_ids = request.data.get('patent_ids', [])
        assignee = request.data.get('assignee')
        portfolio_id = request.data.get('portfolio_id')

        queryset = self.get_queryset()
        if portfolio_id:
            queryset = queryset.filter(portfolio_id=portfolio_id)

        if patent_ids:
            to_delete = queryset.filter(id__in=patent_ids)
        elif assignee:
            to_delete = queryset.filter(assignees__contains=[assignee])
        else:
            return Response({'error': 'patent_ids or assignee required'}, status=status.HTTP_400_BAD_REQUEST)

        count = to_delete.count()
        to_delete.delete()
        return Response({'deleted': count})

    @action(detail=False, methods=['get'])
    def by_portfolio(self, request):
        """
        Get patents grouped by portfolio
        """
        user = request.user
        portfolio_id = request.query_params.get('portfolio_id')
        
        if not portfolio_id:
            return Response(
                {'error': 'portfolio_id is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check access
        portfolio = get_object_or_404(Portfolio, id=portfolio_id)
        if not (user.role in ['admin', 'manager'] or
                portfolio.owner == user or
                portfolio.users.filter(id=user.id).exists() or
                portfolio.organization and portfolio.organization.users.filter(id=user.id).exists()):
            return Response(
                {'error': 'You do not have access to this portfolio'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        patents = Patent.objects.filter(portfolio=portfolio)
        return Response(PatentListSerializer(patents, many=True).data)

    @action(detail=True, methods=['post'])
    def enrich_from_odp(self, request, pk=None):
        """
        Enrich a patent with data from the USPTO Open Data Portal.
        Calls ODP application, continuity, foreign-priority, and term-adjustment endpoints.
        """
        patent = self.get_object()
        app_num = patent.application_number or ''
        if not app_num:
            return Response(
                {'error': 'Patent has no application_number for ODP lookup'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from domains.analytics.uspto_odp_service import USPTOODPClient, USPTOODPDetailService, USPTOODPError
        try:
            svc = USPTOODPDetailService(USPTOODPClient())
            enrichment = {}

            try:
                enrichment['application'] = svc.get_application(app_num)
            except USPTOODPError:
                enrichment['application'] = None

            try:
                enrichment['continuity'] = svc.get_continuity(app_num)
            except USPTOODPError:
                enrichment['continuity'] = None

            try:
                enrichment['foreign_priority'] = svc.get_foreign_priority(app_num)
            except USPTOODPError:
                enrichment['foreign_priority'] = None

            try:
                enrichment['term_adjustment'] = svc.get_term_adjustment(app_num)
            except USPTOODPError:
                enrichment['term_adjustment'] = None

            return Response({
                'patent_id': str(patent.id),
                'application_number': app_num,
                'enrichment': enrichment,
            })
        except Exception as exc:
            return Response(
                {'error': f'ODP enrichment failed: {exc}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

    @action(detail=False, methods=['post'], url_path='search-odp')
    def search_odp(self, request):
        """Search USPTO ODP for patents by assignee, keywords, etc. without saving."""
        from domains.analytics.patent_search_service import PatentSearchError

        assignee = (request.data.get('assignee') or '').strip()
        keywords = (request.data.get('keywords') or '').strip()
        inventor = (request.data.get('inventor') or '').strip()
        title = (request.data.get('title') or '').strip()
        application_number = (request.data.get('application_number') or '').strip()

        if not application_number and not assignee and not keywords and not inventor and not title:
            return Response(
                {'error': 'At least one search field is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        offset = int(request.data.get('offset', 0))
        limit = min(int(request.data.get('limit', 100)), 100)

        search_params = {
            'assignee': assignee, 'keywords': keywords, 'inventor': inventor,
            'title': title, 'application_number': application_number,
            'status': (request.data.get('status') or '').strip(),
            'app_type': (request.data.get('app_type') or '').strip(),
            'date_from': request.data.get('date_from') or '',
            'date_to': request.data.get('date_to') or '',
        }
        body = build_odp_query_body(search_params, offset=offset, limit=limit)

        try:
            from domains.analytics.patent_search_service import USPTOOpenDataAPI
            api = USPTOOpenDataAPI()

            data = api.client.post('/patent/applications/search', body)
            if data is None:
                return Response({'results': [], 'total': 0, 'offset': offset, 'limit': limit})

            raw_results = data.get('patentFileWrapperDataBag', data.get('patentApplications', []))
            total = data.get('count', data.get('recordTotalQuantity', len(raw_results)))
            results = [api._normalize_odp_result(r) for r in raw_results]

            # Serialize dates and add type/status fields
            for r in results:
                for key in ('application_date', 'publication_date', 'priority_date'):
                    if r.get(key):
                        r[key] = r[key].isoformat()
                raw = r.get('raw_data', {})
                meta = raw.get('applicationMetaData', {})
                r['application_type'] = meta.get('applicationTypeCategory', '')
                r['application_status'] = meta.get('applicationStatusDescriptionText', '')
                cpc_bag = meta.get('cpcClassificationBag', [])
                if cpc_bag and not r.get('cpc_classes'):
                    r['cpc_classes'] = [c if isinstance(c, str) else c.get('cpcClassificationText', '') for c in cpc_bag]
                r.pop('raw_data', None)

            return Response({
                'results': results,
                'total': total,
                'offset': offset,
                'limit': limit,
            })
        except (PatentSearchError, Exception) as exc:
            return Response(
                {'error': str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )

    @action(detail=False, methods=['post'], url_path='import-from-odp')
    def import_from_odp(self, request):
        """Bulk-create patents from ODP search results into a portfolio."""
        portfolio_id = request.data.get('portfolio_id')
        patents_data = request.data.get('patents') or []

        if not portfolio_id:
            return Response(
                {'error': 'portfolio_id is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not patents_data:
            return Response(
                {'error': 'patents list is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        portfolio = get_object_or_404(Portfolio, id=portfolio_id)

        created_ids = []
        skipped = 0

        for p in patents_data:
            app_num = (p.get('application_number') or '').strip()
            if not app_num:
                skipped += 1
                continue

            # Dedup: skip if application_number already exists in this portfolio
            if Patent.objects.filter(application_number=app_num, portfolio=portfolio).exists():
                skipped += 1
                continue

            # Also skip if application_number exists globally (unique constraint)
            if Patent.objects.filter(application_number=app_num).exists():
                skipped += 1
                continue

            filing_date = p.get('application_date') or p.get('filing_date') or None
            inventors = p.get('inventors') or []
            assignee = p.get('assignee') or ''

            patent = Patent.objects.create(
                portfolio=portfolio,
                title=p.get('title', 'Untitled'),
                application_number=app_num,
                patent_number=p.get('publication_number') or None,
                status='pending',
                patent_type='utility',
                filing_date=filing_date,
                inventors=inventors,
                assignees=[assignee] if assignee else [],
                abstract=p.get('abstract', ''),
                ipc_classifications=p.get('ipc_classes') or [],
                technology_area='',
            )
            created_ids.append(str(patent.id))

        return Response({
            'created': len(created_ids),
            'skipped': skipped,
            'patents': created_ids,
        }, status=status.HTTP_201_CREATED if created_ids else status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='start-odp-import')
    def start_odp_import(self, request):
        """Start a background ODP import job."""
        portfolio_id = request.data.get('portfolio_id')
        search_params = request.data.get('search_params', {})
        total = int(request.data.get('total', 0))
        selected_patents_data = request.data.get('selected_patents_data', [])

        if not portfolio_id:
            return Response({'error': 'portfolio_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        portfolio = get_object_or_404(Portfolio, id=portfolio_id)

        page_size = min(int(request.data.get('page_size', 100)), 100)
        import_fields = request.data.get('import_fields', [])

        job = ODPImportJob.objects.create(
            portfolio=portfolio,
            created_by=request.user,
            search_params=search_params,
            selected_patents_data=selected_patents_data,
            total_expected=total,
            page_size=page_size,
            import_fields=import_fields,
        )

        start_import_job(job.id)

        return Response({
            'job_id': str(job.id),
            'status': job.status,
            'total_expected': job.total_expected,
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='odp-import-status')
    def odp_import_status(self, request):
        """Get recent ODP import jobs for a portfolio."""
        portfolio_id = request.query_params.get('portfolio_id')
        if not portfolio_id:
            return Response({'error': 'portfolio_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        jobs = ODPImportJob.objects.filter(portfolio_id=portfolio_id)[:5]
        jobs_data = [
            {
                'id': str(j.id),
                'status': j.status,
                'total_expected': j.total_expected,
                'processed': j.processed,
                'created_count': j.created_count,
                'skipped_count': j.skipped_count,
                'page_size': j.page_size,
                'error_message': j.error_message,
                'created_at': j.created_at.isoformat(),
                'completed_at': j.completed_at.isoformat() if j.completed_at else None,
            }
            for j in jobs
        ]

        return Response({'jobs': jobs_data})

    @action(detail=False, methods=['post'], url_path='odp-import-pause')
    def odp_import_pause(self, request):
        """Pause a running ODP import job."""
        job_id = request.data.get('job_id')
        if not job_id:
            return Response({'error': 'job_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        job = get_object_or_404(ODPImportJob, id=job_id)
        if job.status != 'running':
            return Response({'error': f'Cannot pause job in status: {job.status}'}, status=status.HTTP_400_BAD_REQUEST)
        job.status = 'paused'
        job.save(update_fields=['status'])
        return Response({'id': str(job.id), 'status': job.status})

    @action(detail=False, methods=['post'], url_path='odp-import-resume')
    def odp_import_resume(self, request):
        """Resume a paused ODP import job."""
        job_id = request.data.get('job_id')
        if not job_id:
            return Response({'error': 'job_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        job = get_object_or_404(ODPImportJob, id=job_id)
        if job.status != 'paused':
            return Response({'error': f'Cannot resume job in status: {job.status}'}, status=status.HTTP_400_BAD_REQUEST)
        job.status = 'running'
        job.save(update_fields=['status'])
        return Response({'id': str(job.id), 'status': job.status})

    @action(detail=False, methods=['post'], url_path='odp-import-cancel')
    def odp_import_cancel(self, request):
        """Cancel a running or paused ODP import job."""
        job_id = request.data.get('job_id')
        if not job_id:
            return Response({'error': 'job_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        job = get_object_or_404(ODPImportJob, id=job_id)
        if job.status not in ('running', 'paused', 'pending'):
            return Response({'error': f'Cannot cancel job in status: {job.status}'}, status=status.HTTP_400_BAD_REQUEST)
        job.status = 'cancelled'
        job.save(update_fields=['status'])
        return Response({'id': str(job.id), 'status': job.status})

    @action(detail=False, methods=['post'], url_path='odp-import-restart')
    def odp_import_restart(self, request):
        """Restart a stuck or failed import job from where it left off."""
        job_id = request.data.get('job_id')
        if not job_id:
            return Response({'error': 'job_id is required.'}, status=status.HTTP_400_BAD_REQUEST)
        job = get_object_or_404(ODPImportJob, id=job_id)
        if job.status not in ('running', 'failed', 'cancelled'):
            return Response({'error': f'Cannot restart job in status: {job.status}'}, status=status.HTTP_400_BAD_REQUEST)
        job.status = 'pending'
        job.error_message = ''
        job.save(update_fields=['status', 'error_message'])
        start_import_job(job.id)
        return Response({'id': str(job.id), 'status': 'pending', 'processed': job.processed})

    @action(detail=False, methods=['post'], url_path='odp-import-page-size')
    def odp_import_page_size(self, request):
        """Update page size for a running/paused ODP import job."""
        job_id = request.data.get('job_id')
        page_size = request.data.get('page_size')
        if not job_id or page_size is None:
            return Response({'error': 'job_id and page_size are required.'}, status=status.HTTP_400_BAD_REQUEST)
        page_size = min(max(int(page_size), 25), 100)
        job = get_object_or_404(ODPImportJob, id=job_id)
        if job.status not in ('running', 'paused', 'pending'):
            return Response({'error': f'Cannot update page size for job in status: {job.status}'}, status=status.HTTP_400_BAD_REQUEST)
        job.page_size = page_size
        job.save(update_fields=['page_size'])
        return Response({'id': str(job.id), 'page_size': job.page_size})

    # ── Classification lookup / browse / search ──────────────────────

    @action(detail=False, methods=['get'], url_path='classification-lookup')
    def classification_lookup(self, request):
        """
        Look up classification titles by codes.
        GET /api/patents/patents/classification-lookup/?codes=H04L,G06F
        Returns a dict keyed by code with title, level, system.
        CPC is preferred; falls back to IPC.
        """
        codes_param = request.query_params.get('codes', '')
        codes = [c.strip() for c in codes_param.split(',') if c.strip()]
        if not codes:
            return Response({'error': 'codes parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        if len(codes) > 50:
            return Response({'error': 'Maximum 50 codes per request'}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch all matching definitions
        defs = ClassificationDefinition.objects.filter(code__in=codes)
        result = {}
        for d in defs:
            # Prefer CPC over IPC when both exist
            if d.code not in result or d.system == 'CPC':
                result[d.code] = {
                    'title': d.title,
                    'level': d.level,
                    'system': d.system,
                }

        return Response(result)

    @action(detail=False, methods=['get'], url_path='classification-browse')
    def classification_browse(self, request):
        """
        Browse classification children.
        GET /api/patents/patents/classification-browse/?system=CPC&parent=H04L
        Returns list of child classifications. Omit parent to get top-level sections.
        """
        system = request.query_params.get('system', 'CPC').upper()
        parent = request.query_params.get('parent', '')

        if system not in ('CPC', 'IPC'):
            return Response({'error': 'system must be CPC or IPC'}, status=status.HTTP_400_BAD_REQUEST)

        qs = ClassificationDefinition.objects.filter(
            system=system,
            parent_code=parent,
        ).order_by('code')

        # Annotate with child count
        from django.db.models import Subquery, OuterRef
        children_count = ClassificationDefinition.objects.filter(
            system=system,
            parent_code=OuterRef('code'),
        ).values('parent_code').annotate(cnt=Count('id')).values('cnt')

        qs = qs.annotate(child_count=Subquery(children_count))

        serializer = ClassificationDefinitionSerializer(qs[:200], many=True)
        return Response({
            'parent': parent,
            'system': system,
            'results': serializer.data,
            'count': qs.count(),
        })

    @action(detail=False, methods=['get'], url_path='classification-search')
    def classification_search(self, request):
        """
        Search classifications by code or title text.
        GET /api/patents/patents/classification-search/?q=digital+information&system=CPC
        """
        query = request.query_params.get('q', '').strip()
        system = request.query_params.get('system', '').upper()
        limit = min(int(request.query_params.get('limit', 50)), 100)

        if not query:
            return Response({'error': 'q parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        qs = ClassificationDefinition.objects.all()
        if system in ('CPC', 'IPC'):
            qs = qs.filter(system=system)

        qs = qs.filter(
            Q(code__icontains=query) | Q(title__icontains=query)
        ).order_by('code')[:limit]

        serializer = ClassificationDefinitionSerializer(qs, many=True)
        return Response({
            'query': query,
            'results': serializer.data,
        })