'use client';

import { useState, useEffect } from 'react';
import { useBrainstorming } from '@/hooks/useBrainstorming';
import { brainstormingApi } from '@/services/brainstormingApi';
import {
  Building2,
  Plus,
  Search,
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  BarChart3,
  Globe,
  Link,
  Star,
  Edit2,
  Trash2,
  ExternalLink,
  Filter
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface Competitor {
  id: string;
  name: string;
  type: 'direct' | 'indirect' | 'potential';
  industry: string;
  headquarters: string;
  founded: number;
  size: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  description: string;
  website?: string;
  patentCount: number;
  activePatents: number;
  recentPatents: number;
  keyTechnologies: string[];
  ipcClasses: string[];
  collaborators: string[];
  marketShare?: number;
  revenue?: string;
  keyInventors: string[];
  patentStrategy: 'aggressive' | 'moderate' | 'defensive';
  threatLevel: 'low' | 'medium' | 'high';
  lastAnalyzed: Date;
  notes?: string;
}

interface CompetitorsTabProps {
  projectId: string;
  sessionId: string | null;
}

export function CompetitorsTab({ projectId, sessionId }: CompetitorsTabProps) {
  const {
    competitors: apiCompetitors,
    loading,
    error
  } = useBrainstorming(projectId);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);

  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);
  const [isAddingCompetitor, setIsAddingCompetitor] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState<Partial<Competitor>>({
    name: '',
    type: 'direct',
    industry: '',
    headquarters: '',
    size: 'medium',
    description: ''
  });
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('patentCount');

  const handleAddCompetitor = async () => {
    if (!newCompetitor.name?.trim() || !sessionId) return;

    const competitorData = {
      company_name: newCompetitor.name,
      competitor_type: newCompetitor.type || 'direct',
      description: newCompetitor.description || '',
      headquarters: newCompetitor.headquarters || '',
      employee_count: newCompetitor.size || 'medium',
      technology_areas: [],
      strengths: [],
      weaknesses: [],
      opportunities: [],
      threats: []
    };

    try {
      const result = await brainstormingApi.createCompetitorAnalysis({
        session: sessionId,
        ...competitorData
      });

      if (result.success && result.data) {
        const competitor: Competitor = {
          id: result.data.id,
          name: result.data.company_name,
          type: result.data.competitor_type as any,
          industry: 'Technology', // Default
          headquarters: result.data.headquarters || 'Unknown',
          founded: new Date().getFullYear(),
          size: newCompetitor.size || 'medium',
          description: result.data.description,
          patentCount: result.data.total_patents || 0,
          activePatents: result.data.active_patents || 0,
          recentPatents: result.data.patent_applications || 0,
          keyTechnologies: result.data.technology_areas || [],
          ipcClasses: [],
          collaborators: [],
          keyInventors: result.data.key_inventors || [],
          patentStrategy: 'moderate',
          threatLevel: result.data.threat_level <= 2 ? 'low' : 
                      result.data.threat_level <= 3 ? 'medium' : 'high',
          lastAnalyzed: new Date(result.data.analysis_date)
        };

        setCompetitors([...competitors, competitor]);
        setIsAddingCompetitor(false);
        setNewCompetitor({
          name: '',
          type: 'direct',
          industry: '',
          headquarters: '',
          size: 'medium',
          description: ''
        });
      }
    } catch (err) {
      console.error('Failed to add competitor:', err);
    }
  };

  const handleDeleteCompetitor = (id: string) => {
    setCompetitors(competitors.filter(c => c.id !== id));
  };

  const getFilteredCompetitors = () => {
    let filtered = competitors;
    
    if (filterType !== 'all') {
      filtered = filtered.filter(c => c.type === filterType);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'patentCount':
          return b.patentCount - a.patentCount;
        case 'recentPatents':
          return b.recentPatents - a.recentPatents;
        case 'threatLevel':
          const threatOrder = { high: 3, medium: 2, low: 1 };
          return threatOrder[b.threatLevel] - threatOrder[a.threatLevel];
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSizeLabel = (size: string) => {
    switch (size) {
      case 'startup': return 'Startup (<50)';
      case 'small': return 'Small (50-200)';
      case 'medium': return 'Medium (200-1K)';
      case 'large': return 'Large (1K-10K)';
      case 'enterprise': return 'Enterprise (10K+)';
      default: return 'Unknown';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'direct': return 'bg-blue-100 text-blue-700';
      case 'indirect': return 'bg-purple-100 text-purple-700';
      case 'potential': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Update competitors from API data
  useEffect(() => {
    if (apiCompetitors && apiCompetitors.length > 0) {
      const formattedCompetitors: Competitor[] = apiCompetitors.map(apiComp => ({
        id: apiComp.id,
        name: apiComp.company_name,
        type: apiComp.competitor_type as any,
        industry: 'Technology',
        headquarters: apiComp.headquarters || 'Unknown',
        founded: apiComp.founded_year || new Date().getFullYear(),
        size: 'medium',
        description: apiComp.description,
        website: apiComp.website,
        patentCount: apiComp.total_patents || 0,
        activePatents: apiComp.active_patents || 0,
        recentPatents: apiComp.patent_applications || 0,
        keyTechnologies: apiComp.technology_areas || [],
        ipcClasses: [],
        collaborators: [],
        marketShare: 0,
        revenue: apiComp.revenue,
        keyInventors: apiComp.key_inventors || [],
        patentStrategy: 'moderate',
        threatLevel: apiComp.threat_level <= 2 ? 'low' : 
                    apiComp.threat_level <= 3 ? 'medium' : 'high',
        lastAnalyzed: new Date(apiComp.analysis_date)
      }));
      setCompetitors(formattedCompetitors);
    }
  }, [apiCompetitors]);

  if (!sessionId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
          <p className="text-muted-foreground">
            Please select or create a brainstorming session to analyze competitors.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800 text-sm">Error loading competitors: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Company Profiles</TabsTrigger>
          <TabsTrigger value="analysis">Patent Analysis</TabsTrigger>
          <TabsTrigger value="mapping">Technology Mapping</TabsTrigger>
          <TabsTrigger value="intelligence">Market Intelligence</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Controls */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search competitors..." 
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="indirect">Indirect</SelectItem>
                      <SelectItem value="potential">Potential</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patentCount">Patent Count</SelectItem>
                      <SelectItem value="recentPatents">Recent Activity</SelectItem>
                      <SelectItem value="threatLevel">Threat Level</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => setIsAddingCompetitor(true)} disabled={!sessionId}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Competitor
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Competitors Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {getFilteredCompetitors().map((competitor) => (
              <Card key={competitor.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-blue-100">
                          {competitor.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">{competitor.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getTypeColor(competitor.type)}>
                            {competitor.type}
                          </Badge>
                          <Badge className={getThreatColor(competitor.threatLevel)}>
                            {competitor.threatLevel} threat
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost">
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDeleteCompetitor(competitor.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {competitor.description}
                  </p>

                  {/* Company Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span>{competitor.industry}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span>{competitor.headquarters}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>{getSizeLabel(competitor.size)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>Founded {competitor.founded}</span>
                      </div>
                      {competitor.revenue && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          <span>{competitor.revenue} revenue</span>
                        </div>
                      )}
                      {competitor.marketShare && (
                        <div className="flex items-center gap-2">
                          <BarChart3 className="h-3 w-3 text-muted-foreground" />
                          <span>{competitor.marketShare}% market share</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Patent Stats */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold">{competitor.patentCount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Total Patents</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{competitor.activePatents.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Active</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-600">+{competitor.recentPatents}</p>
                        <p className="text-xs text-muted-foreground">Recent</p>
                      </div>
                    </div>
                  </div>

                  {/* Key Technologies */}
                  {competitor.keyTechnologies.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Key Technologies</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {competitor.keyTechnologies.slice(0, 3).map((tech, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                        {competitor.keyTechnologies.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{competitor.keyTechnologies.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Last Analyzed */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>Last analyzed: {competitor.lastAnalyzed.toLocaleDateString()}</span>
                    <Button size="sm" variant="outline">
                      Update Analysis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {/* Patent Analysis Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">
                  {competitors.reduce((sum, c) => sum + c.patentCount, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Patents</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">
                  {competitors.reduce((sum, c) => sum + c.recentPatents, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Recent Filings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{competitors.length}</p>
                <p className="text-sm text-muted-foreground">Companies Tracked</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">
                  {competitors.filter(c => c.threatLevel === 'high').length}
                </p>
                <p className="text-sm text-muted-foreground">High Threat</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Competitors by Patents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Patent Portfolio Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {competitors.slice(0, 5).map((competitor, idx) => (
                  <div key={competitor.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{competitor.name}</span>
                      <span className="text-sm">{competitor.patentCount.toLocaleString()} patents</span>
                    </div>
                    <Progress 
                      value={(competitor.patentCount / Math.max(...competitors.map(c => c.patentCount))) * 100} 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping" className="space-y-4">
          {/* Technology Overlap Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Technology Overlap Matrix</CardTitle>
              <CardDescription>
                Shows technology overlap between competitors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Technology mapping visualization coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-4">
          {/* Market Intelligence */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Competitive Intelligence Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Market Leaders</Label>
                  <div className="mt-2 space-y-2">
                    {competitors
                      .filter(c => c.marketShare && c.marketShare > 20)
                      .map(competitor => (
                        <div key={competitor.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <span className="text-sm">{competitor.name}</span>
                          <Badge variant="secondary">{competitor.marketShare}% market share</Badge>
                        </div>
                      ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">High Threat Companies</Label>
                  <div className="mt-2 space-y-2">
                    {competitors
                      .filter(c => c.threatLevel === 'high')
                      .map(competitor => (
                        <div key={competitor.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                          <span className="text-sm">{competitor.name}</span>
                          <Badge className="bg-red-100 text-red-700">
                            {competitor.patentStrategy} strategy
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Competitor Modal */}
      {isAddingCompetitor && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-sm">Add New Competitor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input
                  placeholder="Enter company name..."
                  value={newCompetitor.name}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Competition Type</Label>
                <Select
                  value={newCompetitor.type}
                  onValueChange={(value: any) => setNewCompetitor({ ...newCompetitor, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct Competitor</SelectItem>
                    <SelectItem value="indirect">Indirect Competitor</SelectItem>
                    <SelectItem value="potential">Potential Competitor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input
                  placeholder="e.g., Technology, Healthcare"
                  value={newCompetitor.industry}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, industry: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Headquarters</Label>
                <Input
                  placeholder="e.g., San Francisco, CA"
                  value={newCompetitor.headquarters}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, headquarters: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Company Size</Label>
              <Select
                value={newCompetitor.size}
                onValueChange={(value: any) => setNewCompetitor({ ...newCompetitor, size: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startup">Startup (&lt;50)</SelectItem>
                  <SelectItem value="small">Small (50-200)</SelectItem>
                  <SelectItem value="medium">Medium (200-1K)</SelectItem>
                  <SelectItem value="large">Large (1K-10K)</SelectItem>
                  <SelectItem value="enterprise">Enterprise (10K+)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of the company and their focus areas..."
                value={newCompetitor.description}
                onChange={(e) => setNewCompetitor({ ...newCompetitor, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingCompetitor(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCompetitor} disabled={loading || !sessionId}>
                <Plus className="h-4 w-4 mr-2" />
                Add Competitor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}