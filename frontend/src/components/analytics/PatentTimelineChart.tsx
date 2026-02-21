'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PatentTimelineData {
  year: number;
  filings: number;
  grants: number;
  applications: number;
  company?: string;
  trend?: 'increasing' | 'decreasing' | 'stable';
}

interface PatentTimelineChartProps {
  data: PatentTimelineData[];
  title?: string;
  description?: string;
  showTrend?: boolean;
  chartType?: 'line' | 'area';
}

export function PatentTimelineChart({
  data,
  title = "Patent Filing Timeline",
  description = "Historical patent filing and grant trends",
  showTrend = true,
  chartType = 'area'
}: PatentTimelineChartProps) {
  // Calculate growth trend
  const currentYear = new Date().getFullYear();
  const recentData = data.filter(d => d.year >= currentYear - 3);
  const avgGrowth = recentData.length > 1 
    ? ((recentData[recentData.length - 1].filings - recentData[0].filings) / recentData[0].filings) * 100
    : 0;

  const getTrendBadge = () => {
    if (avgGrowth > 10) return <Badge className="bg-green-500">Strong Growth</Badge>;
    if (avgGrowth > 0) return <Badge className="bg-blue-500">Growing</Badge>;
    if (avgGrowth > -10) return <Badge variant="secondary">Stable</Badge>;
    return <Badge variant="destructive">Declining</Badge>;
  };

  const formatTooltip = (value: any, name: string) => {
    const formatName = {
      filings: 'Patent Filings',
      grants: 'Patents Granted',
      applications: 'Applications Filed'
    }[name] || name;
    return [`${value.toLocaleString()}`, formatName];
  };

  const ChartComponent = chartType === 'area' ? AreaChart : LineChart;
  const DataComponent = chartType === 'area' ? Area : Line;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {showTrend && (
            <div className="flex items-center gap-2">
              {getTrendBadge()}
              <span className="text-sm text-muted-foreground">
                {avgGrowth > 0 ? '+' : ''}{avgGrowth.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="year" 
                stroke="#666"
                fontSize={12}
              />
              <YAxis 
                stroke="#666"
                fontSize={12}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip 
                formatter={formatTooltip}
                labelStyle={{ color: '#333' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #ccc',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              
              {chartType === 'area' ? (
                <>
                  <Area
                    type="monotone"
                    dataKey="applications"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                    name="Applications Filed"
                  />
                  <Area
                    type="monotone"
                    dataKey="grants"
                    stackId="1"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.3}
                    name="Patents Granted"
                  />
                  <Area
                    type="monotone"
                    dataKey="filings"
                    stackId="1"
                    stroke="#ffc658"
                    fill="#ffc658"
                    fillOpacity={0.3}
                    name="Total Filings"
                  />
                </>
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="filings"
                    stroke="#8884d8"
                    strokeWidth={3}
                    dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                    name="Patent Filings"
                  />
                  <Line
                    type="monotone"
                    dataKey="grants"
                    stroke="#82ca9d"
                    strokeWidth={3}
                    dot={{ fill: '#82ca9d', strokeWidth: 2, r: 4 }}
                    name="Patents Granted"
                  />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke="#ffc658"
                    strokeWidth={3}
                    dot={{ fill: '#ffc658', strokeWidth: 2, r: 4 }}
                    name="Applications Filed"
                  />
                </>
              )}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
        
        {data.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">Peak Year</p>
              <p className="font-semibold">
                {data.reduce((max, item) => item.filings > max.filings ? item : max, data[0]).year}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Total Patents</p>
              <p className="font-semibold">
                {data.reduce((sum, item) => sum + item.filings, 0).toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Grant Rate</p>
              <p className="font-semibold">
                {((data.reduce((sum, item) => sum + item.grants, 0) / data.reduce((sum, item) => sum + item.filings, 0)) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}