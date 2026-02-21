"""
Attorney Network Views
"""

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Avg, Count

from .models import LawFirm, Attorney, AttorneyReview, AttorneyConnection, AttorneySnapshot
from .serializers import (
    LawFirmSerializer,
    AttorneySerializer,
    AttorneyListSerializer,
    AttorneyReviewSerializer,
    AttorneyConnectionSerializer,
    AttorneySearchSerializer,
    AttorneySnapshotSerializer,
)


class LawFirmViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing law firms
    """
    queryset = LawFirm.objects.all().select_related('created_by')
    serializer_class = LawFirmSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['firm_size', 'country', 'city', 'is_verified', 'is_active', 'normalization_confidence']
    search_fields = ['name', 'normalized_name', 'description', 'city', 'country']
    ordering_fields = ['name', 'normalized_name', 'established_year', 'rating', 'created_at']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def needs_review(self, request):
        """Get firms with names that need manual review"""
        firms = LawFirm.objects.filter(normalization_confidence='needs_review')
        page = self.paginate_queryset(firms)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(firms, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='bulk-approve')
    def bulk_approve(self, request):
        """Bulk approve normalized names"""
        updates = request.data.get('updates', [])
        updated = 0
        for item in updates:
            firm_id = item.get('id')
            name = item.get('normalized_name')
            if firm_id and name is not None:
                updated += LawFirm.objects.filter(id=firm_id).update(
                    normalized_name=name, normalization_confidence='high'
                )
        return Response({'updated': updated})

    @action(detail=True, methods=['get'])
    def attorneys(self, request, pk=None):
        """Get all attorneys in a law firm"""
        law_firm = self.get_object()
        attorneys = law_firm.attorneys.filter(is_active=True)
        serializer = AttorneyListSerializer(attorneys, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def directory_stats(self, request):
        """Get law firm directory statistics"""
        stats = {
            'total_firms': LawFirm.objects.filter(is_active=True).count(),
            'verified_firms': LawFirm.objects.filter(is_verified=True, is_active=True).count(),
            'firms_by_size': dict(
                LawFirm.objects.filter(is_active=True)
                .values('firm_size')
                .annotate(count=Count('id'))
                .values_list('firm_size', 'count')
            ),
            'firms_by_country': dict(
                LawFirm.objects.filter(is_active=True)
                .values('country')
                .annotate(count=Count('id'))
                .order_by('-count')[:10]
                .values_list('country', 'count')
            ),
            'avg_rating': LawFirm.objects.filter(is_active=True).aggregate(
                avg=Avg('rating')
            )['avg'] or 0
        }
        return Response(stats)


class AttorneyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing attorneys
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = Attorney.objects.all().select_related(
        'user', 'law_firm', 'created_by'
    ).prefetch_related('reviews')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'experience_level', 'independent', 'is_verified',
        'is_featured', 'is_active', 'accepting_new_clients',
        'source', 'practitioner_type', 'govt_employee',
    ]
    search_fields = [
        'first_name', 'last_name', 'email', 'title',
        'bio', 'law_school', 'registration_number',
        'city', 'state', 'country',
    ]
    ordering_fields = [
        'first_name', 'last_name', 'years_of_experience',
        'rating', 'review_count', 'created_at'
    ]
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Use lightweight serializer for list view"""
        if self.action == 'list':
            return AttorneyListSerializer
        return AttorneySerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['post'])
    def search(self, request):
        """Advanced attorney search"""
        search_serializer = AttorneySearchSerializer(data=request.data)
        search_serializer.is_valid(raise_exception=True)

        params = search_serializer.validated_data
        queryset = self.get_queryset()

        # Text search
        if 'query' in params:
            q = params['query']
            queryset = queryset.filter(
                Q(first_name__icontains=q) |
                Q(last_name__icontains=q) |
                Q(bio__icontains=q) |
                Q(law_firm__name__icontains=q)
            )

        # Specialization filter (JSON array contains)
        if 'specialization' in params:
            for spec in params['specialization']:
                queryset = queryset.filter(specializations__contains=[spec])

        # Technology area filter
        if 'technology_area' in params:
            for tech in params['technology_area']:
                queryset = queryset.filter(technology_areas__contains=[tech])

        # Bar admission filter
        if 'bar_admission' in params:
            queryset = queryset.filter(bar_admissions__contains=[params['bar_admission']])

        # Experience level
        if 'experience_level' in params:
            queryset = queryset.filter(experience_level=params['experience_level'])

        # Minimum rating
        if 'min_rating' in params:
            queryset = queryset.filter(rating__gte=params['min_rating'])

        # Maximum hourly rate
        if 'hourly_rate_max' in params:
            queryset = queryset.filter(
                Q(hourly_rate_max__lte=params['hourly_rate_max']) |
                Q(hourly_rate_max__isnull=True)
            )

        # Accepting new clients
        if 'accepting_new_clients' in params:
            queryset = queryset.filter(accepting_new_clients=params['accepting_new_clients'])

        # Verified only
        if 'is_verified' in params:
            queryset = queryset.filter(is_verified=params['is_verified'])

        # Location filters
        if 'city' in params:
            queryset = queryset.filter(law_firm__city__icontains=params['city'])
        if 'state' in params:
            queryset = queryset.filter(law_firm__state__icontains=params['state'])
        if 'country' in params:
            queryset = queryset.filter(law_firm__country__icontains=params['country'])

        # Order by relevance (rating, review count)
        queryset = queryset.order_by('-is_featured', '-rating', '-review_count')

        serializer = AttorneyListSerializer(queryset, many=True)
        return Response({
            'count': queryset.count(),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured attorneys"""
        attorneys = self.get_queryset().filter(
            is_featured=True,
            is_active=True
        ).order_by('-rating')[:10]
        serializer = AttorneyListSerializer(attorneys, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='odp-lookup')
    def odp_lookup(self, request):
        """
        Look up attorney data from USPTO ODP for a given application number.
        POST { "application_number": "..." }
        """
        app_num = request.data.get('application_number', '').strip()
        if not app_num:
            return Response(
                {'error': 'application_number is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from domains.analytics.uspto_odp_service import (
            USPTOODPClient, USPTOODPDetailService, USPTOODPError,
        )
        try:
            svc = USPTOODPDetailService(USPTOODPClient())
            data = svc.get_attorney(app_num)
            return Response({
                'application_number': app_num,
                'attorney_data': data,
            })
        except USPTOODPError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

    @action(detail=False, methods=['get'])
    def directory_stats(self, request):
        """Get attorney directory statistics"""
        stats = {
            'total_attorneys': Attorney.objects.filter(is_active=True).count(),
            'verified_attorneys': Attorney.objects.filter(is_verified=True, is_active=True).count(),
            'accepting_clients': Attorney.objects.filter(
                accepting_new_clients=True,
                is_active=True
            ).count(),
            'by_experience_level': dict(
                Attorney.objects.filter(is_active=True)
                .values('experience_level')
                .annotate(count=Count('id'))
                .values_list('experience_level', 'count')
            ),
            'avg_rating': Attorney.objects.filter(is_active=True).aggregate(
                avg=Avg('rating')
            )['avg'] or 0,
            'avg_years_experience': Attorney.objects.filter(is_active=True).aggregate(
                avg=Avg('years_of_experience')
            )['avg'] or 0,
            'uspto_roster_count': Attorney.objects.filter(source='uspto_roster', is_active=True).count(),
            'by_practitioner_type': dict(
                Attorney.objects.filter(source='uspto_roster', is_active=True)
                .values('practitioner_type')
                .annotate(count=Count('id'))
                .values_list('practitioner_type', 'count')
            ),
        }
        return Response(stats)

    @action(detail=True, methods=['get'])
    def reviews(self, request, pk=None):
        """Get reviews for an attorney"""
        attorney = self.get_object()
        reviews = attorney.reviews.filter(is_approved=True).order_by('-created_at')
        serializer = AttorneyReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        """Get historical snapshots for an attorney"""
        attorney = self.get_object()
        if not attorney.registration_number:
            return Response([])
        snapshots = AttorneySnapshot.objects.filter(
            registration_number=attorney.registration_number
        ).order_by('snapshot_date')
        serializer = AttorneySnapshotSerializer(snapshots, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='firm-history')
    def firm_history(self, request, pk=None):
        """
        Get condensed firm change timeline for an attorney.
        Returns a list of firms with the date ranges the attorney was there.
        """
        attorney = self.get_object()
        if not attorney.registration_number:
            return Response([])

        snapshots = (
            AttorneySnapshot.objects
            .filter(registration_number=attorney.registration_number)
            .order_by('snapshot_date')
            .values('snapshot_date', 'firm_name', 'city', 'state', 'country')
        )

        # Collapse consecutive months at same firm into date ranges
        timeline = []
        current = None
        for snap in snapshots:
            firm = snap['firm_name'] or 'Independent / Unknown'
            if current and current['firm_name'] == firm:
                current['end_date'] = snap['snapshot_date']
            else:
                if current:
                    timeline.append(current)
                current = {
                    'firm_name': firm,
                    'city': snap['city'],
                    'state': snap['state'],
                    'country': snap['country'],
                    'start_date': snap['snapshot_date'],
                    'end_date': snap['snapshot_date'],
                }
        if current:
            timeline.append(current)

        return Response(timeline)


class AttorneyReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing attorney reviews
    """
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = AttorneyReview.objects.all().select_related('attorney', 'reviewer')
    serializer_class = AttorneyReviewSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['attorney', 'rating', 'is_verified', 'is_approved', 'would_recommend']
    ordering_fields = ['rating', 'created_at']
    ordering = ['-created_at']

    def perform_create(self, serializer):
        serializer.save(reviewer=self.request.user)

    @action(detail=True, methods=['post'])
    def flag(self, request, pk=None):
        """Flag a review for moderation"""
        review = self.get_object()
        review.is_flagged = True
        review.save()
        return Response({
            'status': 'Review flagged for moderation'
        })

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a review (admin only)"""
        review = self.get_object()
        review.is_approved = True
        review.is_flagged = False
        review.save()
        return Response({
            'status': 'Review approved'
        })


class AttorneyConnectionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing attorney connections
    """
    queryset = AttorneyConnection.objects.all().select_related('user', 'attorney')
    serializer_class = AttorneyConnectionSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['user', 'attorney', 'status', 'connection_type']
    ordering_fields = ['requested_date', 'responded_date', 'engagement_start_date']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter connections by current user"""
        user = self.request.user
        # Users see their own connections, attorneys see connections to them
        return self.queryset.filter(
            Q(user=user) | Q(attorney__user=user)
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """Accept a connection request (attorney only)"""
        connection = self.get_object()

        # Verify user is the attorney
        if not (hasattr(request.user, 'network_attorney_profile') and
                connection.attorney.user == request.user):
            return Response(
                {'error': 'Only the attorney can accept this connection'},
                status=status.HTTP_403_FORBIDDEN
            )

        connection.status = 'accepted'
        connection.response = request.data.get('response', '')
        connection.save()

        return Response({
            'status': 'Connection accepted',
            'connection': AttorneyConnectionSerializer(connection).data
        })

    @action(detail=True, methods=['post'])
    def decline(self, request, pk=None):
        """Decline a connection request (attorney only)"""
        connection = self.get_object()

        # Verify user is the attorney
        if not (hasattr(request.user, 'network_attorney_profile') and
                connection.attorney.user == request.user):
            return Response(
                {'error': 'Only the attorney can decline this connection'},
                status=status.HTTP_403_FORBIDDEN
            )

        connection.status = 'declined'
        connection.response = request.data.get('response', '')
        connection.save()

        return Response({
            'status': 'Connection declined',
            'connection': AttorneyConnectionSerializer(connection).data
        })

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark connection as completed"""
        connection = self.get_object()
        connection.status = 'completed'
        connection.engagement_end_date = request.data.get('engagement_end_date')
        connection.notes = request.data.get('notes', connection.notes)
        connection.save()

        return Response({
            'status': 'Connection marked as completed',
            'connection': AttorneyConnectionSerializer(connection).data
        })
