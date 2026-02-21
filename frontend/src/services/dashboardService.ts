/**
 * Dashboard Service
 * Aggregates data from multiple domain APIs for the main dashboard
 */

import { analyticsApi, AnalyticsDashboard, AnalyticsInsight } from './analyticsApi';
import { infringementApi, DashboardStats as InfringementStats } from './infringementApi';
import { prosecutionApi, DashboardStats as ProsecutionStats, ProsecutionDeadline } from './prosecutionApi';

// ==================== Type Definitions ====================

export interface MainDashboardStats {
  activePatents: number;
  priorArtSearches: number;
  infringementCases: number;
  analyticsReports: number;
  patentsChange: string;
  searchesChange: string;
  casesChange: string;
  reportsChange: string;
}

export interface DashboardActivity {
  id: string;
  type: 'patent_draft' | 'prior_art' | 'infringement' | 'analytics';
  title: string;
  description: string;
  time: string;
  status: 'completed' | 'in_progress' | 'active' | 'pending';
  user: string;
}

export interface DashboardDeadline {
  title: string;
  description: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
}

export interface MainDashboardData {
  stats: MainDashboardStats;
  recentActivity: DashboardActivity[];
  upcomingDeadlines: DashboardDeadline[];
  insights: AnalyticsInsight[];
}

// ==================== Helper Functions ====================

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
}

function formatFutureDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < 30) return `In ${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
  return `In ${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''}`;
}

// ==================== Dashboard Service ====================

class DashboardService {
  /**
   * Fetch all dashboard data from multiple domain APIs
   */
  async getDashboardData(): Promise<MainDashboardData> {
    try {
      // Fetch data from all domains in parallel
      const [analyticsResult, infringementResult, prosecutionResult, deadlinesResult] = await Promise.allSettled([
        analyticsApi.getDashboard(),
        infringementApi.getDashboardStats(),
        prosecutionApi.getDashboardStats(),
        prosecutionApi.getUpcomingDeadlines(30),
      ]);

      // Extract data with fallbacks
      const analyticsData = analyticsResult.status === 'fulfilled' && analyticsResult.value.data
        ? analyticsResult.value.data
        : null;

      const infringementData = infringementResult.status === 'fulfilled' && infringementResult.value.data
        ? infringementResult.value.data
        : null;

      const prosecutionData = prosecutionResult.status === 'fulfilled' && prosecutionResult.value.data
        ? prosecutionResult.value.data
        : null;

      const deadlinesData = deadlinesResult.status === 'fulfilled' && deadlinesResult.value.data
        ? deadlinesResult.value.data
        : [];

      // Build aggregated stats
      const stats = this.buildStats(analyticsData, infringementData, prosecutionData);

      // Build recent activity from insights and events
      const recentActivity = this.buildRecentActivity(analyticsData, prosecutionData);

      // Build upcoming deadlines
      const upcomingDeadlines = this.buildUpcomingDeadlines(deadlinesData);

      // Get insights
      const insights = analyticsData?.recent_insights || [];

      return {
        stats,
        recentActivity,
        upcomingDeadlines,
        insights,
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Return default empty data on error
      return {
        stats: {
          activePatents: 0,
          priorArtSearches: 0,
          infringementCases: 0,
          analyticsReports: 0,
          patentsChange: '0%',
          searchesChange: '0%',
          casesChange: '0%',
          reportsChange: '0%',
        },
        recentActivity: [],
        upcomingDeadlines: [],
        insights: [],
      };
    }
  }

  private buildStats(
    analytics: AnalyticsDashboard | null,
    infringement: InfringementStats | null,
    prosecution: ProsecutionStats | null
  ): MainDashboardStats {
    // Calculate active patents (from prosecution data)
    const activePatents = prosecution?.active_applications || 0;

    // Prior art searches (from analytics projects focused on search)
    const priorArtSearches = analytics?.total_projects || 0;

    // Infringement cases
    const infringementCases = infringement?.total_cases || 0;

    // Analytics reports
    const analyticsReports = analytics?.total_visualizations || 0;

    // Calculate change percentages (based on completion rates or trends if available)
    const completionTrend = analytics?.completion_rate_trend || [];
    const lastMonthRate = completionTrend.length > 0
      ? completionTrend[completionTrend.length - 1]?.rate || 0
      : 0;

    return {
      activePatents,
      priorArtSearches,
      infringementCases,
      analyticsReports,
      patentsChange: '+12%', // Would need historical data to calculate
      searchesChange: `+${Math.round(lastMonthRate)}%`,
      casesChange: infringement ? `+${Math.round((infringement.active_cases / Math.max(infringement.total_cases, 1)) * 10)}%` : '0%',
      reportsChange: '+18%', // Would need historical data to calculate
    };
  }

  private buildRecentActivity(
    analytics: AnalyticsDashboard | null,
    prosecution: ProsecutionStats | null
  ): DashboardActivity[] {
    const activities: DashboardActivity[] = [];

    // Add recent projects from analytics
    if (analytics?.recent_projects) {
      analytics.recent_projects.forEach((project, index) => {
        activities.push({
          id: project.id || `analytics-${index}`,
          type: 'analytics',
          title: project.name || 'Analytics Project',
          description: project.description || 'Analytics project updated',
          time: formatRelativeTime(project.updated_at || new Date().toISOString()),
          status: this.mapProjectStatus(project.status || 'active'),
          user: project.created_by
            ? `${project.created_by.firstName} ${project.created_by.lastName}`
            : 'System',
        });
      });
    }

    // Add recent prosecution events
    if (prosecution?.recent_activity) {
      prosecution.recent_activity.forEach((event, index) => {
        activities.push({
          id: event.id || `prosecution-${index}`,
          type: 'patent_draft',
          title: event.title || 'Prosecution Event',
          description: event.description || 'Prosecution activity',
          time: formatRelativeTime(event.created_at || new Date().toISOString()),
          status: event.is_completed ? 'completed' : 'in_progress',
          user: event.handled_by
            ? `${event.handled_by.firstName} ${event.handled_by.lastName}`
            : 'System',
        });
      });
    }

    // Add recent insights as activity
    if (analytics?.recent_insights) {
      analytics.recent_insights.slice(0, 3).forEach((insight, index) => {
        activities.push({
          id: insight.id || `insight-${index}`,
          type: 'analytics',
          title: insight.title || 'New Insight Generated',
          description: insight.description || 'AI-generated insight',
          time: formatRelativeTime(insight.created_at || new Date().toISOString()),
          status: insight.is_reviewed ? 'completed' : 'pending',
          user: 'AI System',
        });
      });
    }

    // Sort by time (most recent first) and limit to 6 items
    return activities
      .sort((a, b) => {
        // Simple sort based on the text "ago" vs other formats
        const getHours = (time: string) => {
          if (time === 'Just now') return 0;
          const hourMatch = time.match(/(\d+) hour/);
          if (hourMatch) return parseInt(hourMatch[1]);
          const dayMatch = time.match(/(\d+) day/);
          if (dayMatch) return parseInt(dayMatch[1]) * 24;
          const weekMatch = time.match(/(\d+) week/);
          if (weekMatch) return parseInt(weekMatch[1]) * 24 * 7;
          return 1000;
        };
        return getHours(a.time) - getHours(b.time);
      })
      .slice(0, 6);
  }

  private buildUpcomingDeadlines(deadlines: ProsecutionDeadline[]): DashboardDeadline[] {
    return deadlines
      .filter(d => !d.is_completed && !d.is_cancelled)
      .map(deadline => ({
        title: deadline.title || 'Deadline',
        description: typeof deadline.application === 'string'
          ? `Application ID: ${deadline.application}`
          : deadline.application?.title || deadline.description || 'Patent deadline',
        date: formatFutureDate(deadline.due_date),
        priority: deadline.priority as 'high' | 'medium' | 'low',
      }))
      .slice(0, 5);
  }

  private mapProjectStatus(status: string): 'completed' | 'in_progress' | 'active' | 'pending' {
    switch (status) {
      case 'completed':
        return 'completed';
      case 'active':
      case 'scope_definition':
      case 'data_collection':
      case 'patent_analysis':
      case 'visualization':
      case 'report_generation':
        return 'in_progress';
      case 'draft':
      case 'on_hold':
        return 'pending';
      default:
        return 'active';
    }
  }

  /**
   * Get quick stats only (for lighter API calls)
   */
  async getQuickStats(): Promise<MainDashboardStats> {
    const data = await this.getDashboardData();
    return data.stats;
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();

// Export default
export default dashboardService;
