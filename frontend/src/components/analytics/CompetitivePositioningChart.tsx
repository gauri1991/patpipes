'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, TrendingUp, Award, Target } from 'lucide-react';

interface CompetitorData {
  name: string;
  totalPatents: number;
  activePatents: number;
  recentFilings: number;
  marketShare: number;
  innovationScore: number;
  strength: number;
  threat: number;
  growthRate: number;
  categories: {
    [key: string]: number;
  };
  color?: string;
}

interface CompetitivePositioningChartProps {
  data: CompetitorData[];
  currentCompany?: string;
  title?: string;
  description?: string;
}

export function CompetitivePositioningChart({
  data,
  currentCompany,
  title = "Competitive Positioning Analysis",
  description = "Patent portfolio and market positioning comparison"
}: CompetitivePositioningChartProps) {

  // Prepare radar chart data for competitive analysis
  const radarData = data.slice(0, 6).map(competitor => ({
    company: competitor.name,
    patentCount: Math.min(competitor.totalPatents / 100, 100), // Normalize to 100
    innovation: competitor.innovationScore,
    marketShare: competitor.marketShare,
    growth: Math.max(0, Math.min(competitor.growthRate + 50, 100)), // Normalize growth rate
    activity: Math.min(competitor.recentFilings / 10, 100), // Normalize activity
  }));

  // Prepare portfolio comparison data
  const portfolioData = data.map(competitor => ({
    name: competitor.name.length > 12 ? competitor.name.substring(0, 12) + '...' : competitor.name,
    fullName: competitor.name,
    patents: competitor.totalPatents,
    active: competitor.activePatents,
    recent: competitor.recentFilings,
    isCurrentCompany: competitor.name === currentCompany
  }));

  const getThreatLevel = (threat: number) => {
    if (threat > 70) return { label: 'High', color: 'destructive' };
    if (threat > 40) return { label: 'Medium', color: 'default' };
    return { label: 'Low', color: 'secondary' };
  };

  const getCompetitorIcon = (competitor: CompetitorData) => {
    if (competitor.name === currentCompany) return <Building2 className="w-4 h-4 text-blue-600" />;
    if (competitor.threat > 70) return <Target className="w-4 h-4 text-red-600" />;
    if (competitor.growthRate > 20) return <TrendingUp className="w-4 h-4 text-green-600" />;
    return <Award className="w-4 h-4 text-gray-600" />;
  };

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#0088fe'];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="positioning" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="positioning">Market Position</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio Size</TabsTrigger>
            <TabsTrigger value="analysis">Competitive Analysis</TabsTrigger>
          </TabsList>

          {/* Market Positioning Radar Chart */}
          <TabsContent value="positioning" className="space-y-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis 
                    dataKey="company" 
                    tick={{ fontSize: 10, fill: '#6b7280' }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tick={{ fontSize: 8, fill: '#9ca3af' }}
                  />
                  
                  <Radar
                    name="Patent Count"
                    dataKey="patentCount"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Innovation Score"
                    dataKey="innovation"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  <Radar
                    name="Market Share"
                    dataKey="marketShare"
                    stroke="#ffc658"
                    fill="#ffc658"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                  
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${parseFloat(value).toFixed(1)}${name === 'growth' ? '%' : ''}`, 
                      name.charAt(0).toUpperCase() + name.slice(1)
                    ]}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Portfolio Size Comparison */}
          <TabsContent value="portfolio" className="space-y-4">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={portfolioData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="#666"
                    fontSize={11}
                  />
                  <YAxis 
                    stroke="#666"
                    fontSize={12}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => {
                      const formatName = {
                        patents: 'Total Patents',
                        active: 'Active Patents',
                        recent: 'Recent Filings'
                      }[name] || name;
                      return [value.toLocaleString(), formatName];
                    }}
                    labelFormatter={(label) => {
                      const item = portfolioData.find(d => d.name === label);
                      return item?.fullName || label;
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="patents" 
                    name="Total Patents"
                    fill="#8884d8"
                    radius={[2, 2, 0, 0]}
                  >
                    {portfolioData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.isCurrentCompany ? '#3b82f6' : '#8884d8'}
                      />
                    ))}
                  </Bar>
                  <Bar 
                    dataKey="active" 
                    name="Active Patents"
                    fill="#82ca9d"
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="recent" 
                    name="Recent Filings"
                    fill="#ffc658"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          {/* Competitive Analysis */}
          <TabsContent value="analysis" className="space-y-4">
            <div className="space-y-4">
              {data.slice(0, 8).map((competitor, index) => {
                const threatLevel = getThreatLevel(competitor.threat);
                return (
                  <div key={index} className={`p-4 rounded-lg border-2 ${
                    competitor.name === currentCompany ? 'border-blue-200 bg-blue-50' : 'border-gray-100'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getCompetitorIcon(competitor)}
                        <div>
                          <h4 className="font-semibold text-lg">
                            {competitor.name}
                            {competitor.name === currentCompany && (
                              <Badge className="ml-2" variant="outline">Your Company</Badge>
                            )}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {competitor.totalPatents.toLocaleString()} patents • {competitor.marketShare.toFixed(1)}% market share
                          </p>
                        </div>
                      </div>
                      <Badge variant={threatLevel.color as any}>
                        {threatLevel.label} Threat
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {competitor.innovationScore}
                        </p>
                        <p className="text-xs text-gray-500">Innovation Score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {competitor.growthRate > 0 ? '+' : ''}{competitor.growthRate}%
                        </p>
                        <p className="text-xs text-gray-500">Growth Rate</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">
                          {competitor.recentFilings}
                        </p>
                        <p className="text-xs text-gray-500">Recent Filings</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">
                          {competitor.strength}
                        </p>
                        <p className="text-xs text-gray-500">Strength Score</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button size="sm" variant="outline">
                <Target className="w-4 h-4 mr-2" />
                Track Competitors
              </Button>
              <Button size="sm" variant="outline">
                <TrendingUp className="w-4 h-4 mr-2" />
                Market Analysis
              </Button>
              <Button size="sm" variant="outline">
                Generate Report
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}