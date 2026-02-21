"""
Analytics Views for Workflow Management System
REST API endpoints for workflow analytics, reporting, and dashboards
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from django.http import JsonResponse
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.db.models import Q
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

from .analytics import workflow_analytics, quality_analytics, TimeGranularity
from .models import WorkflowInstance, WorkflowTemplate

logger = logging.getLogger(__name__)


class ProgressDashboardView(APIView):
    """
    Get real-time workflow progress dashboard
    """
    permission_classes = [permissions.AllowAny]  # Temporary for development
    
    @method_decorator(cache_page(60))  # Cache for 1 minute
    def get(self, request):
        """Get progress dashboard data"""
        
        try:
            # Parse query parameters
            start_date = request.GET.get('start_date')
            end_date = request.GET.get('end_date')
            organization_id = request.GET.get('organization_id')
            user_filter = request.GET.get('user_filter', 'false').lower() == 'true'
            
            # Parse dates
            date_range = None
            if start_date and end_date:
                try:
                    start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                    end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                    date_range = (start_dt, end_dt)
                except ValueError:
                    return Response(
                        {'error': 'Invalid date format. Use ISO format.'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Get organization from user profile if not specified
            if not organization_id and hasattr(request.user, 'profile'):
                organization_id = getattr(request.user.profile, 'organization_id', None)
            
            # Get dashboard data
            dashboard = workflow_analytics.get_progress_dashboard(
                organization=organization_id,
                user=request.user if user_filter else None,
                date_range=date_range
            )
            
            # Convert to JSON-serializable format
            dashboard_data = {
                'total_workflows': dashboard.total_workflows,
                'active_workflows': dashboard.active_workflows,
                'completed_workflows': dashboard.completed_workflows,
                'overdue_workflows': dashboard.overdue_workflows,
                'completion_rate': dashboard.completion_rate,
                'average_cycle_time': dashboard.average_cycle_time,
                'quality_score': dashboard.quality_score,
                'top_bottlenecks': dashboard.top_bottlenecks,
                'recent_completions': dashboard.recent_completions,
                'status_distribution': dashboard.status_distribution,
                'template_performance': dashboard.template_performance,
                'updated_at': dashboard.updated_at.isoformat()
            }
            
            return Response(dashboard_data)
            
        except Exception as e:
            logger.error(f"Error getting progress dashboard: {e}")
            return Response(
                {'error': 'Failed to get dashboard data'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RealtimeMetricsView(APIView):
    """
    Get real-time workflow metrics for dashboard updates
    """
    permission_classes = [permissions.AllowAny]  # Temporary for development
    
    def get(self, request):
        """Get real-time metrics"""
        
        try:
            organization_id = request.GET.get('organization_id')
            
            # Get organization from user profile if not specified
            if not organization_id and hasattr(request.user, 'profile'):
                organization_id = getattr(request.user.profile, 'organization_id', None)
            
            metrics = workflow_analytics.get_realtime_metrics(
                organization=organization_id
            )
            
            return Response(metrics)
            
        except Exception as e:
            logger.error(f"Error getting realtime metrics: {e}")
            return Response(
                {'error': 'Failed to get realtime metrics'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class WorkflowMetricsView(APIView):
    """
    Get detailed workflow metrics and analytics
    """
    permission_classes = [permissions.AllowAny]  # Temporary for development
    
    @method_decorator(cache_page(300))  # Cache for 5 minutes
    def get(self, request):
        """Get workflow metrics"""
        
        try:
            # Parse query parameters
            metric_type = request.GET.get('type', 'overview')
            start_date = request.GET.get('start_date')
            end_date = request.GET.get('end_date')
            template_id = request.GET.get('template_id')
            granularity = request.GET.get('granularity', 'daily')
            
            # Validate granularity
            try:
                time_granularity = TimeGranularity(granularity)
            except ValueError:
                return Response(
                    {'error': 'Invalid granularity. Use: daily, weekly, monthly, quarterly'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Default date range (last 30 days)
            if not start_date or not end_date:
                end_dt = timezone.now()
                start_dt = end_dt - timedelta(days=30)
            else:
                try:
                    start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                    end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                except ValueError:
                    return Response(
                        {'error': 'Invalid date format. Use ISO format.'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            if metric_type == 'bottlenecks':
                # Get bottleneck analysis
                workflows = WorkflowInstance.objects.filter(
                    created_at__range=(start_dt, end_dt)
                )
                
                if template_id:
                    workflows = workflows.filter(workflow_template_id=template_id)
                
                bottlenecks = workflow_analytics._identify_bottlenecks(workflows)
                
                return Response({
                    'type': 'bottlenecks',
                    'period': f"{start_dt.date()} to {end_dt.date()}",
                    'bottlenecks': bottlenecks
                })
                
            elif metric_type == 'template_performance':
                # Get template performance metrics
                workflows = WorkflowInstance.objects.filter(
                    created_at__range=(start_dt, end_dt)
                )
                
                template_performance = workflow_analytics._get_template_performance(workflows)
                
                return Response({
                    'type': 'template_performance',
                    'period': f"{start_dt.date()} to {end_dt.date()}",
                    'templates': template_performance
                })
                
            else:
                # Default overview metrics
                dashboard = workflow_analytics.get_progress_dashboard(
                    date_range=(start_dt, end_dt)
                )
                
                overview = {
                    'period': f"{start_dt.date()} to {end_dt.date()}",
                    'metrics': {
                        'total_workflows': dashboard.total_workflows,
                        'completion_rate': dashboard.completion_rate,
                        'average_cycle_time': dashboard.average_cycle_time,
                        'quality_score': dashboard.quality_score
                    },
                    'status_distribution': dashboard.status_distribution,
                    'top_bottlenecks': dashboard.top_bottlenecks[:5]  # Top 5
                }
                
                return Response(overview)
                
        except Exception as e:
            logger.error(f"Error getting workflow metrics: {e}")
            return Response(
                {'error': 'Failed to get workflow metrics'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class QualityAnalyticsView(APIView):
    """
    Get quality analytics and reports
    """
    permission_classes = [permissions.AllowAny]  # Temporary for development
    
    @method_decorator(cache_page(300))  # Cache for 5 minutes
    def get(self, request):
        """Get quality analytics"""
        
        try:
            # Parse query parameters
            report_type = request.GET.get('type', 'overview')
            start_date = request.GET.get('start_date')
            end_date = request.GET.get('end_date')
            organization_id = request.GET.get('organization_id')
            
            # Default date range (last 30 days)
            if not start_date or not end_date:
                end_dt = timezone.now()
                start_dt = end_dt - timedelta(days=30)
                date_range = (start_dt, end_dt)
            else:
                try:
                    start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                    end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                    date_range = (start_dt, end_dt)
                except ValueError:
                    return Response(
                        {'error': 'Invalid date format. Use ISO format.'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            if report_type == 'overview':
                # Get quality overview
                overview = quality_analytics.get_quality_overview(
                    date_range=date_range,
                    organization_id=organization_id
                )
                return Response(overview)
                
            elif report_type == 'user_metrics':
                # Get user-specific quality metrics
                user_metrics = quality_analytics.get_user_quality_metrics(
                    user=request.user,
                    date_range=date_range
                )
                
                return Response({
                    'user': request.user.get_full_name(),
                    'period': f"{start_dt.date()} to {end_dt.date()}",
                    'metrics': {
                        'total_checks': user_metrics.total_checks,
                        'passed_checks': user_metrics.passed_checks,
                        'failed_checks': user_metrics.failed_checks,
                        'pass_rate': user_metrics.pass_rate,
                        'average_score': user_metrics.average_score,
                        'critical_issues': user_metrics.critical_issues,
                        'improvement_trend': user_metrics.improvement_trend,
                        'quality_distribution': user_metrics.quality_distribution
                    }
                })
                
            elif report_type == 'dashboard':
                # Get quality dashboard
                dashboard_data = quality_analytics.get_quality_dashboard_data(
                    user=request.user,
                    organization_id=organization_id
                )
                
                return Response(dashboard_data)
                
            else:
                return Response(
                    {'error': f'Unknown report type: {report_type}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"Error getting quality analytics: {e}")
            return Response(
                {'error': 'Failed to get quality analytics'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET'])
@permission_classes([permissions.AllowAny])  # Temporary for development
def workflow_template_analytics(request, template_id):
    """
    Get analytics for specific workflow template
    """
    try:
        template = WorkflowTemplate.objects.get(id=template_id, is_active=True)
    except WorkflowTemplate.DoesNotExist:
        return Response(
            {'error': 'Workflow template not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Parse query parameters
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    
    # Default date range (last 90 days for template analysis)
    if not start_date or not end_date:
        end_dt = timezone.now()
        start_dt = end_dt - timedelta(days=90)
        date_range = (start_dt, end_dt)
    else:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            date_range = (start_dt, end_dt)
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use ISO format.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    try:
        # Get workflow quality metrics for template
        quality_metrics = quality_analytics.get_workflow_quality_metrics(
            workflow_template=template,
            date_range=date_range
        )
        
        # Get workflow instances for this template
        workflows = WorkflowInstance.objects.filter(
            workflow_template=template,
            created_at__range=date_range
        )
        
        # Calculate template-specific metrics
        total_instances = workflows.count()
        completed_instances = workflows.filter(
            status='completed'
        ).count()
        
        completion_rate = (completed_instances / total_instances * 100) if total_instances > 0 else 0
        
        # Get recent completions
        recent_completions = workflow_analytics._get_recent_completions(
            workflows.filter(status='completed')
        )
        
        analytics_data = {
            'template': {
                'id': str(template.id),
                'name': template.name,
                'category': template.category,
                'version': template.version
            },
            'period': f"{start_dt.date()} to {end_dt.date()}",
            'performance': {
                'total_instances': total_instances,
                'completed_instances': completed_instances,
                'completion_rate': round(completion_rate, 2),
                'success_rate': template.success_rate or 0
            },
            'quality_metrics': {
                'total_checks': quality_metrics.total_checks,
                'pass_rate': quality_metrics.pass_rate,
                'average_score': quality_metrics.average_score,
                'improvement_trend': quality_metrics.improvement_trend,
                'quality_distribution': quality_metrics.quality_distribution
            },
            'recent_completions': recent_completions[:5]  # Last 5
        }
        
        return Response(analytics_data)
        
    except Exception as e:
        logger.error(f"Error getting template analytics: {e}")
        return Response(
            {'error': 'Failed to get template analytics'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.AllowAny])  # Temporary for development
def analytics_summary(request):
    """
    Get high-level analytics summary for quick overview
    """
    try:
        # Get organization from user profile
        organization_id = None
        if hasattr(request.user, 'profile'):
            organization_id = getattr(request.user.profile, 'organization_id', None)
        
        # Get real-time metrics
        realtime = workflow_analytics.get_realtime_metrics(
            organization=organization_id
        )
        
        # Get recent quality overview (last 7 days)
        end_date = timezone.now()
        start_date = end_date - timedelta(days=7)
        quality_overview = quality_analytics.get_quality_overview(
            date_range=(start_date, end_date),
            organization_id=organization_id
        )
        
        summary = {
            'realtime_metrics': realtime,
            'quality_summary': {
                'total_checks': quality_overview['overview']['total_checks'],
                'pass_rate': quality_overview['overview']['pass_rate'],
                'average_score': quality_overview['overview']['average_score']
            },
            'period': '7 days',
            'generated_at': timezone.now().isoformat()
        }
        
        return Response(summary)
        
    except Exception as e:
        logger.error(f"Error getting analytics summary: {e}")
        return Response(
            {'error': 'Failed to get analytics summary'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )