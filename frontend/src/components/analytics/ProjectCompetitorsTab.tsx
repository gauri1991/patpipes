/**
 * ProjectCompetitorsTab Component
 * Project-specific competitor analysis with global database integration
 * Links to global competitor intelligence while providing project-focused insights
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Link,
  ExternalLink,
  ArrowUpRight,
  Eye,
  Settings,
  Filter,
  Search,
  AlertCircle
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { AnalyticsProject, CompetitorProfile } from '@/services/analyticsApi';

interface ProjectCompetitorsTabProps {
  projectId: string;
  project: AnalyticsProject;
}

export function ProjectCompetitorsTab({ projectId, project }: ProjectCompetitorsTabProps) {
  const [linkedCompetitors, setLinkedCompetitors] = useState<CompetitorProfile[]>([]);
  const [availableCompetitors, setAvailableCompetitors] = useState<CompetitorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Mock data - in real implementation, this would fetch from global database
    const mockLinkedCompetitors: CompetitorProfile[] = project.competitors || [];
    const mockAvailableCompetitors: CompetitorProfile[] = [
      {
        id: 'comp1',
        name: 'TechCorp Industries',
        legal_name: 'TechCorp Industries Ltd.',
        aliases: ['TechCorp'],
        industry: 'Technology',
        headquarters: 'San Francisco, CA',
        website: 'https://techcorp.com',
        description: 'Leading AI technology company',
        total_patents: 1245,
        active_patents: 987,
        recent_filings: 156,
        technology_focus: { 'AI': 45, 'ML': 35, 'Cloud': 20 },
        filing_trends: { '2024-Q1': 40, '2024-Q2': 38, '2024-Q3': 42 },
        citation_metrics: { forward: 2500, backward: 1800 },
        collaboration_data: { partners: 15, joint_patents: 45 },
        strengths: ['Strong AI portfolio', 'Global presence'],
        weaknesses: ['Limited biotech presence'],
        threats: ['Emerging competitors'],
        opportunities: ['Quantum computing expansion'],
        confidence_score: 0.85,
        patent_applications_pending: 156,
        key_technology_areas: ['AI', 'Machine Learning'],
        top_inventors: ['Dr. Smith'],
        filing_trend_6_months: 23,
        avg_citations_per_patent: 8.5,
        patent_quality_score: 7.8,
        competitive_strength: 'high',
        market_focus: ['North America', 'Europe'],
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-09-15T14:30:00Z'
      }
    ];

    setLinkedCompetitors(mockLinkedCompetitors);
    setAvailableCompetitors(mockAvailableCompetitors);
    setLoading(false);
  }, [project]);

  const getCompetitorThreatLevel = (strength: string) => {
    switch (strength) {
      case 'high': return { level: 'High Threat', color: 'bg-red-100 text-red-800', progress: 85 };
      case 'medium': return { level: 'Medium Threat', color: 'bg-yellow-100 text-yellow-800', progress: 60 };
      case 'low': return { level: 'Low Threat', color: 'bg-green-100 text-green-800', progress: 30 };
      default: return { level: 'Unknown', color: 'bg-gray-100 text-gray-800', progress: 50 };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-red-600" />
            Project Competitors ({linkedCompetitors.length})
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Competitive intelligence and analysis for this project scope
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View Global Database
          </Button>
          <Button size="sm" className="bg-red-600 hover:bg-red-700">
            <Plus className="h-4 w-4 mr-2" />
            Link Competitor
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Linked Competitors</p>
                <p className="text-2xl font-bold">{linkedCompetitors.length}</p>
              </div>
              <Target className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Threats</p>
                <p className="text-2xl font-bold text-red-600">
                  {linkedCompetitors.filter(c => c.competitive_strength === 'high').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Patents</p>
                <p className="text-2xl font-bold">
                  {linkedCompetitors.reduce((sum, c) => sum + c.total_patents, 0).toLocaleString()}
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
                <p className="text-sm text-muted-foreground">Avg Quality</p>
                <p className="text-2xl font-bold">
                  {linkedCompetitors.length > 0 
                    ? (linkedCompetitors.reduce((sum, c) => sum + (c.patent_quality_score || 0), 0) / linkedCompetitors.length).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitor Analysis */}
      {linkedCompetitors.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No competitors linked</h3>
            <p className="text-muted-foreground mb-6">
              Link competitors from the global database to analyze competitive positioning for this project.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Browse Global Database
              </Button>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Add New Competitor
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
                placeholder="Search linked competitors..."
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

          {/* Competitors List */}
          <div className="grid gap-6 md:grid-cols-2">
            {linkedCompetitors.map((competitor) => {
              const threat = getCompetitorThreatLevel(competitor.competitive_strength || 'medium');
              
              return (
                <Card key={competitor.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <Building2 className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{competitor.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <span>{competitor.industry}</span>
                            <span>•</span>
                            <span>{competitor.headquarters}</span>
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
                      {competitor.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Patents:</span>
                        <span className="font-medium ml-2">{competitor.total_patents.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Active:</span>
                        <span className="font-medium ml-2">{competitor.active_patents.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quality Score:</span>
                        <span className="font-medium ml-2">{competitor.patent_quality_score?.toFixed(1) || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">6M Growth:</span>
                        <span className="font-medium ml-2 flex items-center gap-1">
                          {competitor.filing_trend_6_months || 0}
                          <ArrowUpRight className="h-3 w-3 text-green-600" />
                        </span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Threat Level</span>
                        <Badge className={threat.color}>
                          {threat.level}
                        </Badge>
                      </div>
                      <Progress value={threat.progress} className="h-2" />
                    </div>

                    {competitor.key_technology_areas && competitor.key_technology_areas.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground">Key Technologies</div>
                        <div className="flex flex-wrap gap-1">
                          {competitor.key_technology_areas.slice(0, 3).map((area, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                          {competitor.key_technology_areas.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{competitor.key_technology_areas.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <Button variant="outline" size="sm">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Portfolio Analysis
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
          This tab shows competitors specifically linked to this project. 
          <Button variant="link" className="p-0 ml-1 h-auto">
            Manage the global competitor database
          </Button> 
          to add new competitors or update existing profiles.
        </AlertDescription>
      </Alert>
    </div>
  );
}