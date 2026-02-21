/**
 * GlobalCompetitorsTab Component
 * Enterprise-grade competitor intelligence and portfolio management
 * Provides comprehensive competitor database with analytics and insights
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
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
  MoreVertical,
  Eye,
  Activity,
  Target,
  Briefcase,
  Award,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Download,
  Upload,
  RefreshCw,
  Settings,
  PieChart,
  LineChart
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

import { globalAnalyticsApi, type GlobalCompetitorProfile } from '@/services/analyticsApi';
import { toast } from 'sonner';

interface CompetitorMetrics {
  portfolioSize: number;
  portfolioGrowth: number;
  avgCitationsPerPatent: number;
  technologyAreas: number;
  marketPresence: number;
  innovationScore: number;
}

interface CompetitorInsight {
  type: 'opportunity' | 'threat' | 'trend' | 'gap';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
}

export function GlobalCompetitorsTab() {
  const [competitors, setCompetitors] = useState<GlobalCompetitorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedCompetitor, setSelectedCompetitor] = useState<GlobalCompetitorProfile | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [industries, setIndustries] = useState<string[]>([]);
  const [addForm, setAddForm] = useState({ name: '', industry: '', description: '', headquarters: '', website: '' });
  const [addLoading, setAddLoading] = useState(false);

  const fetchCompetitors = async () => {
    try {
      setLoading(true);
      const response = await globalAnalyticsApi.getGlobalCompetitors({
        limit: 100,
      });
      if (response.success && response.data) {
        setCompetitors(response.data.results || []);
      } else {
        setCompetitors([]);
      }
    } catch {
      setCompetitors([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchIndustries = async () => {
    const response = await globalAnalyticsApi.getIndustries();
    if (response.success && response.data) {
      setIndustries(response.data);
    }
  };

  useEffect(() => {
    fetchCompetitors();
    fetchIndustries();
  }, []);

  const handleAddCompetitor = async () => {
    if (!addForm.name || !addForm.industry) {
      toast.error('Name and industry are required');
      return;
    }
    setAddLoading(true);
    try {
      const response = await globalAnalyticsApi.createGlobalCompetitor(addForm);
      if (response.success && response.data) {
        setCompetitors(prev => [response.data!, ...prev]);
        setShowAddDialog(false);
        setAddForm({ name: '', industry: '', description: '', headquarters: '', website: '' });
        toast.success('Competitor added successfully');
      } else {
        toast.error(response.error || 'Failed to add competitor');
      }
    } catch {
      toast.error('Failed to add competitor');
    } finally {
      setAddLoading(false);
    }
  };

  const getCompetitorMetrics = (competitor: GlobalCompetitorProfile): CompetitorMetrics => {
    return {
      portfolioSize: competitor.total_patents,
      portfolioGrowth: competitor.filing_trend_6_months || 0,
      avgCitationsPerPatent: competitor.avg_citations_per_patent || 0,
      technologyAreas: competitor.key_technology_areas?.length || 0,
      marketPresence: competitor.market_focus?.length || 0,
      innovationScore: competitor.patent_quality_score || 0
    };
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 15) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (trend > 5) return <TrendingUp className="h-4 w-4 text-blue-600" />;
    if (trend > 0) return <Minus className="h-4 w-4 text-yellow-600" />;
    return <ArrowDownRight className="h-4 w-4 text-red-600" />;
  };

  const filteredCompetitors = competitors.filter(competitor => {
    const matchesSearch = competitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         competitor.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = industryFilter === 'all' || competitor.industry === industryFilter;

    return matchesSearch && matchesIndustry;
  });

  const CompetitorCard = ({ competitor }: { competitor: GlobalCompetitorProfile }) => {
    const metrics = getCompetitorMetrics(competitor);
    
    return (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={() => setSelectedCompetitor(competitor)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                  {competitor.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{competitor.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Building2 className="h-3 w-3" />
                  {competitor.industry}
                </CardDescription>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Competitor
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Portfolio Analysis
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.portfolioSize.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Total Patents</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-bold">{metrics.portfolioGrowth}</span>
                {getTrendIcon(metrics.portfolioGrowth)}
              </div>
              <div className="text-xs text-muted-foreground">6M Growth</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Quality Score</span>
              <span className="font-medium">{metrics.innovationScore.toFixed(1)}/10</span>
            </div>
            <Progress value={metrics.innovationScore * 10} className="h-2" />
          </div>

          <div className="flex items-center justify-between">
            <Badge className={getStrengthColor(competitor.competitive_strength || 'medium')}>
              {competitor.competitive_strength || 'medium'} threat
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {competitor.headquarters}
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {competitor.key_technology_areas?.slice(0, 2).map((area, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {area}
              </Badge>
            ))}
            {(competitor.key_technology_areas?.length || 0) > 2 && (
              <Badge variant="outline" className="text-xs">
                +{(competitor.key_technology_areas?.length || 0) - 2} more
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Target className="h-6 w-6 text-red-600" />
            </div>
            Global Competitor Intelligence
          </h2>
          <p className="text-muted-foreground mt-1">
            Comprehensive competitor database with portfolio analytics and strategic insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="bg-red-600 hover:bg-red-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Competitor
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Competitors</p>
                <p className="text-2xl font-bold">{competitors.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Patents</p>
                <p className="text-2xl font-bold">
                  {competitors.reduce((sum, c) => sum + c.total_patents, 0).toLocaleString()}
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
                <p className="text-sm text-muted-foreground">High Threat</p>
                <p className="text-2xl font-bold text-red-600">
                  {competitors.filter(c => c.competitive_strength === 'high').length}
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
                <p className="text-sm text-muted-foreground">Industries</p>
                <p className="text-2xl font-bold">{industries.length}</p>
              </div>
              <PieChart className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Competitor Database</TabsTrigger>
          <TabsTrigger value="analytics">Portfolio Analytics</TabsTrigger>
          <TabsTrigger value="insights">Strategic Insights</TabsTrigger>
          <TabsTrigger value="monitoring">Market Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search competitors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map(industry => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                Table
              </Button>
            </div>
          </div>

          {/* Competitors Display */}
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCompetitors.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No competitors found</h3>
                <p className="text-muted-foreground mb-6">
                  Start building your competitive intelligence by adding competitor profiles.
                </p>
                <Button onClick={() => setShowAddDialog(true)} className="bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Competitor
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCompetitors.map((competitor) => (
                <CompetitorCard key={competitor.id} competitor={competitor} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Analytics Dashboard</CardTitle>
              <CardDescription>
                Comprehensive analysis of competitor patent portfolios and market positioning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <LineChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Advanced Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Portfolio comparison, trend analysis, and competitive benchmarking features
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Strategic Insights</CardTitle>
              <CardDescription>
                AI-powered insights and recommendations for competitive strategy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Strategic Analysis Coming Soon</h3>
                <p className="text-muted-foreground">
                  Market opportunities, threat assessment, and strategic recommendations
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Monitoring</CardTitle>
              <CardDescription>
                Real-time tracking of competitor activities and market developments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Real-time Monitoring Coming Soon</h3>
                <p className="text-muted-foreground">
                  Automated alerts, patent filings tracking, and market intelligence
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Competitor Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Competitor</DialogTitle>
            <DialogDescription>
              Create a comprehensive competitor profile for strategic analysis
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input id="name" placeholder="e.g., TechCorp Industries" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Input id="industry" placeholder="e.g., Technology" value={addForm.industry} onChange={e => setAddForm(f => ({ ...f, industry: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" placeholder="Brief description of the company and its focus areas" value={addForm.description} onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="headquarters">Headquarters</Label>
                <Input id="headquarters" placeholder="e.g., San Francisco, CA" value={addForm.headquarters} onChange={e => setAddForm(f => ({ ...f, headquarters: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" placeholder="https://company.com" value={addForm.website} onChange={e => setAddForm(f => ({ ...f, website: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleAddCompetitor} disabled={addLoading}>
              {addLoading ? 'Adding...' : 'Add Competitor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}