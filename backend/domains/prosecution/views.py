"""
Patent Prosecution Views
API views for prosecution-related functionality
"""

from rest_framework import viewsets, filters, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from .models import (
    PatentApplication,
    Claim,
    ProsecutionEvent,
    OfficeAction,
    ProsecutionDeadline,
    ProsecutionDocument
)
from .serializers import (
    PatentApplicationSerializer,
    PatentApplicationListSerializer,
    ClaimSerializer,
    ProsecutionEventSerializer,
    OfficeActionSerializer,
    ProsecutionDeadlineSerializer,
    ProsecutionDocumentSerializer
)


class PatentApplicationViewSet(viewsets.ModelViewSet):
    """ViewSet for patent applications with prosecution management"""
    
    serializer_class = PatentApplicationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'application_type', 'jurisdiction', 'priority_level', 'attorney']
    search_fields = ['title', 'application_number', 'patent_number', 'abstract']
    ordering_fields = ['created_at', 'filing_date', 'title', 'status']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return PatentApplication.objects.filter(
            organization=self.request.user.organization
        ).select_related('attorney', 'organization')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PatentApplicationListSerializer
        return PatentApplicationSerializer
    
    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        """Get dashboard statistics for prosecution overview"""
        user_org = request.user.organization
        queryset = self.get_queryset()
        
        # Basic counts
        total_applications = queryset.count()
        active_applications = queryset.filter(
            status__in=['filed', 'pending', 'under_examination', 'office_action']
        ).count()
        draft_applications = queryset.filter(status='draft').count()
        
        # Upcoming deadlines (next 30 days)
        upcoming_deadline_date = timezone.now().date() + timedelta(days=30)
        upcoming_deadlines = ProsecutionDeadline.objects.filter(
            application__organization=user_org,
            due_date__lte=upcoming_deadline_date,
            is_completed=False,
            is_cancelled=False
        ).count()
        
        # Office actions requiring response
        office_actions = OfficeAction.objects.filter(
            application__organization=user_org,
            response_status='pending'
        ).count()
        
        # Recent activity
        recent_events = ProsecutionEvent.objects.filter(
            application__organization=user_org
        ).order_by('-created_at')[:5]
        
        return Response({
            'total_applications': total_applications,
            'active_applications': active_applications,
            'draft_applications': draft_applications,
            'upcoming_deadlines': upcoming_deadlines,
            'office_actions': office_actions,
            'recent_activity': ProsecutionEventSerializer(recent_events, many=True).data
        })
    
    @action(detail=False, methods=['get'])
    def status_breakdown(self, request):
        """Get breakdown of applications by status"""
        queryset = self.get_queryset()
        status_counts = queryset.values('status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return Response(status_counts)
    
    @action(detail=True, methods=['post'])
    def add_event(self, request, pk=None):
        """Add a prosecution event to an application"""
        application = self.get_object()
        serializer = ProsecutionEventSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save(
                application=application,
                handled_by=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ClaimViewSet(viewsets.ModelViewSet):
    """ViewSet for patent claims"""
    
    serializer_class = ClaimSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['application', 'claim_type', 'is_cancelled', 'is_amended']
    ordering = ['claim_number']
    
    def get_queryset(self):
        return Claim.objects.filter(
            application__organization=self.request.user.organization
        ).select_related('application')
    
    def perform_create(self, serializer):
        serializer.save()


class ProsecutionEventViewSet(viewsets.ModelViewSet):
    """ViewSet for prosecution events"""
    
    serializer_class = ProsecutionEventSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['event_type', 'is_completed', 'is_urgent']
    search_fields = ['title', 'description']
    ordering = ['-event_date']
    
    def get_queryset(self):
        return ProsecutionEvent.objects.filter(
            application__organization=self.request.user.organization
        ).select_related('application', 'handled_by')
    
    def perform_create(self, serializer):
        serializer.save(handled_by=self.request.user)


class OfficeActionViewSet(viewsets.ModelViewSet):
    """ViewSet for office actions"""
    
    serializer_class = OfficeActionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['action_type', 'response_status']
    ordering = ['-mailing_date']
    
    def get_queryset(self):
        return OfficeAction.objects.filter(
            application__organization=self.request.user.organization
        ).select_related('application')
    
    @action(detail=False, methods=['get'])
    def overdue_responses(self, request):
        """Get office actions with overdue responses"""
        today = timezone.now().date()
        overdue = self.get_queryset().filter(
            response_due_date__lt=today,
            response_status='pending'
        )
        serializer = self.get_serializer(overdue, many=True)
        return Response(serializer.data)


class ProsecutionDeadlineViewSet(viewsets.ModelViewSet):
    """ViewSet for prosecution deadlines"""
    
    serializer_class = ProsecutionDeadlineSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['deadline_type', 'priority', 'is_completed', 'assigned_to']
    search_fields = ['title', 'description']
    ordering = ['due_date']
    
    def get_queryset(self):
        return ProsecutionDeadline.objects.filter(
            application__organization=self.request.user.organization
        ).select_related('application', 'assigned_to')
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming deadlines within specified days (default 30)"""
        days = int(request.query_params.get('days', 30))
        deadline_date = timezone.now().date() + timedelta(days=days)
        
        upcoming = self.get_queryset().filter(
            due_date__lte=deadline_date,
            is_completed=False,
            is_cancelled=False
        ).order_by('due_date')
        
        serializer = self.get_serializer(upcoming, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Mark a deadline as completed"""
        deadline = self.get_object()
        deadline.is_completed = True
        deadline.completed_date = timezone.now().date()
        deadline.save()

        serializer = self.get_serializer(deadline)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue deadlines"""
        today = timezone.now().date()
        overdue = self.get_queryset().filter(
            due_date__lt=today,
            is_completed=False,
            is_cancelled=False
        ).order_by('due_date')

        serializer = self.get_serializer(overdue, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def calendar(self, request):
        """Get deadlines for calendar view - grouped by date"""
        start_date = request.query_params.get('start')
        end_date = request.query_params.get('end')

        queryset = self.get_queryset().filter(
            is_cancelled=False
        )

        if start_date:
            queryset = queryset.filter(due_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(due_date__lte=end_date)

        deadlines = queryset.order_by('due_date')

        # Group by date
        calendar_data = {}
        for deadline in deadlines:
            date_key = deadline.due_date.isoformat()
            if date_key not in calendar_data:
                calendar_data[date_key] = []
            calendar_data[date_key].append(self.get_serializer(deadline).data)

        return Response(calendar_data)

    @action(detail=False, methods=['get'])
    def my_deadlines(self, request):
        """Get deadlines assigned to the current user"""
        deadlines = self.get_queryset().filter(
            assigned_to=request.user,
            is_completed=False,
            is_cancelled=False
        ).order_by('due_date')

        serializer = self.get_serializer(deadlines, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get deadline statistics"""
        queryset = self.get_queryset()
        today = timezone.now().date()

        total = queryset.count()
        completed = queryset.filter(is_completed=True).count()
        pending = queryset.filter(is_completed=False, is_cancelled=False).count()
        overdue = queryset.filter(
            due_date__lt=today,
            is_completed=False,
            is_cancelled=False
        ).count()

        # Upcoming in next 7 days
        week_from_now = today + timedelta(days=7)
        upcoming_week = queryset.filter(
            due_date__gte=today,
            due_date__lte=week_from_now,
            is_completed=False,
            is_cancelled=False
        ).count()

        # By priority
        by_priority = queryset.filter(
            is_completed=False,
            is_cancelled=False
        ).values('priority').annotate(count=Count('id'))

        # By type
        by_type = queryset.filter(
            is_completed=False,
            is_cancelled=False
        ).values('deadline_type').annotate(count=Count('id'))

        return Response({
            'total': total,
            'completed': completed,
            'pending': pending,
            'overdue': overdue,
            'upcoming_week': upcoming_week,
            'by_priority': list(by_priority),
            'by_type': list(by_type)
        })

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a deadline"""
        deadline = self.get_object()
        deadline.is_cancelled = True
        deadline.save()

        serializer = self.get_serializer(deadline)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reassign(self, request, pk=None):
        """Reassign a deadline to a different user"""
        deadline = self.get_object()
        new_assignee_id = request.data.get('assigned_to')

        if not new_assignee_id:
            return Response(
                {'error': 'assigned_to is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from domains.accounts.models import User
        try:
            new_assignee = User.objects.get(id=new_assignee_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        deadline.assigned_to = new_assignee
        deadline.save()

        # Send notification to new assignee
        from domains.collaboration.utils import create_and_send_notification
        from domains.collaboration.models import Notification

        create_and_send_notification(
            user=new_assignee,
            notification_type=Notification.NotificationType.TASK_ASSIGNED,
            title=f"Deadline Assigned: {deadline.title}",
            message=f"You have been assigned a deadline for '{deadline.application.title}'. "
                    f"Due: {deadline.due_date}",
            actor=request.user,
            related_object=deadline,
            action_url=f"/dashboard/prosecution/applications/{deadline.application.id}"
        )

        serializer = self.get_serializer(deadline)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_complete(self, request):
        """Mark multiple deadlines as completed"""
        deadline_ids = request.data.get('deadline_ids', [])

        if not deadline_ids:
            return Response(
                {'error': 'deadline_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        updated = self.get_queryset().filter(
            id__in=deadline_ids
        ).update(
            is_completed=True,
            completed_date=timezone.now().date()
        )

        return Response({
            'success': True,
            'updated_count': updated
        })

    @action(detail=False, methods=['post'])
    def reset_reminder(self, request):
        """Reset reminder flag for deadlines (allows re-sending reminders)"""
        deadline_ids = request.data.get('deadline_ids', [])

        if deadline_ids:
            updated = self.get_queryset().filter(
                id__in=deadline_ids
            ).update(reminder_sent=False)
        else:
            # Reset all non-completed deadlines
            updated = self.get_queryset().filter(
                is_completed=False,
                is_cancelled=False
            ).update(reminder_sent=False)

        return Response({
            'success': True,
            'updated_count': updated
        })


class ProsecutionDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for prosecution documents"""
    
    serializer_class = ProsecutionDocumentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['document_type', 'is_filed', 'is_current_version']
    search_fields = ['title', 'description']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return ProsecutionDocument.objects.filter(
            application__organization=self.request.user.organization
        ).select_related('application', 'uploaded_by')
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class ODPProsecutionSyncViewSet(viewsets.GenericViewSet):
    """
    Sync prosecution data from USPTO ODP for a PatentApplication.
    Populates transactions, documents, and attorney records.
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='sync')
    def sync_from_odp(self, request):
        """
        POST { "application_id": "<uuid>", "application_number": "<app_num>" }
        Calls ODP transactions, documents, and attorney endpoints and returns combined data.
        """
        app_id_db = request.data.get('application_id')
        app_num = request.data.get('application_number', '')

        if not app_num:
            if app_id_db:
                try:
                    app_obj = PatentApplication.objects.get(pk=app_id_db)
                    app_num = app_obj.application_number or ''
                except PatentApplication.DoesNotExist:
                    pass
            if not app_num:
                return Response(
                    {'error': 'application_number is required'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        from domains.analytics.uspto_odp_service import (
            USPTOODPClient, USPTOODPDetailService, USPTOODPError,
        )

        result = {}
        svc = USPTOODPDetailService(USPTOODPClient())

        try:
            result['transactions'] = svc.get_transactions(app_num)
        except USPTOODPError:
            result['transactions'] = None

        try:
            result['documents'] = svc.get_documents(app_num)
        except USPTOODPError:
            result['documents'] = None

        try:
            result['attorney'] = svc.get_attorney(app_num)
        except USPTOODPError:
            result['attorney'] = None

        return Response({
            'application_number': app_num,
            'synced_data': result,
        })