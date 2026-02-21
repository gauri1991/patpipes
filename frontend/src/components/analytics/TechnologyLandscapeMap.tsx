'use client';

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, TrendingUp, AlertTriangle, Target } from 'lucide-react';

interface TechnologyNode {
  name: string;
  x: number; // Innovation level
  y: number; // Market maturity
  size: number; // Patent count
  patents: number;
  companies: number;
  growth: number;
  category: string;
  risk: 'low' | 'medium' | 'high';
  opportunity: 'low' | 'medium' | 'high';
  color?: string;
}

interface TechnologyLandscapeMapProps {
  data: TechnologyNode[];
  title?: string;
  description?: string;
  showMetrics?: boolean;
}

export function TechnologyLandscapeMap({
  data,
  title = "Technology Landscape Map",
  description = "Innovation vs Market Maturity positioning",
  showMetrics = true
}: TechnologyLandscapeMapProps) {
  
  const getQuadrantLabel = (x: number, y: number) => {
    if (x >= 50 && y >= 50) return 'Established Leaders';
    if (x >= 50 && y < 50) return 'Emerging Technologies';
    if (x < 50 && y >= 50) return 'Mature Markets';
    return 'Niche Applications';
  };

  const getQuadrantColor = (x: number, y: number) => {
    if (x >= 50 && y >= 50) return '#10B981'; // Green - Leaders
    if (x >= 50 && y < 50) return '#F59E0B'; // Yellow - Emerging
    if (x < 50 && y >= 50) return '#6B7280'; // Gray - Mature
    return '#EF4444'; // Red - Niche
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium': return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      default: return <Target className="w-4 h-4 text-green-500" />;
    }
  };

  const getOpportunityBadge = (opportunity: string) => {
    const variants = {
      high: 'default',
      medium: 'secondary', 
      low: 'outline'
    } as const;
    return <Badge variant={variants[opportunity as keyof typeof variants]}>{opportunity} opportunity</Badge>;
  };

  const formatTooltip = (value: any, name: string, props: any) => {
    const data = props.payload;
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-semibold text-lg">{data.name}</p>
        <p className="text-sm text-gray-600">{data.category}</p>
        <div className="mt-2 space-y-1">
          <p><span className="font-medium">Patents:</span> {data.patents.toLocaleString()}</p>
          <p><span className="font-medium">Companies:</span> {data.companies}</p>
          <p><span className="font-medium">Growth:</span> {data.growth > 0 ? '+' : ''}{data.growth}%</p>
          <p><span className="font-medium">Innovation Level:</span> {data.x}/100</p>
          <p><span className="font-medium">Market Maturity:</span> {data.y}/100</p>
        </div>
        <div className="mt-2 flex items-center gap-2">
          {getRiskIcon(data.risk)}
          {getOpportunityBadge(data.opportunity)}
        </div>
      </div>
    );
  };

  const maxSize = Math.max(...data.map(d => d.size));
  const minSize = Math.min(...data.map(d => d.size));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Quadrant Labels */}
          <div className="absolute top-4 left-4 z-10">
            <div className="grid grid-cols-2 gap-8 text-xs font-medium text-gray-500 pointer-events-none">
              <div>Niche<br/>Applications</div>
              <div>Emerging<br/>Technologies</div>
              <div>Mature<br/>Markets</div>
              <div>Established<br/>Leaders</div>
            </div>
          </div>

          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart 
                data={data}
                margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
              >
                {/* Quadrant background */}
                <defs>
                  <pattern id="quadrant1" patternUnits="userSpaceOnUse" width="4" height="4">
                    <rect width="4" height="4" fill="#f0fdf4" />
                  </pattern>
                  <pattern id="quadrant2" patternUnits="userSpaceOnUse" width="4" height="4">
                    <rect width="4" height="4" fill="#fffbeb" />
                  </pattern>
                  <pattern id="quadrant3" patternUnits="userSpaceOnUse" width="4" height="4">
                    <rect width="4" height="4" fill="#f9fafb" />
                  </pattern>
                  <pattern id="quadrant4" patternUnits="userSpaceOnUse" width="4" height="4">
                    <rect width="4" height="4" fill="#fef2f2" />
                  </pattern>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                
                {/* Quadrant divider lines */}
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#d1d5db" strokeWidth={1} />
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#d1d5db" strokeWidth={1} />
                
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  domain={[0, 100]}
                  name="Innovation Level"
                  stroke="#666"
                  fontSize={12}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  domain={[0, 100]}
                  name="Market Maturity"
                  stroke="#666"
                  fontSize={12}
                />
                
                <Tooltip content={formatTooltip} />
                
                <Scatter 
                  name="Technologies" 
                  data={data}
                  fill="#8884d8"
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color || getQuadrantColor(entry.x, entry.y)}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {showMetrics && (
          <div className="mt-6 space-y-4">
            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Established Leaders</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Emerging Technologies</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <span>Mature Markets</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Niche Applications</span>
              </div>
            </div>

            {/* Top Technologies by Quadrant */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">High Opportunity Areas</h4>
                <div className="space-y-1">
                  {data
                    .filter(d => d.opportunity === 'high')
                    .sort((a, b) => b.patents - a.patents)
                    .slice(0, 3)
                    .map((tech, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{tech.name}</span>
                        <Badge variant="outline">{tech.patents} patents</Badge>
                      </div>
                    ))
                  }
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Fast Growing Areas</h4>
                <div className="space-y-1">
                  {data
                    .sort((a, b) => b.growth - a.growth)
                    .slice(0, 3)
                    .map((tech, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="font-medium">{tech.name}</span>
                        <Badge variant="outline">+{tech.growth}%</Badge>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>

            {/* Action Items */}
            <div className="flex gap-2 pt-4">
              <Button size="sm" variant="outline">
                <Zap className="w-4 h-4 mr-2" />
                Export Analysis
              </Button>
              <Button size="sm" variant="outline">
                <TrendingUp className="w-4 h-4 mr-2" />
                Track Technologies
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}