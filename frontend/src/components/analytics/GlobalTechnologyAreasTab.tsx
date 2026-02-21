/**
 * GlobalTechnologyAreasTab Component
 * Enterprise-grade technology classification and portfolio management
 * Provides comprehensive technology taxonomy with IPC/CPC integration
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Zap,
  Plus,
  Search,
  Filter,
  TrendingUp,
  BarChart3,
  PieChart,
  LineChart,
  Network,
  Target,
  Settings,
  Edit2,
  Trash2,
  MoreVertical,
  Eye,
  Activity,
  Lightbulb,
  Brain,
  Code,
  Database,
  Globe,
  MapPin,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Upload,
  RefreshCw,
  Tags,
  Layers,
  TreePine,
  Cpu,
  Beaker,
  Wrench,
  Atom,
  Microscope
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

import { globalAnalyticsApi, type GlobalTechnologyArea } from '@/services/analyticsApi';
import { toast } from 'sonner';

interface TechnologyTrend {
  period: string;
  patents: number;
  growth: number;
}

interface TechnologyMetrics {
  totalPatents: number;
  growthRate: number;
  marketPotential: number;
  competitiveIntensity: number;
  innovationScore: number;
  emergingTrend: boolean;
}

const TECHNOLOGY_ICONS: Record<string, React.ComponentType<any>> = {
  'Artificial Intelligence': Brain,
  'Machine Learning': Cpu,
  'Biotechnology': Microscope,
  'Software': Code,
  'Hardware': Wrench,
  'Chemistry': Beaker,
  'Physics': Atom,
  'Energy': Zap,
  'Materials': Layers,
  'Default': TreePine
};

export function GlobalTechnologyAreasTab() {
  const [technologyAreas, setTechnologyAreas] = useState<GlobalTechnologyArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [maturityFilter, setMaturityFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'hierarchy' | 'matrix'>('grid');
  const [selectedTechnology, setSelectedTechnology] = useState<GlobalTechnologyArea | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [categories, setCategories] = useState<string[]>([]);
  const [addForm, setAddForm] = useState({ name: '', description: '', ipc_class: '', cpc_class: '', category: '' });
  const [addLoading, setAddLoading] = useState(false);

  const fetchTechnologies = async () => {
    try {
      setLoading(true);
      const response = await globalAnalyticsApi.getGlobalTechnologies({ limit: 100 });
      if (response.success && response.data) {
        setTechnologyAreas(response.data.results || []);
      } else {
        setTechnologyAreas([]);
      }
    } catch {
      setTechnologyAreas([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const response = await globalAnalyticsApi.getTechnologyCategories();
    if (response.success && response.data) {
      setCategories(response.data);
    }
  };

  useEffect(() => {
    fetchTechnologies();
    fetchCategories();
  }, []);

  const handleAddTechnology = async () => {
    if (!addForm.name) {
      toast.error('Technology name is required');
      return;
    }
    setAddLoading(true);
    try {
      const response = await globalAnalyticsApi.createGlobalTechnology(addForm);
      if (response.success && response.data) {
        setTechnologyAreas(prev => [response.data!, ...prev]);
        setShowAddDialog(false);
        setAddForm({ name: '', description: '', ipc_class: '', cpc_class: '', category: '' });
        toast.success('Technology area added successfully');
      } else {
        toast.error(response.error || 'Failed to add technology area');
      }
    } catch {
      toast.error('Failed to add technology area');
    } finally {
      setAddLoading(false);
    }
  };

  const getTechnologyMetrics = (technology: GlobalTechnologyArea): TechnologyMetrics => {
    const patentCount = technology.patent_count || 0;
    const growthRate = technology.growth_rate_6m || 0;
    const innovationScore = technology.innovation_score || 0;
    const marketPotentialScore = technology.market_potential === 'high' ? 80 : technology.market_potential === 'medium' ? 50 : 20;
    const emergingTrend = technology.maturity_level === 'emerging' || (patentCount < 5000 && growthRate > 15);

    return {
      totalPatents: patentCount,
      growthRate,
      marketPotential: marketPotentialScore,
      competitiveIntensity: 0,
      innovationScore,
      emergingTrend
    };
  };

  const getTechnologyIcon = (name: string) => {
    const IconComponent = TECHNOLOGY_ICONS[name] || TECHNOLOGY_ICONS.Default;
    return IconComponent;
  };

  const getMaturityLevel = (patentCount: number): { level: string; color: string } => {
    if (patentCount > 10000) return { level: 'Mature', color: 'bg-blue-100 text-blue-800' };
    if (patentCount > 5000) return { level: 'Growing', color: 'bg-green-100 text-green-800' };
    if (patentCount > 1000) return { level: 'Emerging', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'Early', color: 'bg-purple-100 text-purple-800' };
  };

  const filteredTechnologyAreas = technologyAreas.filter(tech => {
    const matchesSearch = tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tech.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tech.ipc_class || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (tech.cpc_class || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMaturity = maturityFilter === 'all' || tech.maturity_level === maturityFilter;
    const matchesCategory = categoryFilter === 'all' || tech.category === categoryFilter;

    return matchesSearch && matchesMaturity && matchesCategory;
  });

  const TechnologyCard = ({ technology }: { technology: GlobalTechnologyArea }) => {
    const metrics = getTechnologyMetrics(technology);
    const maturity = getMaturityLevel(technology.patent_count || 0);
    const IconComponent = getTechnologyIcon(technology.name);
    
    return (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" 
            onClick={() => setSelectedTechnology(technology)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <IconComponent className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-lg">{technology.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {technology.description}
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
                  Edit Technology
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Trend Analysis
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
              <div className="text-2xl font-bold text-emerald-600">
                {metrics.totalPatents.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Total Patents</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <span className="text-2xl font-bold">
                  {metrics.growthRate.toFixed(1)}%
                </span>
                {metrics.growthRate > 10 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="text-xs text-muted-foreground">Growth Rate</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Innovation Score</span>
              <span className="font-medium">{metrics.innovationScore.toFixed(1)}/10</span>
            </div>
            <Progress value={metrics.innovationScore * 10} className="h-2" />
          </div>

          <div className="flex items-center justify-between">
            <Badge className={maturity.color}>
              {maturity.level}
            </Badge>
            {metrics.emergingTrend && (
              <Badge className="bg-orange-100 text-orange-800">
                <Lightbulb className="h-3 w-3 mr-1" />
                Hot Trend
              </Badge>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Classifications</div>
            <div className="flex flex-wrap gap-1">
              {technology.ipc_class && (
                <Badge variant="outline" className="text-xs">IPC: {technology.ipc_class}</Badge>
              )}
              {technology.cpc_class && (
                <Badge variant="outline" className="text-xs">CPC: {technology.cpc_class}</Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Key Players</div>
            <div className="flex flex-wrap gap-1">
              {technology.key_players?.slice(0, 3).map((player, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {player}
                </Badge>
              ))}
              {(technology.key_players?.length || 0) > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{(technology.key_players?.length || 0) - 3} more
                </Badge>
              )}
            </div>
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
            <div className="p-2 bg-emerald-100 rounded-lg">
              <TreePine className="h-6 w-6 text-emerald-600" />
            </div>
            Global Technology Taxonomy
          </h2>
          <p className="text-muted-foreground mt-1">
            Comprehensive technology classification with IPC/CPC integration and trend analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Classifications
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Technology Area
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Technology Areas</p>
                <p className="text-2xl font-bold">{technologyAreas.length}</p>
              </div>
              <TreePine className="h-8 w-8 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Patents</p>
                <p className="text-2xl font-bold">
                  {technologyAreas.reduce((sum, t) => sum + (t.patent_count || 0), 0).toLocaleString()}
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
                <p className="text-sm text-muted-foreground">Emerging Trends</p>
                <p className="text-2xl font-bold text-orange-600">
                  {technologyAreas.filter(t => (t.patent_count || 0) < 5000).length}
                </p>
              </div>
              <Lightbulb className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">IPC Classes</p>
                <p className="text-2xl font-bold">
                  {new Set(technologyAreas.map(t => t.ipc_class).filter(Boolean)).size}
                </p>
              </div>
              <Tags className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Technology Database</TabsTrigger>
          <TabsTrigger value="classification">IPC/CPC Management</TabsTrigger>
          <TabsTrigger value="trends">Technology Trends</TabsTrigger>
          <TabsTrigger value="mapping">Technology Mapping</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search technology areas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={maturityFilter} onValueChange={setMaturityFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Maturity Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Maturity Levels</SelectItem>
                <SelectItem value="early">Early Stage</SelectItem>
                <SelectItem value="emerging">Emerging</SelectItem>
                <SelectItem value="growing">Growing</SelectItem>
                <SelectItem value="mature">Mature</SelectItem>
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
                variant={viewMode === 'hierarchy' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('hierarchy')}
              >
                Hierarchy
              </Button>
              <Button
                variant={viewMode === 'matrix' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('matrix')}
              >
                Matrix
              </Button>
            </div>
          </div>

          {/* Technology Areas Display */}
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
          ) : filteredTechnologyAreas.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <TreePine className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No technology areas found</h3>
                <p className="text-muted-foreground mb-6">
                  Start building your technology taxonomy by defining key technology areas.
                </p>
                <Button onClick={() => setShowAddDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Technology Area
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTechnologyAreas.map((technology) => (
                <TechnologyCard key={technology.id} technology={technology} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="classification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>IPC/CPC Classification Management</CardTitle>
              <CardDescription>
                Manage International and Cooperative Patent Classification codes for precise technology mapping
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Tags className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Classification System Coming Soon</h3>
                <p className="text-muted-foreground">
                  Advanced IPC/CPC management, automated classification, and taxonomy building
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technology Trend Analysis</CardTitle>
              <CardDescription>
                Track emerging technologies, innovation patterns, and market opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Trend Analytics Coming Soon</h3>
                <p className="text-muted-foreground">
                  Patent filing trends, technology lifecycle analysis, and predictive insights
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mapping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Technology Landscape Mapping</CardTitle>
              <CardDescription>
                Visualize technology relationships, innovation clusters, and white space opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Network className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Landscape Mapping Coming Soon</h3>
                <p className="text-muted-foreground">
                  Interactive technology maps, cluster analysis, and opportunity identification
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Technology Area Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Add New Technology Area</DialogTitle>
            <DialogDescription>
              Define a comprehensive technology area with keywords, classifications, and search parameters
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tech-name">Technology Name *</Label>
                <Input id="tech-name" placeholder="e.g., Artificial Intelligence" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" placeholder="e.g., Artificial Intelligence" value={addForm.category} onChange={e => setAddForm(f => ({ ...f, category: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tech-description">Description</Label>
              <Textarea
                id="tech-description"
                placeholder="Detailed description of the technology area and its scope"
                className="min-h-[80px]"
                value={addForm.description}
                onChange={e => setAddForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ipc-class">IPC Class</Label>
                <Input id="ipc-class" placeholder="e.g., G06N 20/00" value={addForm.ipc_class} onChange={e => setAddForm(f => ({ ...f, ipc_class: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpc-class">CPC Class</Label>
                <Input id="cpc-class" placeholder="e.g., G06N 20/00" value={addForm.cpc_class} onChange={e => setAddForm(f => ({ ...f, cpc_class: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddTechnology} disabled={addLoading}>
              {addLoading ? 'Adding...' : 'Add Technology Area'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}