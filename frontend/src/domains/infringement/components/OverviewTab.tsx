/**
 * OverviewTab - Infringement Dashboard Overview
 * Extracted from the infringement page monolith
 */

'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InfringementCase } from '@/services/infringementApi';
import * as Recharts from 'recharts';

interface OverviewTabProps {
  cases: InfringementCase[];
  casesLoading: boolean;
  statsLoading: boolean;
  stats: any;
  riskChartData: Array<{ name: string; value: number; color: string }>;
  statusChartData: Array<{ name: string; value: number }>;
  getRiskColor: (risk: string) => string;
}

export function OverviewTab({
  cases,
  casesLoading,
  statsLoading,
  stats,
  riskChartData,
  statusChartData,
  getRiskColor,
}: OverviewTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Cases */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Cases</CardTitle>
            <CardDescription>
              Latest infringement analysis activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {casesLoading ? (
                <div className="text-center py-8">Loading cases...</div>
              ) : cases.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No cases found. Create your first infringement case to get started.
                </div>
              ) : (
                cases.slice(0, 5).map((caseItem, index) => (
                  <div key={caseItem.id || `case-overview-${index}`} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <Shield className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{caseItem.case_name || 'Untitled Case'}</p>
                        <p className="text-xs text-muted-foreground">
                          {(caseItem as any).patent_detail ? (
                            <Link href={`/dashboard/portfolio/${(caseItem as any).patent_detail.portfolio_id}/patent/${(caseItem as any).patent_detail.id}`} className="text-blue-600 hover:underline">
                              {caseItem.patent_number || 'N/A'}
                            </Link>
                          ) : (
                            caseItem.patent_number || 'N/A'
                          )} vs {caseItem.accused_product_name || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <Badge className={getRiskColor(caseItem.risk_level || 'low')}>
                      {caseItem.risk_level || 'unknown'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
            <CardDescription>
              Cases by risk level
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="text-center py-8">Loading stats...</div>
            ) : (
              <div className="h-[300px]">
                <Recharts.ResponsiveContainer width="100%" height="100%">
                  <Recharts.PieChart>
                    <Recharts.Pie
                      data={riskChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {riskChartData.map((entry) => (
                        <Recharts.Cell key={`risk-cell-${entry.name}`} fill={entry.color} />
                      ))}
                    </Recharts.Pie>
                    <Recharts.Tooltip />
                  </Recharts.PieChart>
                </Recharts.ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Case Status Distribution</CardTitle>
          <CardDescription>
            Breakdown of cases by current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="text-center py-8">Loading stats...</div>
          ) : (
            <div className="h-[300px]">
              <Recharts.ResponsiveContainer width="100%" height="100%">
                <Recharts.BarChart data={statusChartData}>
                  <Recharts.CartesianGrid strokeDasharray="3 3" />
                  <Recharts.XAxis dataKey="name" />
                  <Recharts.YAxis />
                  <Recharts.Tooltip />
                  <Recharts.Legend />
                  <Recharts.Bar dataKey="value" fill="#3b82f6" name="Cases" />
                </Recharts.BarChart>
              </Recharts.ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Affected Portfolios */}
      {stats?.affected_portfolios?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Affected Portfolios</CardTitle>
            <CardDescription>
              Portfolios with linked infringement cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(stats.affected_portfolios as Array<{ id: string; name: string; company_name: string; active_cases: number }>).map((portfolio) => (
                <div key={portfolio.id} className="flex items-center justify-between border-b pb-3 last:border-b-0">
                  <div>
                    <Link
                      href={`/dashboard/portfolio/${portfolio.id}`}
                      className="font-medium text-sm text-blue-600 hover:underline"
                    >
                      {portfolio.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{portfolio.company_name}</p>
                  </div>
                  <Badge variant={portfolio.active_cases > 0 ? 'destructive' : 'secondary'}>
                    {portfolio.active_cases} active
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
