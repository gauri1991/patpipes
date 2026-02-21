'use client';

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, MapPin, TrendingUp, Users } from 'lucide-react';

interface GeographicData {
  country: string;
  region: string;
  patents: number;
  applications: number;
  grants: number;
  companies: number;
  growthRate: number;
  marketSize: number;
  density: number;
  coordinates?: [number, number]; // [lat, lng]
  color?: string;
}

interface GeographicDistributionMapProps {
  data: GeographicData[];
  title?: string;
  description?: string;
  showTrends?: boolean;
}

export function GeographicDistributionMap({
  data,
  title = "Geographic Patent Distribution",
  description = "Global patent filing and market analysis",
  showTrends = true
}: GeographicDistributionMapProps) {

  // Sort data by patent count for rankings
  const sortedData = [...data].sort((a, b) => b.patents - a.patents);
  
  // Prepare data for pie chart (top countries)
  const pieData = sortedData.slice(0, 8).map((item, index) => ({
    name: item.country,
    value: item.patents,
    percentage: ((item.patents / data.reduce((sum, d) => sum + d.patents, 0)) * 100).toFixed(1),
    color: `hsl(${index * 45}, 70%, 50%)`
  }));

  // Prepare data for trend analysis (regional comparison)
  const trendData = sortedData.slice(0, 10).map(item => ({
    country: item.country.length > 8 ? item.country.substring(0, 8) + '...' : item.country,
    fullName: item.country,
    patents: item.patents,
    applications: item.applications,
    grants: item.grants,
    growth: item.growthRate,
    grantRate: ((item.grants / item.applications) * 100).toFixed(1)
  }));

  const getRegionIcon = (region: string) => {
    const iconMap = {
      'North America': <Globe className="w-4 h-4 text-blue-500" />,
      'Europe': <MapPin className="w-4 h-4 text-green-500" />,
      'Asia-Pacific': <Users className="w-4 h-4 text-orange-500" />,
      'Latin America': <TrendingUp className="w-4 h-4 text-purple-500" />,
      'Africa': <Globe className="w-4 h-4 text-red-500" />,
      'Middle East': <MapPin className="w-4 h-4 text-yellow-500" />
    };
    return iconMap[region as keyof typeof iconMap] || <Globe className="w-4 h-4 text-gray-500" />;
  };

  const getGrowthBadge = (growth: number) => {
    if (growth > 20) return <Badge className="bg-green-500">High Growth</Badge>;
    if (growth > 10) return <Badge className="bg-blue-500">Growing</Badge>;
    if (growth > 0) return <Badge variant="secondary">Stable</Badge>;
    return <Badge variant="destructive">Declining</Badge>;
  };

  // Colors for the charts
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88', '#0088fe', '#ff8042', '#8dd1e1'];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="distribution" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="distribution">Market Share</TabsTrigger>
            <TabsTrigger value="trends">Filing Trends</TabsTrigger>
            <TabsTrigger value="regions">Regional Analysis</TabsTrigger>
          </TabsList>

          {/* Market Share Distribution */}
          <TabsContent value="distribution" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: string) => [
                        `${value.toLocaleString()} patents`, 
                        'Patent Count'
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Top Countries List */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-700">Top Patent Filing Countries</h4>
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {sortedData.slice(0, 10).map((country, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm w-6">#{index + 1}</span>
                        {getRegionIcon(country.region)}
                        <div>
                          <p className="font-medium">{country.country}</p>
                          <p className="text-xs text-gray-500">{country.region}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{country.patents.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{country.companies} companies</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Filing Trends */}
          <TabsContent value="trends" className="space-y-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="country" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="#666"
                    fontSize={11}
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#666"
                    fontSize={12}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#666"
                    fontSize={12}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      if (name === 'growth') return [`${value}%`, 'Growth Rate'];
                      return [value.toLocaleString(), name.charAt(0).toUpperCase() + name.slice(1)];
                    }}
                    labelFormatter={(label) => {
                      const item = trendData.find(d => d.country === label);
                      return item?.fullName || label;
                    }}
                  />
                  <Legend />
                  
                  <Bar 
                    yAxisId="left"
                    dataKey="patents" 
                    name="Total Patents"
                    fill="#8884d8"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    yAxisId="left"
                    dataKey="applications" 
                    name="Applications"
                    fill="#82ca9d"
                    radius={[2, 2, 0, 0]}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="growth" 
                    name="Growth Rate"
                    stroke="#ff7300" 
                    strokeWidth={3}
                    dot={{ fill: '#ff7300', strokeWidth: 2, r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Regional Analysis */}
          <TabsContent value="regions" className="space-y-4">
            {/* Regional Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(
                data.reduce((acc, country) => {
                  if (!acc[country.region]) {
                    acc[country.region] = {
                      patents: 0,
                      countries: 0,
                      companies: 0,
                      avgGrowth: 0
                    };
                  }
                  acc[country.region].patents += country.patents;
                  acc[country.region].countries += 1;
                  acc[country.region].companies += country.companies;
                  acc[country.region].avgGrowth += country.growthRate;
                  return acc;
                }, {} as Record<string, any>)
              ).map(([region, stats]) => {
                stats.avgGrowth = stats.avgGrowth / stats.countries;
                return (
                  <Card key={region}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getRegionIcon(region)}
                          <CardTitle className="text-base">{region}</CardTitle>
                        </div>
                        {getGrowthBadge(stats.avgGrowth)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Patents</p>
                          <p className="text-lg font-semibold">{stats.patents.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Countries</p>
                          <p className="text-lg font-semibold">{stats.countries}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Companies</p>
                          <p className="text-lg font-semibold">{stats.companies.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Growth</p>
                          <p className="text-lg font-semibold">
                            {stats.avgGrowth > 0 ? '+' : ''}{stats.avgGrowth.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Key Insights */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3">Key Geographic Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-blue-600">Largest Market</p>
                  <p>{sortedData[0]?.country} ({sortedData[0]?.patents.toLocaleString()} patents)</p>
                </div>
                <div>
                  <p className="font-medium text-green-600">Fastest Growing</p>
                  <p>
                    {data.reduce((max, country) => 
                      country.growthRate > max.growthRate ? country : max, data[0]
                    )?.country} ({data.reduce((max, country) => 
                      country.growthRate > max.growthRate ? country : max, data[0]
                    )?.growthRate.toFixed(1)}%)
                  </p>
                </div>
                <div>
                  <p className="font-medium text-purple-600">Most Active Companies</p>
                  <p>
                    {data.reduce((max, country) => 
                      country.companies > max.companies ? country : max, data[0]
                    )?.country} ({data.reduce((max, country) => 
                      country.companies > max.companies ? country : max, data[0]
                    )?.companies.toLocaleString()} companies)
                  </p>
                </div>
                <div>
                  <p className="font-medium text-orange-600">Total Global Patents</p>
                  <p>{data.reduce((sum, country) => sum + country.patents, 0).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Action Items */}
            <div className="flex gap-2 pt-4">
              <Button size="sm" variant="outline">
                <MapPin className="w-4 h-4 mr-2" />
                Export Map Data
              </Button>
              <Button size="sm" variant="outline">
                <TrendingUp className="w-4 h-4 mr-2" />
                Regional Report
              </Button>
              <Button size="sm" variant="outline">
                Market Analysis
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}