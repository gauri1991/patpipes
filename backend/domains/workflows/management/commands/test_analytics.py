"""
Test Workflow Analytics System
Tests analytics engine, dashboard generation, and API endpoints
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
import json

from domains.workflows.models import WorkflowTemplate, WorkflowInstance, WorkflowStepInstance
from domains.workflows.analytics import workflow_analytics, quality_analytics
from domains.workflows.services import workflow_engine

User = get_user_model()


class Command(BaseCommand):
    help = 'Test workflow analytics and reporting system'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--test-dashboard',
            action='store_true',
            help='Test progress dashboard generation'
        )
        parser.add_argument(
            '--test-metrics',
            action='store_true',
            help='Test workflow metrics calculation'
        )
        parser.add_argument(
            '--test-quality',
            action='store_true',
            help='Test quality analytics'
        )
        parser.add_argument(
            '--test-all',
            action='store_true',
            help='Run all analytics tests'
        )
    
    def handle(self, *args, **options):
        if options['test_dashboard'] or options['test_all']:
            self.test_dashboard()
        
        if options['test_metrics'] or options['test_all']:
            self.test_metrics()
        
        if options['test_quality'] or options['test_all']:
            self.test_quality()
        
        if not any([options['test_dashboard'], options['test_metrics'], 
                   options['test_quality'], options['test_all']]):
            self.stdout.write("Use --test-dashboard, --test-metrics, --test-quality, or --test-all")
    
    def test_dashboard(self):
        """Test progress dashboard generation"""
        self.stdout.write("\n📊 Testing Progress Dashboard...")
        
        try:
            # Get admin user
            admin_user = User.objects.get(email='admin@patentplatform.com')
            
            # Test basic dashboard without filters
            self.stdout.write("  Test 1: Basic dashboard generation...")
            dashboard = workflow_analytics.get_progress_dashboard()
            
            self.stdout.write(f"    Total workflows: {dashboard.total_workflows}")
            self.stdout.write(f"    Active workflows: {dashboard.active_workflows}")
            self.stdout.write(f"    Completed workflows: {dashboard.completed_workflows}")
            self.stdout.write(f"    Completion rate: {dashboard.completion_rate:.2f}%")
            self.stdout.write(f"    Average cycle time: {dashboard.average_cycle_time:.2f} days")
            self.stdout.write(f"    Quality score: {dashboard.quality_score:.2f}")
            
            # Test dashboard with user filter
            self.stdout.write("  Test 2: Dashboard with user filter...")
            user_dashboard = workflow_analytics.get_progress_dashboard(user=admin_user)
            
            self.stdout.write(f"    User workflows: {user_dashboard.total_workflows}")
            self.stdout.write(f"    User completion rate: {user_dashboard.completion_rate:.2f}%")
            
            # Test dashboard with date range
            self.stdout.write("  Test 3: Dashboard with date range...")
            end_date = timezone.now()
            start_date = end_date - timedelta(days=30)
            
            range_dashboard = workflow_analytics.get_progress_dashboard(
                date_range=(start_date, end_date)
            )
            
            self.stdout.write(f"    30-day workflows: {range_dashboard.total_workflows}")
            
            # Test template performance
            self.stdout.write("  Test 4: Template performance analysis...")
            self.stdout.write(f"    Templates analyzed: {len(dashboard.template_performance)}")
            
            for i, template in enumerate(dashboard.template_performance[:3]):
                self.stdout.write(f"      {i+1}. {template['template_name']}: "
                                f"{template['completion_rate']:.1f}% completion, "
                                f"Quality: {template['avg_quality_score']:.1f}")
            
            # Test bottlenecks
            self.stdout.write("  Test 5: Bottleneck analysis...")
            self.stdout.write(f"    Bottlenecks found: {len(dashboard.top_bottlenecks)}")
            
            for i, bottleneck in enumerate(dashboard.top_bottlenecks[:3]):
                self.stdout.write(f"      {i+1}. {bottleneck['step_name']} "
                                f"({bottleneck['template_name']}): "
                                f"{bottleneck['avg_duration_days']:.1f} days avg")
            
            # Test realtime metrics
            self.stdout.write("  Test 6: Realtime metrics...")
            realtime = workflow_analytics.get_realtime_metrics()
            
            self.stdout.write(f"    Active now: {realtime['active_workflows']}")
            self.stdout.write(f"    Completed today: {realtime['completed_today']}")
            self.stdout.write(f"    Overdue: {realtime['overdue_workflows']}")
            self.stdout.write(f"    Recent quality checks: {realtime['recent_quality_checks']}")
            
            self.stdout.write(self.style.SUCCESS("✅ Dashboard tests completed successfully"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Dashboard test failed: {e}"))
            import traceback
            self.stdout.write(traceback.format_exc())
    
    def test_metrics(self):
        """Test workflow metrics calculation"""
        self.stdout.write("\n📈 Testing Workflow Metrics...")
        
        try:
            # Get test data
            all_workflows = WorkflowInstance.objects.all()
            workflows = all_workflows[:20] if all_workflows.count() > 20 else all_workflows
            
            if all_workflows.count() == 0:
                self.stdout.write("    No workflows found - creating test data first...")
                self._create_test_workflows()
                workflows = WorkflowInstance.objects.all()[:5]
            
            # Test bottleneck identification
            self.stdout.write("  Test 1: Bottleneck identification...")
            bottlenecks = workflow_analytics._identify_bottlenecks(all_workflows)
            
            self.stdout.write(f"    Bottlenecks identified: {len(bottlenecks)}")
            
            for i, bottleneck in enumerate(bottlenecks[:3]):
                self.stdout.write(f"      {i+1}. {bottleneck['step_name']}: "
                                f"{bottleneck['avg_duration_days']:.2f} days, "
                                f"{bottleneck['instance_count']} instances, "
                                f"{bottleneck['overdue_rate']:.1f}% overdue")
            
            # Test recent completions
            self.stdout.write("  Test 2: Recent completions...")
            completed_workflows = all_workflows.filter(status='completed')
            
            if completed_workflows.exists():
                recent = workflow_analytics._get_recent_completions(completed_workflows)
                self.stdout.write(f"    Recent completions: {len(recent)}")
                
                for i, completion in enumerate(recent[:3]):
                    self.stdout.write(f"      {i+1}. {completion['name']}: "
                                    f"Quality {completion['quality_score']}, "
                                    f"Cycle: {completion['cycle_time_days']} days")
            else:
                self.stdout.write("    No completed workflows found")
            
            # Test template performance
            self.stdout.write("  Test 3: Template performance...")
            performance = workflow_analytics._get_template_performance(all_workflows)
            
            self.stdout.write(f"    Templates analyzed: {len(performance)}")
            
            for i, template in enumerate(performance[:3]):
                self.stdout.write(f"      {i+1}. {template['template_name']}: "
                                f"{template['completion_rate']:.1f}% completion, "
                                f"{template['total_instances']} instances")
            
            self.stdout.write(self.style.SUCCESS("✅ Metrics tests completed successfully"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Metrics test failed: {e}"))
            import traceback
            self.stdout.write(traceback.format_exc())
    
    def test_quality(self):
        """Test quality analytics"""
        self.stdout.write("\n🔍 Testing Quality Analytics...")
        
        try:
            # Get admin user
            admin_user = User.objects.get(email='admin@patentplatform.com')
            
            # Test quality overview
            self.stdout.write("  Test 1: Quality overview...")
            
            end_date = timezone.now()
            start_date = end_date - timedelta(days=30)
            
            overview = quality_analytics.get_quality_overview(
                date_range=(start_date, end_date)
            )
            
            self.stdout.write(f"    Period: {overview['period']['days']} days")
            self.stdout.write(f"    Total checks: {overview['overview']['total_checks']}")
            self.stdout.write(f"    Passed checks: {overview['overview']['passed_checks']}")
            self.stdout.write(f"    Pass rate: {overview['overview']['pass_rate']:.2f}%")
            self.stdout.write(f"    Average score: {overview['overview']['average_score']}")
            
            # Test issues analysis
            if 'issues' in overview and overview['issues']:
                self.stdout.write("    Issues breakdown:")
                issues = overview['issues']
                self.stdout.write(f"      Critical: {issues.get('critical', 0)}")
                self.stdout.write(f"      Error: {issues.get('error', 0)}")
                self.stdout.write(f"      Warning: {issues.get('warning', 0)}")
                self.stdout.write(f"      Info: {issues.get('info', 0)}")
            
            # Test quality distribution
            if 'quality_distribution' in overview:
                self.stdout.write("    Quality distribution:")
                dist = overview['quality_distribution']
                self.stdout.write(f"      Excellent (90-100): {dist.get('excellent', 0)}")
                self.stdout.write(f"      Good (75-89): {dist.get('good', 0)}")
                self.stdout.write(f"      Fair (60-74): {dist.get('fair', 0)}")
                self.stdout.write(f"      Poor (0-59): {dist.get('poor', 0)}")
            
            # Test user quality metrics
            self.stdout.write("  Test 2: User quality metrics...")
            user_metrics = quality_analytics.get_user_quality_metrics(
                user=admin_user,
                date_range=(start_date, end_date)
            )
            
            self.stdout.write(f"    User total checks: {user_metrics.total_checks}")
            self.stdout.write(f"    User pass rate: {user_metrics.pass_rate:.2f}%")
            self.stdout.write(f"    User average score: {user_metrics.average_score}")
            self.stdout.write(f"    User improvement trend: {user_metrics.improvement_trend:.2f}")
            
            # Test quality dashboard
            self.stdout.write("  Test 3: Quality dashboard...")
            dashboard = quality_analytics.get_quality_dashboard_data(
                user=admin_user
            )
            
            self.stdout.write(f"    Dashboard alerts: {len(dashboard.get('alerts', []))}")
            self.stdout.write(f"    Dashboard recommendations: {len(dashboard.get('recommendations', []))}")
            self.stdout.write(f"    Pending reviews: {len(dashboard.get('pending_reviews', []))}")
            
            # Show some alerts and recommendations
            for alert in dashboard.get('alerts', [])[:2]:
                self.stdout.write(f"      Alert: {alert['message']}")
            
            for rec in dashboard.get('recommendations', [])[:2]:
                self.stdout.write(f"      Recommendation: {rec}")
            
            self.stdout.write(self.style.SUCCESS("✅ Quality analytics tests completed"))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"❌ Quality analytics test failed: {e}"))
            import traceback
            self.stdout.write(traceback.format_exc())
    
    def _create_test_workflows(self):
        """Create test workflows for metrics testing"""
        self.stdout.write("    Creating test workflows...")
        
        try:
            admin_user = User.objects.get(email='admin@patentplatform.com')
            template = WorkflowTemplate.objects.first()
            
            if not template:
                self.stdout.write("    No templates found - cannot create test workflows")
                return
            
            # Create 3 test workflows
            for i in range(3):
                try:
                    workflow = workflow_engine.create_workflow_instance(
                        template_id=str(template.id),
                        target_object=admin_user,
                        user=admin_user,
                        name=f"Analytics Test Workflow {i+1}",
                        priority='medium'
                    )
                    
                    self.stdout.write(f"      Created test workflow: {workflow.name}")
                    
                except Exception as e:
                    self.stdout.write(f"      Failed to create workflow {i+1}: {e}")
                    
        except Exception as e:
            self.stdout.write(f"    Failed to create test workflows: {e}")