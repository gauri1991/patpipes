"""
Workflow Analytics and Reporting System
Provides comprehensive analytics, metrics, and reporting for workflow management
Includes both workflow performance analytics and quality control analytics
"""

import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone as tz
from django.db import models, transaction
from django.db.models import Count, Avg, Sum, Q, F, Case, When, Value, IntegerField
from django.db.models.functions import Extract, TruncDate, TruncWeek, TruncMonth
from django.utils import timezone
from django.contrib.auth import get_user_model
import json
from decimal import Decimal
from enum import Enum

from .models import (
    WorkflowInstance, WorkflowStepInstance, WorkflowTemplate, WorkflowStep,
    QualityControl, QualityCheckResult,
    WorkflowInstanceStatus, StepStatus, QualityControlType
)
from .quality import QualityRuleSeverity

User = get_user_model()
logger = logging.getLogger(__name__)


class MetricType(Enum):
    """Types of workflow metrics"""
    COMPLETION_RATE = 'completion_rate'
    CYCLE_TIME = 'cycle_time'
    THROUGHPUT = 'throughput'
    QUALITY_SCORE = 'quality_score'
    BOTTLENECK_ANALYSIS = 'bottleneck_analysis'
    RESOURCE_UTILIZATION = 'resource_utilization'
    SLA_COMPLIANCE = 'sla_compliance'
    ERROR_RATE = 'error_rate'


class TimeGranularity(Enum):
    """Time granularity for analytics"""
    DAILY = 'daily'
    WEEKLY = 'weekly'
    MONTHLY = 'monthly'
    QUARTERLY = 'quarterly'


@dataclass
class WorkflowMetric:
    """Individual workflow metric"""
    name: str
    value: float
    unit: str
    trend: Optional[str] = None  # 'up', 'down', 'stable'
    trend_percentage: Optional[float] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ProgressDashboard:
    """Workflow progress dashboard data"""
    total_workflows: int
    active_workflows: int
    completed_workflows: int
    overdue_workflows: int
    completion_rate: float
    average_cycle_time: float
    quality_score: float
    top_bottlenecks: List[Dict[str, Any]]
    recent_completions: List[Dict[str, Any]]
    status_distribution: Dict[str, int]
    template_performance: List[Dict[str, Any]]
    updated_at: datetime


@dataclass
class PerformanceReport:
    """Performance metrics report"""
    period: str
    start_date: datetime
    end_date: datetime
    metrics: List[WorkflowMetric]
    throughput_data: List[Dict[str, Any]]
    cycle_time_data: List[Dict[str, Any]]
    bottlenecks: List[Dict[str, Any]]
    efficiency_score: float
    recommendations: List[str]


@dataclass
class QualityReport:
    """Quality analysis report"""
    period: str
    total_quality_checks: int
    passed_checks: int
    failed_checks: int
    quality_score: float
    critical_issues: List[Dict[str, Any]]
    improvement_areas: List[Dict[str, Any]]
    template_quality_scores: Dict[str, float]
    remediation_success_rate: float


@dataclass
class ComplianceReport:
    """Compliance and audit report"""
    period: str
    total_workflows: int
    compliant_workflows: int
    compliance_rate: float
    audit_trail_entries: int
    security_events: List[Dict[str, Any]]
    policy_violations: List[Dict[str, Any]]
    access_patterns: Dict[str, Any]
    recommendations: List[str]


@dataclass
class QualityMetrics:
    """Quality metrics for a specific scope (user, workflow, template, etc.)"""
    total_checks: int = 0
    passed_checks: int = 0
    failed_checks: int = 0
    average_score: float = 0.0
    
    critical_issues: int = 0
    error_issues: int = 0
    warning_issues: int = 0
    info_issues: int = 0
    
    pass_rate: float = 0.0
    improvement_trend: float = 0.0  # Positive = improving, Negative = declining
    
    remediation_success_rate: float = 0.0
    avg_execution_time: float = 0.0
    
    top_failing_rules: List[Dict[str, Any]] = field(default_factory=list)
    quality_distribution: Dict[str, int] = field(default_factory=dict)
    
    def calculate_derived_metrics(self):
        """Calculate derived metrics from basic counts"""
        if self.total_checks > 0:
            self.pass_rate = (self.passed_checks / self.total_checks) * 100


@dataclass
class QualityTrends:
    """Quality trend analysis over time"""
    period_start: datetime
    period_end: datetime
    data_points: List[Dict[str, Any]] = field(default_factory=list)
    trend_direction: str = "stable"  # "improving", "declining", "stable"
    trend_strength: float = 0.0  # 0-1, strength of trend
    recommendations: List[str] = field(default_factory=list)


class QualityAnalyticsEngine:
    """
    Advanced quality analytics engine for performance analysis and reporting
    """
    
    def get_quality_overview(
        self, 
        date_range: Optional[Tuple[datetime, datetime]] = None,
        organization_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get high-level quality overview"""
        
        if not date_range:
            end_date = timezone.now()
            start_date = end_date - timedelta(days=30)
            date_range = (start_date, end_date)
        
        start_date, end_date = date_range
        
        # Base queryset
        results_qs = QualityCheckResult.objects.filter(
            checked_at__range=date_range
        )
        
        if organization_id:
            results_qs = results_qs.filter(
                step_instance__workflow_instance__organization_id=organization_id
            )
        
        # Basic metrics
        total_checks = results_qs.count()
        passed_checks = results_qs.filter(passed=True).count()
        failed_checks = total_checks - passed_checks
        avg_score = results_qs.aggregate(avg_score=Avg('score'))['avg_score'] or 0
        
        # Issue analysis
        issue_stats = self._analyze_issues_from_results(results_qs)
        
        # Quality distribution
        quality_distribution = self._get_quality_score_distribution(results_qs)
        
        # Top failing controls
        top_failing = self._get_top_failing_controls(results_qs)
        
        # Trend analysis
        trend_data = self._calculate_quality_trends(date_range, organization_id)
        
        return {
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat(),
                'days': (end_date - start_date).days
            },
            'overview': {
                'total_checks': total_checks,
                'passed_checks': passed_checks,
                'failed_checks': failed_checks,
                'pass_rate': (passed_checks / total_checks * 100) if total_checks > 0 else 0,
                'average_score': round(avg_score, 2)
            },
            'issues': issue_stats,
            'quality_distribution': quality_distribution,
            'top_failing_controls': top_failing,
            'trends': trend_data
        }
    
    def get_user_quality_metrics(
        self, 
        user: User,
        date_range: Optional[Tuple[datetime, datetime]] = None
    ) -> QualityMetrics:
        """Get quality metrics for specific user"""
        
        if not date_range:
            end_date = timezone.now()
            start_date = end_date - timedelta(days=30)
            date_range = (start_date, end_date)
        
        # Get quality check results for user's work
        results_qs = QualityCheckResult.objects.filter(
            step_instance__assigned_to=user,
            checked_at__range=date_range
        )
        
        return self._calculate_metrics_from_queryset(results_qs)
    
    def get_workflow_quality_metrics(
        self,
        workflow_template: WorkflowTemplate,
        date_range: Optional[Tuple[datetime, datetime]] = None
    ) -> QualityMetrics:
        """Get quality metrics for specific workflow template"""
        
        if not date_range:
            end_date = timezone.now()
            start_date = end_date - timedelta(days=90)  # Longer range for workflow analysis
            date_range = (start_date, end_date)
        
        # Get quality check results for this workflow template
        results_qs = QualityCheckResult.objects.filter(
            step_instance__workflow_instance__workflow_template=workflow_template,
            checked_at__range=date_range
        )
        
        metrics = self._calculate_metrics_from_queryset(results_qs)
        
        # Add workflow-specific analysis
        step_quality = self._analyze_step_quality_performance(workflow_template, date_range)
        metrics.quality_distribution = step_quality
        
        return metrics
    
    def get_quality_control_performance(
        self,
        quality_control: QualityControl,
        date_range: Optional[Tuple[datetime, datetime]] = None
    ) -> Dict[str, Any]:
        """Analyze performance of specific quality control"""
        
        if not date_range:
            end_date = timezone.now()
            start_date = end_date - timedelta(days=60)
            date_range = (start_date, end_date)
        
        results_qs = QualityCheckResult.objects.filter(
            quality_control=quality_control,
            checked_at__range=date_range
        ).order_by('checked_at')
        
        total_executions = results_qs.count()
        if total_executions == 0:
            return {
                'control_name': quality_control.name,
                'total_executions': 0,
                'message': 'No executions in date range'
            }
        
        # Basic performance metrics
        passed_count = results_qs.filter(passed=True).count()
        avg_score = results_qs.aggregate(avg_score=Avg('score'))['avg_score'] or 0
        
        # Execution time analysis (from details if available)
        execution_times = []
        for result in results_qs:
            if 'execution_time' in result.details:
                execution_times.append(result.details['execution_time'])
        
        avg_execution_time = sum(execution_times) / len(execution_times) if execution_times else 0
        
        # Trend over time
        trend_data = self._calculate_control_trend(results_qs)
        
        # Common failure reasons
        failure_analysis = self._analyze_control_failures(results_qs.filter(passed=False))
        
        return {
            'control_name': quality_control.name,
            'control_type': quality_control.type,
            'period': {
                'start': date_range[0].isoformat(),
                'end': date_range[1].isoformat()
            },
            'performance': {
                'total_executions': total_executions,
                'passed_count': passed_count,
                'failed_count': total_executions - passed_count,
                'pass_rate': (passed_count / total_executions * 100),
                'average_score': round(avg_score, 2),
                'avg_execution_time': round(avg_execution_time, 3)
            },
            'trend': trend_data,
            'failure_analysis': failure_analysis
        }
    
    def get_quality_dashboard_data(
        self, 
        user: User,
        organization_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get comprehensive quality dashboard data"""
        
        # Date ranges for different analyses
        last_7_days = (timezone.now() - timedelta(days=7), timezone.now())
        last_30_days = (timezone.now() - timedelta(days=30), timezone.now())
        
        dashboard_data = {
            'user_metrics': self.get_user_quality_metrics(user, last_30_days),
            'recent_overview': self.get_quality_overview(last_7_days, organization_id),
            'monthly_overview': self.get_quality_overview(last_30_days, organization_id),
        }
        
        # Add alerts and recommendations
        dashboard_data['alerts'] = self._generate_quality_alerts(user, organization_id)
        dashboard_data['recommendations'] = self._generate_quality_recommendations(user, organization_id)
        
        # Add pending quality reviews (if user is reviewer)
        dashboard_data['pending_reviews'] = self._get_pending_quality_reviews(user)
        
        return dashboard_data
    
    def _calculate_metrics_from_queryset(self, queryset) -> QualityMetrics:
        """Calculate quality metrics from queryset"""
        
        total_checks = queryset.count()
        passed_checks = queryset.filter(passed=True).count()
        failed_checks = total_checks - passed_checks
        avg_score = queryset.aggregate(avg_score=Avg('score'))['avg_score'] or 0
        
        # Analyze issues from details
        issue_stats = self._analyze_issues_from_results(queryset)
        
        # Calculate improvement trend (compare recent vs older results)
        improvement_trend = self._calculate_improvement_trend(queryset)
        
        # Quality score distribution
        quality_distribution = self._get_quality_score_distribution(queryset)
        
        # Top failing rules
        top_failing_rules = self._get_top_failing_rules(queryset)
        
        metrics = QualityMetrics(
            total_checks=total_checks,
            passed_checks=passed_checks,
            failed_checks=failed_checks,
            average_score=round(avg_score, 2),
            critical_issues=issue_stats['critical'],
            error_issues=issue_stats['error'],
            warning_issues=issue_stats['warning'],
            info_issues=issue_stats['info'],
            improvement_trend=improvement_trend,
            quality_distribution=quality_distribution,
            top_failing_rules=top_failing_rules
        )
        
        metrics.calculate_derived_metrics()
        return metrics
    
    def _analyze_issues_from_results(self, queryset) -> Dict[str, int]:
        """Analyze issues by severity from quality check results"""
        
        issue_counts = {
            'critical': 0,
            'error': 0,
            'warning': 0,
            'info': 0
        }
        
        for result in queryset:
            if 'issues' in result.details:
                for issue in result.details['issues']:
                    severity = issue.get('severity', 'info')
                    if severity in issue_counts:
                        issue_counts[severity] += 1
        
        return issue_counts
    
    def _get_quality_score_distribution(self, queryset) -> Dict[str, int]:
        """Get distribution of quality scores"""
        
        distribution = {
            'excellent': 0,  # 90-100
            'good': 0,       # 75-89
            'fair': 0,       # 60-74
            'poor': 0        # 0-59
        }
        
        for result in queryset:
            score = result.score
            if score >= 90:
                distribution['excellent'] += 1
            elif score >= 75:
                distribution['good'] += 1
            elif score >= 60:
                distribution['fair'] += 1
            else:
                distribution['poor'] += 1
        
        return distribution
    
    def _get_top_failing_controls(self, queryset, limit: int = 5) -> List[Dict[str, Any]]:
        """Get top failing quality controls"""
        
        failing_controls = queryset.filter(passed=False).values(
            'quality_control__name',
            'quality_control__type',
            'quality_control__id'
        ).annotate(
            failure_count=Count('id'),
            avg_score=Avg('score')
        ).order_by('-failure_count')[:limit]
        
        return [
            {
                'control_name': control['quality_control__name'],
                'control_type': control['quality_control__type'],
                'control_id': str(control['quality_control__id']),
                'failure_count': control['failure_count'],
                'avg_score': round(control['avg_score'] or 0, 2)
            }
            for control in failing_controls
        ]
    
    def _get_top_failing_rules(self, queryset, limit: int = 10) -> List[Dict[str, Any]]:
        """Get top failing quality rules from issue analysis"""
        
        rule_failures = {}
        
        for result in queryset.filter(passed=False):
            if 'issues' in result.details:
                for issue in result.details['issues']:
                    rule_id = issue.get('rule_id', 'unknown')
                    if rule_id not in rule_failures:
                        rule_failures[rule_id] = {
                            'rule_id': rule_id,
                            'failure_count': 0,
                            'severity_counts': {'critical': 0, 'error': 0, 'warning': 0, 'info': 0},
                            'common_message': issue.get('message', '')
                        }
                    
                    rule_failures[rule_id]['failure_count'] += 1
                    severity = issue.get('severity', 'info')
                    if severity in rule_failures[rule_id]['severity_counts']:
                        rule_failures[rule_id]['severity_counts'][severity] += 1
        
        # Sort by failure count and return top N
        sorted_rules = sorted(rule_failures.values(), key=lambda x: x['failure_count'], reverse=True)
        return sorted_rules[:limit]
    
    def _calculate_improvement_trend(self, queryset) -> float:
        """Calculate improvement trend (recent vs older performance)"""
        
        if queryset.count() < 10:  # Need sufficient data
            return 0.0
        
        total_results = queryset.order_by('checked_at')
        midpoint = total_results.count() // 2
        
        # Split into older and recent halves
        older_results = total_results[:midpoint]
        recent_results = total_results[midpoint:]
        
        # Calculate pass rates
        older_pass_rate = older_results.filter(passed=True).count() / older_results.count() * 100
        recent_pass_rate = recent_results.filter(passed=True).count() / recent_results.count() * 100
        
        # Return trend (positive = improving)
        return round(recent_pass_rate - older_pass_rate, 2)
    
    def _calculate_quality_trends(
        self, 
        date_range: Tuple[datetime, datetime],
        organization_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Calculate quality trends over the date range"""
        
        start_date, end_date = date_range
        
        # Create daily buckets
        delta = end_date - start_date
        if delta.days <= 7:
            bucket_size = timedelta(days=1)
        elif delta.days <= 30:
            bucket_size = timedelta(days=3)
        else:
            bucket_size = timedelta(days=7)
        
        trend_data = []
        current_date = start_date
        
        while current_date < end_date:
            bucket_end = min(current_date + bucket_size, end_date)
            
            results_qs = QualityCheckResult.objects.filter(
                checked_at__range=(current_date, bucket_end)
            )
            
            if organization_id:
                results_qs = results_qs.filter(
                    step_instance__workflow_instance__organization_id=organization_id
                )
            
            total = results_qs.count()
            passed = results_qs.filter(passed=True).count() if total > 0 else 0
            avg_score = results_qs.aggregate(avg_score=Avg('score'))['avg_score'] or 0
            
            trend_data.append({
                'date': current_date.isoformat(),
                'total_checks': total,
                'pass_rate': (passed / total * 100) if total > 0 else 0,
                'avg_score': round(avg_score, 2)
            })
            
            current_date = bucket_end
        
        return {
            'data_points': trend_data,
            'trend_analysis': self._analyze_trend_direction(trend_data)
        }
    
    def _analyze_trend_direction(self, trend_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze trend direction from data points"""
        
        if len(trend_data) < 3:
            return {'direction': 'insufficient_data', 'strength': 0.0}
        
        # Use pass rates for trend analysis
        pass_rates = [point['pass_rate'] for point in trend_data if point['total_checks'] > 0]
        
        if len(pass_rates) < 3:
            return {'direction': 'insufficient_data', 'strength': 0.0}
        
        # Simple linear trend analysis
        n = len(pass_rates)
        x_values = list(range(n))
        
        # Calculate trend slope
        x_mean = sum(x_values) / n
        y_mean = sum(pass_rates) / n
        
        numerator = sum((x - x_mean) * (y - y_mean) for x, y in zip(x_values, pass_rates))
        denominator = sum((x - x_mean) ** 2 for x in x_values)
        
        if denominator == 0:
            slope = 0
        else:
            slope = numerator / denominator
        
        # Determine direction and strength
        if abs(slope) < 0.5:
            direction = 'stable'
        elif slope > 0:
            direction = 'improving'
        else:
            direction = 'declining'
        
        strength = min(abs(slope) / 10, 1.0)  # Normalize strength to 0-1
        
        return {
            'direction': direction,
            'strength': round(strength, 3),
            'slope': round(slope, 3)
        }
    
    def _calculate_control_trend(self, results_qs) -> Dict[str, Any]:
        """Calculate trend for specific quality control"""
        
        # Group by day and calculate daily pass rates
        daily_stats = {}
        
        for result in results_qs:
            date_key = result.checked_at.date()
            if date_key not in daily_stats:
                daily_stats[date_key] = {'total': 0, 'passed': 0}
            
            daily_stats[date_key]['total'] += 1
            if result.passed:
                daily_stats[date_key]['passed'] += 1
        
        # Convert to trend data
        trend_points = []
        for date, stats in sorted(daily_stats.items()):
            pass_rate = (stats['passed'] / stats['total'] * 100) if stats['total'] > 0 else 0
            trend_points.append({
                'date': date.isoformat(),
                'pass_rate': round(pass_rate, 2),
                'total_checks': stats['total']
            })
        
        return {
            'data_points': trend_points,
            'analysis': self._analyze_trend_direction(trend_points)
        }
    
    def _analyze_control_failures(self, failed_results_qs) -> Dict[str, Any]:
        """Analyze common failure patterns for a quality control"""
        
        failure_reasons = {}
        severity_distribution = {'critical': 0, 'error': 0, 'warning': 0, 'info': 0}
        
        for result in failed_results_qs:
            if 'issues' in result.details:
                for issue in result.details['issues']:
                    # Categorize failure reasons
                    rule_id = issue.get('rule_id', 'unknown')
                    message = issue.get('message', 'Unknown failure')
                    severity = issue.get('severity', 'info')
                    
                    if rule_id not in failure_reasons:
                        failure_reasons[rule_id] = {
                            'rule_id': rule_id,
                            'count': 0,
                            'example_message': message,
                            'severity': severity
                        }
                    
                    failure_reasons[rule_id]['count'] += 1
                    
                    if severity in severity_distribution:
                        severity_distribution[severity] += 1
        
        # Sort by frequency
        common_failures = sorted(failure_reasons.values(), key=lambda x: x['count'], reverse=True)[:5]
        
        return {
            'total_failures': failed_results_qs.count(),
            'severity_distribution': severity_distribution,
            'common_failure_reasons': common_failures
        }
    
    def _analyze_step_quality_performance(
        self, 
        workflow_template: WorkflowTemplate,
        date_range: Tuple[datetime, datetime]
    ) -> Dict[str, Any]:
        """Analyze quality performance by workflow step"""
        
        step_performance = {}
        
        # Get all steps for this workflow template
        steps = WorkflowStep.objects.filter(workflow_template=workflow_template)
        
        for step in steps:
            results_qs = QualityCheckResult.objects.filter(
                step_instance__workflow_step=step,
                checked_at__range=date_range
            )
            
            total = results_qs.count()
            passed = results_qs.filter(passed=True).count()
            avg_score = results_qs.aggregate(avg_score=Avg('score'))['avg_score'] or 0
            
            step_performance[step.name] = {
                'step_order': step.order,
                'total_checks': total,
                'pass_rate': (passed / total * 100) if total > 0 else 0,
                'avg_score': round(avg_score, 2)
            }
        
        return step_performance
    
    def _generate_quality_alerts(self, user: User, organization_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Generate quality alerts for dashboard"""
        
        alerts = []
        
        # Check for recent failures
        recent_failures = QualityCheckResult.objects.filter(
            step_instance__assigned_to=user,
            passed=False,
            checked_at__gte=timezone.now() - timedelta(days=7)
        ).count()
        
        if recent_failures > 3:
            alerts.append({
                'type': 'warning',
                'message': f'You have {recent_failures} quality failures in the last 7 days',
                'action': 'Review failed quality checks and remediation actions'
            })
        
        # Check for pending reviews - use icontains instead of contains for DB compatibility
        try:
            # Try to get user role, handle cases where role might not be set
            user_role = getattr(user, 'role', None)
            if user_role:
                pending_reviews = QualityCheckResult.objects.filter(
                    requires_remediation=True,
                    remediated_at__isnull=True
                ).filter(
                    quality_control__reviewer_roles__icontains=user_role
                ).count()
            else:
                pending_reviews = 0
        except Exception:
            # Fallback if there are issues with the query
            pending_reviews = 0
        
        if pending_reviews > 0:
            alerts.append({
                'type': 'info',
                'message': f'You have {pending_reviews} quality reviews pending',
                'action': 'Review and approve/reject quality issues'
            })
        
        return alerts
    
    def _generate_quality_recommendations(self, user: User, organization_id: Optional[str] = None) -> List[str]:
        """Generate quality improvement recommendations"""
        
        recommendations = []
        
        # Analyze user's quality patterns
        user_metrics = self.get_user_quality_metrics(user)
        
        if user_metrics.pass_rate < 80:
            recommendations.append(
                "Consider additional training on quality requirements - current pass rate is below 80%"
            )
        
        if user_metrics.critical_issues > 0:
            recommendations.append(
                "Focus on addressing critical quality issues to prevent workflow delays"
            )
        
        if user_metrics.improvement_trend < -5:
            recommendations.append(
                "Quality performance is declining - consider reviewing recent changes in process"
            )
        
        # Add generic recommendations if no specific issues
        if not recommendations:
            recommendations.append("Maintain excellent quality standards - keep up the good work!")
        
        return recommendations
    
    def _get_pending_quality_reviews(self, user: User) -> List[Dict[str, Any]]:
        """Get pending quality reviews for user"""
        
        try:
            # Use icontains for DB compatibility and handle missing user role
            user_role = getattr(user, 'role', None)
            if user_role:
                pending_results = QualityCheckResult.objects.filter(
                    requires_remediation=True,
                    remediated_at__isnull=True
                ).filter(
                    quality_control__reviewer_roles__icontains=user_role
                ).select_related(
                    'quality_control', 
                    'step_instance__workflow_step',
                    'step_instance__workflow_instance'
                )[:10]  # Limit to 10 most recent
            else:
                pending_results = QualityCheckResult.objects.none()
        except Exception:
            # Fallback to empty queryset if there are issues
            pending_results = QualityCheckResult.objects.none()
        
        reviews = []
        for result in pending_results:
            reviews.append({
                'id': str(result.id),
                'quality_control': result.quality_control.name,
                'step': result.step_instance.workflow_step.name,
                'workflow': result.step_instance.workflow_instance.name,
                'score': result.score,
                'checked_at': result.checked_at.isoformat(),
                'issue_count': len(result.details.get('issues', []))
            })
        
        return reviews


class WorkflowAnalyticsEngine:
    """
    Advanced workflow analytics engine providing comprehensive metrics,
    dashboards, and reporting capabilities
    """

    def __init__(self):
        self.cache_timeout = 300  # 5 minutes cache for performance

    def get_progress_dashboard(
        self,
        organization: Optional[Any] = None,
        user: Optional[User] = None,
        date_range: Optional[Tuple[datetime, datetime]] = None
    ) -> ProgressDashboard:
        """Get real-time workflow progress dashboard"""
        
        # Build base queryset
        workflows = WorkflowInstance.objects.all()
        
        if organization:
            workflows = workflows.filter(organization=organization)
        
        if user:
            workflows = workflows.filter(
                Q(created_by=user) | Q(assigned_to=user) | 
                Q(step_instances__assigned_to=user)
            ).distinct()
        
        if date_range:
            workflows = workflows.filter(
                created_at__range=date_range
            )
        
        # Calculate key metrics
        total_workflows = workflows.count()
        
        active_workflows = workflows.filter(
            status=WorkflowInstanceStatus.IN_PROGRESS
        ).count()
        
        completed_workflows = workflows.filter(
            status=WorkflowInstanceStatus.COMPLETED
        ).count()
        
        overdue_workflows = workflows.filter(
            due_date__lt=timezone.now(),
            status__in=[WorkflowInstanceStatus.PENDING, WorkflowInstanceStatus.IN_PROGRESS]
        ).count()
        
        # Completion rate
        completion_rate = (completed_workflows / total_workflows * 100) if total_workflows > 0 else 0
        
        # Average cycle time (in days)
        completed_with_times = workflows.filter(
            status=WorkflowInstanceStatus.COMPLETED,
            completed_date__isnull=False,
            start_date__isnull=False
        )
        
        if completed_with_times.exists():
            cycle_times = []
            for wf in completed_with_times:
                delta = wf.completed_date - wf.start_date
                cycle_times.append(delta.total_seconds() / 86400)  # Convert to days
            average_cycle_time = sum(cycle_times) / len(cycle_times)
        else:
            average_cycle_time = 0
        
        # Quality score
        quality_results = QualityCheckResult.objects.filter(
            step_instance__workflow_instance__in=workflows
        )
        
        if quality_results.exists():
            avg_quality = quality_results.aggregate(avg_score=Avg('score'))['avg_score']
            quality_score = float(avg_quality) if avg_quality else 0
        else:
            quality_score = 0
        
        # Status distribution
        status_distribution = dict(workflows.values_list('status').annotate(Count('status')))
        
        # Top bottlenecks
        bottlenecks = self._identify_bottlenecks(workflows)
        
        # Recent completions
        recent_completions = self._get_recent_completions(workflows.filter(
            status=WorkflowInstanceStatus.COMPLETED
        ))
        
        # Template performance
        template_performance = self._get_template_performance(workflows)
        
        return ProgressDashboard(
            total_workflows=total_workflows,
            active_workflows=active_workflows,
            completed_workflows=completed_workflows,
            overdue_workflows=overdue_workflows,
            completion_rate=completion_rate,
            average_cycle_time=average_cycle_time,
            quality_score=quality_score,
            top_bottlenecks=bottlenecks,
            recent_completions=recent_completions,
            status_distribution=status_distribution,
            template_performance=template_performance,
            updated_at=timezone.now()
        )

    def _identify_bottlenecks(self, workflows) -> List[Dict[str, Any]]:
        """Identify workflow bottlenecks"""
        
        # Find steps with longest average actual hours
        step_metrics = WorkflowStepInstance.objects.filter(
            workflow_instance__in=workflows,
            status=StepStatus.COMPLETED,
            actual_hours__isnull=False
        ).values(
            'workflow_step__name',
            'workflow_step__step_type',
            'workflow_step__workflow_template__name'
        ).annotate(
            avg_duration_hours=Avg('actual_hours'),
            instance_count=Count('id'),
            overdue_count=Count(
                Case(
                    When(completed_date__gt=F('due_date'), then=1),
                    default=Value(0),
                    output_field=IntegerField()
                )
            )
        ).order_by('-avg_duration_hours')[:10]
        
        bottlenecks = []
        for metric in step_metrics:
            bottlenecks.append({
                'step_name': metric['workflow_step__name'],
                'step_type': metric['workflow_step__step_type'],
                'template_name': metric['workflow_step__workflow_template__name'],
                'avg_duration_days': round(metric['avg_duration_hours'] / 24.0, 2) if metric['avg_duration_hours'] else 0,
                'instance_count': metric['instance_count'],
                'overdue_count': metric['overdue_count'],
                'overdue_rate': (metric['overdue_count'] / metric['instance_count'] * 100) if metric['instance_count'] > 0 else 0
            })
        
        return bottlenecks

    def _get_recent_completions(self, completed_workflows, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent workflow completions"""
        
        recent = completed_workflows.order_by('-completed_date')[:limit]
        
        completions = []
        for wf in recent:
            cycle_time = None
            if wf.completed_date and wf.start_date:
                delta = wf.completed_date - wf.start_date
                cycle_time = delta.total_seconds() / 86400  # Days
            
            completions.append({
                'id': str(wf.id),
                'name': wf.name,
                'template_name': wf.workflow_template.name,
                'completed_date': wf.completed_date.isoformat() if wf.completed_date else None,
                'cycle_time_days': round(cycle_time, 2) if cycle_time else None,
                'quality_score': wf.quality_score,
                'assigned_to': wf.assigned_to.get_full_name() if wf.assigned_to else None
            })
        
        return completions

    def _get_template_performance(self, workflows) -> List[Dict[str, Any]]:
        """Get performance metrics by template"""
        
        template_metrics = workflows.values(
            'workflow_template__id',
            'workflow_template__name'
        ).annotate(
            total_instances=Count('id'),
            completed_instances=Count(
                Case(
                    When(status=WorkflowInstanceStatus.COMPLETED, then=1),
                    default=Value(0),
                    output_field=IntegerField()
                )
            ),
            avg_quality_score=Avg('quality_score'),
            avg_progress=Avg('progress_percentage')
        ).order_by('-total_instances')
        
        performance = []
        for metric in template_metrics:
            completion_rate = (
                metric['completed_instances'] / metric['total_instances'] * 100
            ) if metric['total_instances'] > 0 else 0
            
            performance.append({
                'template_id': str(metric['workflow_template__id']),
                'template_name': metric['workflow_template__name'],
                'total_instances': metric['total_instances'],
                'completed_instances': metric['completed_instances'],
                'completion_rate': round(completion_rate, 2),
                'avg_quality_score': round(float(metric['avg_quality_score']), 2) if metric['avg_quality_score'] else 0,
                'avg_progress': round(float(metric['avg_progress']), 2) if metric['avg_progress'] else 0
            })
        
        return performance

    def get_realtime_metrics(
        self,
        organization: Optional[Any] = None
    ) -> Dict[str, Any]:
        """Get real-time workflow metrics for dashboard updates"""
        
        workflows = WorkflowInstance.objects.all()
        
        if organization:
            workflows = workflows.filter(organization=organization)
        
        # Current active workflows
        active_count = workflows.filter(
            status=WorkflowInstanceStatus.IN_PROGRESS
        ).count()
        
        # Workflows completed today
        today = timezone.now().date()
        completed_today = workflows.filter(
            completed_date__date=today,
            status=WorkflowInstanceStatus.COMPLETED
        ).count()
        
        # Overdue workflows
        overdue_count = workflows.filter(
            due_date__lt=timezone.now(),
            status__in=[WorkflowInstanceStatus.PENDING, WorkflowInstanceStatus.IN_PROGRESS]
        ).count()
        
        # Quality checks in last hour
        last_hour = timezone.now() - timedelta(hours=1)
        recent_quality_checks = QualityCheckResult.objects.filter(
            step_instance__workflow_instance__in=workflows,
            checked_at__gte=last_hour
        ).count()
        
        return {
            'active_workflows': active_count,
            'completed_today': completed_today,
            'overdue_workflows': overdue_count,
            'recent_quality_checks': recent_quality_checks,
            'timestamp': timezone.now().isoformat()
        }

    def generate_compliance_report(
        self,
        start_date: datetime,
        end_date: datetime,
        organization: Optional[Any] = None
    ) -> ComplianceReport:
        """Generate compliance and audit report"""
        
        # Build base queryset
        workflows = WorkflowInstance.objects.filter(
            created_at__range=(start_date, end_date)
        )
        
        if organization:
            workflows = workflows.filter(organization=organization)
        
        total_workflows = workflows.count()
        
        # Compliance rate (workflows that passed all required quality controls)
        compliant_workflows = 0
        for wf in workflows:
            required_qc = QualityControl.objects.filter(
                Q(workflow_template=wf.workflow_template) |
                Q(workflow_step__workflow_template=wf.workflow_template),
                is_required=True
            ).count()
            
            passed_qc = QualityCheckResult.objects.filter(
                step_instance__workflow_instance=wf,
                quality_control__is_required=True,
                passed=True
            ).count()
            
            if required_qc == 0 or passed_qc >= required_qc:
                compliant_workflows += 1
        
        compliance_rate = (compliant_workflows / total_workflows * 100) if total_workflows > 0 else 0
        
        # Audit trail entries (count entries in audit_log fields)
        audit_entries = 0
        for wf in workflows:
            audit_entries += len(wf.audit_log) if wf.audit_log else 0
        
        # Security events (from audit logs)
        security_events = []
        security_count = {}
        
        for wf in workflows:
            if wf.audit_log:
                for entry in wf.audit_log:
                    action = entry.get('action', '')
                    if any(word in action for word in ['unauthorized', 'security', 'violation', 'access_denied']):
                        event_type = action
                        security_count[event_type] = security_count.get(event_type, 0) + 1
        
        for event_type, count in security_count.items():
            security_events.append({
                'event_type': event_type,
                'count': count,
                'severity': 'High' if 'violation' in event_type else 'Medium'
            })
        
        # Policy violations
        policy_violations = []
        
        # Missed deadlines
        overdue_workflows = workflows.filter(
            due_date__lt=timezone.now(),
            status__in=[WorkflowInstanceStatus.PENDING, WorkflowInstanceStatus.IN_PROGRESS]
        ).count()
        
        if overdue_workflows > 0:
            policy_violations.append({
                'violation_type': 'Missed Deadlines',
                'count': overdue_workflows,
                'severity': 'High',
                'description': f'{overdue_workflows} workflows are past their due date'
            })
        
        # Access patterns
        access_patterns = {
            'total_users': workflows.values('assigned_to').distinct().count(),
            'avg_workflows_per_user': total_workflows / workflows.values('assigned_to').distinct().count() if workflows.values('assigned_to').distinct().count() > 0 else 0,
            'peak_activity_hours': self._get_peak_activity_hours(workflows),
            'external_integrations': self._count_external_integrations(workflows)
        }
        
        # Compliance recommendations
        recommendations = []
        if compliance_rate < 95:
            recommendations.append(
                f"Compliance rate is {compliance_rate:.1f}%. Review quality control "
                "processes and ensure all required checks are properly implemented."
            )
        
        if overdue_workflows > 0:
            recommendations.append(
                f"{overdue_workflows} workflows are overdue. Consider adjusting "
                "deadlines or adding automated reminders."
            )
        
        if not recommendations:
            recommendations.append("Compliance metrics are within acceptable ranges.")
        
        return ComplianceReport(
            period=f"{start_date.date()} to {end_date.date()}",
            total_workflows=total_workflows,
            compliant_workflows=compliant_workflows,
            compliance_rate=compliance_rate,
            audit_trail_entries=audit_entries,
            security_events=security_events,
            policy_violations=policy_violations,
            access_patterns=access_patterns,
            recommendations=recommendations
        )

    def _get_peak_activity_hours(self, workflows) -> List[int]:
        """Get peak activity hours based on workflow creation times"""
        
        activity_by_hour = workflows.annotate(
            hour=Extract('hour', 'created_at')
        ).values('hour').annotate(
            workflow_count=Count('id')
        ).order_by('-workflow_count')
        
        return [item['hour'] for item in activity_by_hour[:3]]  # Top 3 hours

    def _count_external_integrations(self, workflows) -> int:
        """Count workflows that use external integrations"""
        
        # Check audit logs for integration-related entries
        integration_count = 0
        
        for wf in workflows:
            if wf.audit_log:
                for entry in wf.audit_log:
                    action = entry.get('action', '')
                    if 'integration' in action.lower() or 'hook' in action.lower():
                        integration_count += 1
                        break  # Count each workflow only once
        
        return integration_count


# Global analytics engine instances
quality_analytics = QualityAnalyticsEngine()
workflow_analytics = WorkflowAnalyticsEngine()