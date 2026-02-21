/**
 * PatentAnalytics Component
 * Analytics and visualizations for patent portfolio
 */

'use client';

import { 
  BarChart3, 
  TrendingUp,
  PieChart,
  Calendar,
  Globe,
  Users,
  FileText,
  AlertTriangle
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import { PatentSummary, PatentPortfolioStats } from '../types/patent.types';

interface PatentAnalyticsProps {
  portfolioStats: PatentPortfolioStats | null;
  patents: PatentSummary[];
}

export function PatentAnalytics({ portfolioStats, patents }: PatentAnalyticsProps) {
  if (!portfolioStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const total = portfolioStats.totalPatents || 0;
  const granted = portfolioStats.activePatents || portfolioStats.grantedPatents || 0;
  const grantRate = total > 0 ? (granted / total) * 100 : 0;
  const techCount = (portfolioStats.topTechnologies || []).length;

  const formatCurrency = (amount: number) => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(portfolioStats?.totalValue ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Estimated portfolio value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grant Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {grantRate.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {grantRate >= 65 ? 'Above' : 'Below'} industry average (65%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patents</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {portfolioStats?.totalPatents ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {techCount} technology area{techCount !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Cost</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(portfolioStats?.totalMaintenance ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Annual maintenance fees
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Technology Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Technology Portfolio
            </CardTitle>
            <CardDescription>
              Distribution of patents across technology areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(portfolioStats?.topTechnologies || []).map((tech) => (
                <div key={tech.technology} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{tech.technology}</span>
                    <span className="text-muted-foreground">
                      {tech.count} ({tech.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={tech.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Status Breakdown
            </CardTitle>
            <CardDescription>
              Patents by current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(portfolioStats?.statusDistribution || []).map((item) => (
                <div key={item.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="capitalize">
                      {item.status}
                    </Badge>
                    <span className="text-sm font-medium">
                      {item.count} patents
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {total > 0 ? ((item.count / total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filing Trends */}
      {(portfolioStats?.filingTrends || []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Filing Trends
            </CardTitle>
            <CardDescription>
              Patent filing activity over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {(portfolioStats?.filingTrends || []).map((trend) => (
                  <div key={`${trend.month}-${trend.year}`} className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {trend.filings}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {trend.month}
                    </div>
                    <div className="text-xs text-green-600">
                      {trend.grants} granted
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Health */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Health Indicators</CardTitle>
            <CardDescription>
              Key performance metrics for your patent portfolio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Grant Success Rate</span>
                  <span className="font-medium">{grantRate.toFixed(0)}%</span>
                </div>
                <Progress value={Math.min(grantRate, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {grantRate >= 65 ? 'Above' : 'Below'} industry benchmark (65%)
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Technology Areas</span>
                  <span className="font-medium">{techCount}</span>
                </div>
                <Progress value={Math.min(techCount * 10, 100)} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {techCount >= 5 ? 'Well-diversified' : 'Consider diversifying'} across technology areas
                </p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Active vs Expired</span>
                  <span className="font-medium">
                    {total > 0 ? ((granted / total) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <Progress value={total > 0 ? (granted / total) * 100 : 0} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {granted} active out of {total} total patents
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>
              Strategic recommendations for portfolio growth
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-green-700">Opportunity</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Consider filing in emerging markets like India and Brazil for key technologies.
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium text-yellow-700">Action Required</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  5 patents approaching maintenance fee deadlines in next 6 months.
                </p>
              </div>

              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-blue-700">Collaboration</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Partner with universities for research in quantum computing technologies.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}