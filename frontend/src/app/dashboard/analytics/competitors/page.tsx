/**
 * Competitor Analysis Page
 * Dedicated page for managing competitor profiles and competitive intelligence
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  BarChart3,
  PieChart,
  Globe,
  MapPin,
  Edit,
  Trash2,
  MoreVertical,
  Download,
  Users,
  Target,
  Award,
  Briefcase,
  Star,
  Activity
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

import { analyticsApi, CompetitorProfile } from '@/services/analyticsApi';
import { toast } from 'sonner';

interface CompetitorStats {
  total: number;
  highThreat: number;
  mediumThreat: number;
  lowThreat: number;
  totalPatents: number;
  avgPatents: number;
  industries: number;
}

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<CompetitorProfile[]>([]);
  const [filteredCompetitors, setFilteredCompetitors] = useState<CompetitorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorProfile | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    legal_name: '',
    aliases: '',
    industry: '',
    headquarters: '',
    website: '',
    description: '',
    strengths: '',
    weaknesses: '',
    threats: '',
    opportunities: '',
  });

  // Fetch competitors
  const fetchCompetitors = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await analyticsApi.getCompetitors();

      if (response.success && response.data) {
        setCompetitors(response.data);
        setFilteredCompetitors(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch competitors');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch competitors';
      setError(message);
      console.error('Competitors fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCompetitors();
  }, [fetchCompetitors]);

  // Apply filters
  useEffect(() => {
    let filtered = [...competitors];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(comp =>
        comp.name.toLowerCase().includes(query) ||
        comp.legal_name?.toLowerCase().includes(query) ||
        comp.industry?.toLowerCase().includes(query) ||
        comp.headquarters?.toLowerCase().includes(query) ||
        comp.aliases?.some(a => a.toLowerCase().includes(query))
      );
    }

    // Industry filter
    if (industryFilter && industryFilter !== 'all') {
      filtered = filtered.filter(comp =>
        comp.industry?.toLowerCase().includes(industryFilter.toLowerCase())
      );
    }

    setFilteredCompetitors(filtered);
  }, [searchQuery, industryFilter, competitors]);

  // Get unique industries
  const industries = [...new Set(competitors.map(c => c.industry).filter(Boolean))];

  // Handle create
  const handleCreate = async () => {
    try {
      const data = {
        name: formData.name,
        legal_name: formData.legal_name,
        aliases: formData.aliases.split(',').map(a => a.trim()).filter(a => a),
        industry: formData.industry,
        headquarters: formData.headquarters,
        website: formData.website,
        description: formData.description,
        strengths: formData.strengths.split('\n').map(s => s.trim()).filter(s => s),
        weaknesses: formData.weaknesses.split('\n').map(w => w.trim()).filter(w => w),
        threats: formData.threats.split('\n').map(t => t.trim()).filter(t => t),
        opportunities: formData.opportunities.split('\n').map(o => o.trim()).filter(o => o),
      };

      const response = await analyticsApi.createCompetitor(data);

      if (response.success) {
        toast.success('Competitor profile created successfully');
        setShowCreateDialog(false);
        resetForm();
        await fetchCompetitors();
      } else {
        throw new Error(response.error || 'Failed to create competitor');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create competitor';
      toast.error(message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      legal_name: '',
      aliases: '',
      industry: '',
      headquarters: '',
      website: '',
      description: '',
      strengths: '',
      weaknesses: '',
      threats: '',
      opportunities: '',
    });
    setSelectedCompetitor(null);
  };

  // Calculate statistics
  const stats: CompetitorStats = {
    total: competitors.length,
    highThreat: competitors.filter(c => (c.total_patents || 0) > 500).length,
    mediumThreat: competitors.filter(c => (c.total_patents || 0) >= 100 && (c.total_patents || 0) <= 500).length,
    lowThreat: competitors.filter(c => (c.total_patents || 0) < 100).length,
    totalPatents: competitors.reduce((sum, c) => sum + (c.total_patents || 0), 0),
    avgPatents: competitors.length > 0
      ? Math.round(competitors.reduce((sum, c) => sum + (c.total_patents || 0), 0) / competitors.length)
      : 0,
    industries: industries.length,
  };

  const getThreatLevel = (totalPatents: number) => {
    if (totalPatents > 500) return { label: 'High', color: 'bg-red-100 text-red-800', icon: TrendingUp };
    if (totalPatents >= 100) return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800', icon: Activity };
    return { label: 'Low', color: 'bg-green-100 text-green-800', icon: TrendingDown };
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/analytics">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Analytics
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Competitor Analysis</h1>
            <p className="text-muted-foreground">
              Track and analyze competitor patent portfolios and strategies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchCompetitors} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Competitor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Competitor Profile</DialogTitle>
                <DialogDescription>
                  Create a new competitor profile for tracking and analysis
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., TechCorp Inc."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="legal_name">Legal Name</Label>
                    <Input
                      id="legal_name"
                      placeholder="e.g., TechCorp Industries LLC"
                      value={formData.legal_name}
                      onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="aliases">Aliases / DBA Names</Label>
                  <Input
                    id="aliases"
                    placeholder="e.g., TechCorp, TC Industries (comma-separated)"
                    value={formData.aliases}
                    onChange={(e) => setFormData({ ...formData, aliases: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      placeholder="e.g., Technology, Biotechnology"
                      value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="headquarters">Headquarters</Label>
                    <Input
                      id="headquarters"
                      placeholder="e.g., San Francisco, CA"
                      value={formData.headquarters}
                      onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://www.example.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the competitor"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <Separator />

                <h4 className="font-medium">SWOT Analysis</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="strengths">Strengths</Label>
                    <Textarea
                      id="strengths"
                      placeholder="One per line"
                      rows={3}
                      value={formData.strengths}
                      onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="weaknesses">Weaknesses</Label>
                    <Textarea
                      id="weaknesses"
                      placeholder="One per line"
                      rows={3}
                      value={formData.weaknesses}
                      onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="opportunities">Opportunities</Label>
                    <Textarea
                      id="opportunities"
                      placeholder="One per line"
                      rows={3}
                      value={formData.opportunities}
                      onChange={(e) => setFormData({ ...formData, opportunities: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="threats">Threats</Label>
                    <Textarea
                      id="threats"
                      placeholder="One per line"
                      rows={3}
                      value={formData.threats}
                      onChange={(e) => setFormData({ ...formData, threats: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!formData.name.trim()}>
                  Create Profile
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Competitors</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Threat</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.highThreat}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium Threat</CardTitle>
            <Activity className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.mediumThreat}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Threat</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.lowThreat}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patents</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatents.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Patents</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPatents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Industries</CardTitle>
            <Globe className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.industries}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Competitor Profiles</CardTitle>
              <CardDescription>
                {filteredCompetitors.length} of {competitors.length} competitors
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search competitors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map(industry => (
                  <SelectItem key={industry} value={industry || ''}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Competitors Grid */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading competitors...</p>
            </div>
          ) : filteredCompetitors.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {competitors.length === 0 ? 'No competitors tracked yet' : 'No competitors match your filters'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {competitors.length === 0
                  ? 'Add your first competitor to start building competitive intelligence'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {competitors.length === 0 && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Competitor
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCompetitors.map((competitor) => {
                const threat = getThreatLevel(competitor.total_patents || 0);
                return (
                  <Card key={competitor.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10">
                              {getInitials(competitor.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">{competitor.name}</CardTitle>
                            <p className="text-xs text-muted-foreground">{competitor.industry || 'No industry'}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Export Report
                            </DropdownMenuItem>
                            {competitor.website && (
                              <DropdownMenuItem asChild>
                                <a href={competitor.website} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Visit Website
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className={threat.color} variant="secondary">
                          <threat.icon className="h-3 w-3 mr-1" />
                          {threat.label} Threat
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {competitor.description || 'No description provided'}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Patents</p>
                          <p className="font-semibold">{(competitor.total_patents || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Active Patents</p>
                          <p className="font-semibold">{(competitor.active_patents || 0).toLocaleString()}</p>
                        </div>
                      </div>

                      {competitor.headquarters && (
                        <div className="mt-3 flex items-center text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {competitor.headquarters}
                        </div>
                      )}

                      {/* SWOT Indicators */}
                      {(competitor.strengths?.length || competitor.weaknesses?.length ||
                        competitor.threats?.length || competitor.opportunities?.length) > 0 && (
                        <div className="mt-4 flex gap-2">
                          {competitor.strengths && competitor.strengths.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              S: {competitor.strengths.length}
                            </Badge>
                          )}
                          {competitor.weaknesses && competitor.weaknesses.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              W: {competitor.weaknesses.length}
                            </Badge>
                          )}
                          {competitor.opportunities && competitor.opportunities.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              O: {competitor.opportunities.length}
                            </Badge>
                          )}
                          {competitor.threats && competitor.threats.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              T: {competitor.threats.length}
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
