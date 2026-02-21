/**
 * ProjectTechnologyAreasTab Component
 * Project-specific technology analysis with global taxonomy integration
 * Links to global technology database while providing project-focused insights
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Cpu,
  Plus,
  BarChart3,
  TrendingUp,
  Layers,
  Tag,
  Link,
  ExternalLink,
  ArrowUpRight,
  Eye,
  Settings,
  Filter,
  Search,
  AlertCircle,
  Lightbulb,
  Zap
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { AnalyticsProject } from '@/services/analyticsApi';

interface TechnologyArea {
  id: string;
  name: string;
  description: string;
  ipc_class: string;
  cpc_class: string;
  category: string;
  maturity_level: 'emerging' | 'developing' | 'mature' | 'declining';
  patent_count: number;
  growth_rate_6m: number;
  innovation_score: number;
  market_potential: 'high' | 'medium' | 'low';
  key_players: string[];
  related_technologies: string[];
  created_at: string;
  updated_at: string;
}

interface ProjectTechnologyAreasTabProps {
  projectId: string;
  project: AnalyticsProject;
}

export function ProjectTechnologyAreasTab({ projectId, project }: ProjectTechnologyAreasTabProps) {
  const [linkedTechnologies, setLinkedTechnologies] = useState<TechnologyArea[]>([]);
  const [availableTechnologies, setAvailableTechnologies] = useState<TechnologyArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Mock data - in real implementation, this would fetch from global database
    const mockLinkedTechnologies: TechnologyArea[] = [
      {
        id: 'tech1',
        name: 'Machine Learning Algorithms',
        description: 'Advanced ML algorithms for pattern recognition and prediction',
        ipc_class: 'G06N 20/00',
        cpc_class: 'G06N 20/00',
        category: 'Artificial Intelligence',
        maturity_level: 'developing',
        patent_count: 1567,
        growth_rate_6m: 34.5,
        innovation_score: 8.2,
        market_potential: 'high',
        key_players: ['Google', 'Microsoft', 'IBM'],
        related_technologies: ['Neural Networks', 'Deep Learning'],
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-09-15T14:30:00Z'
      },
      {
        id: 'tech2',
        name: 'Quantum Computing',
        description: 'Quantum information processing and computing systems',
        ipc_class: 'G06N 10/00',
        cpc_class: 'G06N 10/00',
        category: 'Quantum Technology',
        maturity_level: 'emerging',
        patent_count: 234,
        growth_rate_6m: 67.8,
        innovation_score: 9.1,
        market_potential: 'high',
        key_players: ['IBM', 'Google', 'Microsoft'],
        related_technologies: ['Quantum Algorithms', 'Superconducting Circuits'],
        created_at: '2024-02-10T15:20:00Z',
        updated_at: '2024-09-18T09:45:00Z'
      }
    ];

    const mockAvailableTechnologies: TechnologyArea[] = [
      {
        id: 'tech3',
        name: 'Blockchain Technology',
        description: 'Distributed ledger and cryptocurrency technologies',
        ipc_class: 'H04L 9/06',
        cpc_class: 'H04L 9/0643',
        category: 'Distributed Systems',
        maturity_level: 'mature',
        patent_count: 892,
        growth_rate_6m: 12.3,
        innovation_score: 7.4,
        market_potential: 'medium',
        key_players: ['Bitcoin', 'Ethereum', 'Hyperledger'],
        related_technologies: ['Cryptography', 'Smart Contracts'],
        created_at: '2024-01-20T11:30:00Z',
        updated_at: '2024-09-10T16:20:00Z'
      }
    ];

    setLinkedTechnologies(mockLinkedTechnologies);
    setAvailableTechnologies(mockAvailableTechnologies);
    setLoading(false);
  }, [project]);

  const getMaturityLevel = (level: string) => {
    switch (level) {
      case 'emerging': return { label: 'Emerging', color: 'bg-purple-100 text-purple-800', progress: 25 };
      case 'developing': return { label: 'Developing', color: 'bg-blue-100 text-blue-800', progress: 50 };
      case 'mature': return { label: 'Mature', color: 'bg-green-100 text-green-800', progress: 75 };
      case 'declining': return { label: 'Declining', color: 'bg-orange-100 text-orange-800', progress: 90 };
      default: return { label: 'Unknown', color: 'bg-gray-100 text-gray-800', progress: 50 };
    }
  };

  const getMarketPotential = (potential: string) => {
    switch (potential) {
      case 'high': return { label: 'High Potential', color: 'bg-green-100 text-green-800' };
      case 'medium': return { label: 'Medium Potential', color: 'bg-yellow-100 text-yellow-800' };
      case 'low': return { label: 'Low Potential', color: 'bg-red-100 text-red-800' };
      default: return { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'artificial intelligence': return <Lightbulb className="h-5 w-5 text-purple-600" />;
      case 'quantum technology': return <Zap className="h-5 w-5 text-blue-600" />;
      case 'distributed systems': return <Layers className="h-5 w-5 text-green-600" />;
      default: return <Cpu className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Cpu className="h-5 w-5 text-blue-600" />
            Project Technology Areas ({linkedTechnologies.length})
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Technology classification and analysis for this project scope
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View Global Taxonomy
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Link Technology
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Linked Technologies</p>
                <p className="text-2xl font-bold">{linkedTechnologies.length}</p>
              </div>
              <Cpu className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Emerging Tech</p>
                <p className="text-2xl font-bold text-purple-600">
                  {linkedTechnologies.filter(t => t.maturity_level === 'emerging').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Patents</p>
                <p className="text-2xl font-bold">
                  {linkedTechnologies.reduce((sum, t) => sum + t.patent_count, 0).toLocaleString()}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Innovation</p>
                <p className="text-2xl font-bold">
                  {linkedTechnologies.length > 0 
                    ? (linkedTechnologies.reduce((sum, t) => sum + (t.innovation_score || 0), 0) / linkedTechnologies.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technology Analysis */}
      {linkedTechnologies.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Cpu className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No technologies linked</h3>
            <p className="text-muted-foreground mb-6">
              Link technologies from the global taxonomy to analyze innovation trends for this project.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Browse Global Taxonomy
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add New Technology
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search linked technologies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Technologies List */}
          <div className="grid gap-6 md:grid-cols-2">
            {linkedTechnologies.map((technology) => {
              const maturity = getMaturityLevel(technology.maturity_level || 'developing');
              const market = getMarketPotential(technology.market_potential || 'medium');
              
              return (
                <Card key={technology.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {getCategoryIcon(technology.category)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{technology.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <span>{technology.category}</span>
                            <span>•</span>
                            <span>{technology.ipc_class}</span>
                          </CardDescription>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {technology.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Patents:</span>
                        <span className="font-medium ml-2">{technology.patent_count.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">6M Growth:</span>
                        <span className="font-medium ml-2 flex items-center gap-1">
                          {technology.growth_rate_6m.toFixed(1)}%
                          <ArrowUpRight className="h-3 w-3 text-green-600" />
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Innovation:</span>
                        <span className="font-medium ml-2">{technology.innovation_score?.toFixed(1) || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">CPC Class:</span>
                        <span className="font-medium ml-2">{technology.cpc_class}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Maturity Level</span>
                        <Badge className={maturity.color}>
                          {maturity.label}
                        </Badge>
                      </div>
                      <Progress value={maturity.progress} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Market Potential</span>
                        <Badge className={market.color}>
                          {market.label}
                        </Badge>
                      </div>
                    </div>

                    {technology.related_technologies && technology.related_technologies.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Related Technologies</div>
                        <div className="flex flex-wrap gap-1">
                          {technology.related_technologies.slice(0, 3).map((related, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {related}
                            </Badge>
                          ))}
                          {technology.related_technologies.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{technology.related_technologies.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Patent Analysis
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Integration Notice */}
      <Alert>
        <Link className="h-4 w-4" />
        <AlertDescription>
          This tab shows technologies specifically linked to this project. 
          <Button variant="link" className="p-0 ml-1 h-auto">
            Manage the global technology taxonomy
          </Button> 
          to add new classifications or update existing technology profiles.
        </AlertDescription>
      </Alert>
    </div>
  );
}