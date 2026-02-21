/**
 * Technology Areas Management Page
 * Dedicated page for managing technology classifications and IPC/CPC mappings
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Cpu,
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
  Tag,
  Layers,
  Edit,
  Trash2,
  MoreVertical,
  Download
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

import { analyticsApi, TechnologyArea } from '@/services/analyticsApi';
import { toast } from 'sonner';

interface TechnologyAreaStats {
  total: number;
  emerging: number;
  developing: number;
  mature: number;
  declining: number;
  highPotential: number;
  totalPatents: number;
}

export default function TechnologyAreasPage() {
  const [technologyAreas, setTechnologyAreas] = useState<TechnologyArea[]>([]);
  const [filteredAreas, setFilteredAreas] = useState<TechnologyArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [maturityFilter, setMaturityFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedArea, setSelectedArea] = useState<TechnologyArea | null>(null);

  // Form state for creating/editing
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    keywords: '',
    ipc_classes: '',
    cpc_classes: '',
    search_queries: '',
    confidence_threshold: 0.7,
  });

  // Fetch technology areas
  const fetchTechnologyAreas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await analyticsApi.getTechnologyAreas();

      if (response.success && response.data) {
        setTechnologyAreas(response.data);
        setFilteredAreas(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch technology areas');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch technology areas';
      setError(message);
      console.error('Technology areas fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTechnologyAreas();
  }, [fetchTechnologyAreas]);

  // Apply filters
  useEffect(() => {
    let filtered = [...technologyAreas];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(area =>
        area.name.toLowerCase().includes(query) ||
        area.description?.toLowerCase().includes(query) ||
        area.keywords?.some(k => k.toLowerCase().includes(query)) ||
        area.ipc_classes?.some(c => c.toLowerCase().includes(query)) ||
        area.cpc_classes?.some(c => c.toLowerCase().includes(query))
      );
    }

    // Maturity filter - would need to add maturity_level to the interface
    // For now, we'll filter based on patent_count as a proxy

    setFilteredAreas(filtered);
  }, [searchQuery, maturityFilter, technologyAreas]);

  // Handle create
  const handleCreate = async () => {
    try {
      const data = {
        name: formData.name,
        description: formData.description,
        keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k),
        ipc_classes: formData.ipc_classes.split(',').map(c => c.trim()).filter(c => c),
        cpc_classes: formData.cpc_classes.split(',').map(c => c.trim()).filter(c => c),
        search_queries: formData.search_queries.split('\n').map(q => q.trim()).filter(q => q),
        confidence_threshold: formData.confidence_threshold,
      };

      const response = await analyticsApi.createTechnologyArea(data);

      if (response.success) {
        toast.success('Technology area created successfully');
        setShowCreateDialog(false);
        resetForm();
        await fetchTechnologyAreas();
      } else {
        throw new Error(response.error || 'Failed to create technology area');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create technology area';
      toast.error(message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      keywords: '',
      ipc_classes: '',
      cpc_classes: '',
      search_queries: '',
      confidence_threshold: 0.7,
    });
    setSelectedArea(null);
  };

  // Calculate statistics
  const stats: TechnologyAreaStats = {
    total: technologyAreas.length,
    emerging: technologyAreas.filter(a => (a.patent_count || 0) < 100).length,
    developing: technologyAreas.filter(a => (a.patent_count || 0) >= 100 && (a.patent_count || 0) < 500).length,
    mature: technologyAreas.filter(a => (a.patent_count || 0) >= 500 && (a.patent_count || 0) < 2000).length,
    declining: technologyAreas.filter(a => (a.patent_count || 0) >= 2000).length,
    highPotential: technologyAreas.filter(a => (a.confidence_threshold || 0) >= 0.8).length,
    totalPatents: technologyAreas.reduce((sum, a) => sum + (a.patent_count || 0), 0),
  };

  const getMaturityBadge = (patentCount: number) => {
    if (patentCount < 100) return { label: 'Emerging', color: 'bg-purple-100 text-purple-800' };
    if (patentCount < 500) return { label: 'Developing', color: 'bg-blue-100 text-blue-800' };
    if (patentCount < 2000) return { label: 'Mature', color: 'bg-green-100 text-green-800' };
    return { label: 'Established', color: 'bg-gray-100 text-gray-800' };
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
            <h1 className="text-3xl font-bold tracking-tight">Technology Areas</h1>
            <p className="text-muted-foreground">
              Manage technology classifications, keywords, and IPC/CPC mappings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchTechnologyAreas} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Technology Area
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Technology Area</DialogTitle>
                <DialogDescription>
                  Define a new technology classification with keywords and IPC/CPC codes
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Machine Learning Algorithms"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of this technology area"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="ipc_classes">IPC Classes</Label>
                    <Input
                      id="ipc_classes"
                      placeholder="e.g., G06N 20/00, G06F 18/00"
                      value={formData.ipc_classes}
                      onChange={(e) => setFormData({ ...formData, ipc_classes: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Comma-separated IPC codes</p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="cpc_classes">CPC Classes</Label>
                    <Input
                      id="cpc_classes"
                      placeholder="e.g., G06N 20/00, Y10S 706/00"
                      value={formData.cpc_classes}
                      onChange={(e) => setFormData({ ...formData, cpc_classes: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Comma-separated CPC codes</p>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="keywords">Keywords</Label>
                  <Textarea
                    id="keywords"
                    placeholder="machine learning, neural network, deep learning, AI, artificial intelligence"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Comma-separated keywords for matching</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="search_queries">Search Queries</Label>
                  <Textarea
                    id="search_queries"
                    placeholder="Enter one search query per line"
                    rows={3}
                    value={formData.search_queries}
                    onChange={(e) => setFormData({ ...formData, search_queries: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Custom search queries for patent databases</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confidence">Confidence Threshold: {formData.confidence_threshold}</Label>
                  <input
                    type="range"
                    id="confidence"
                    min="0"
                    max="1"
                    step="0.05"
                    value={formData.confidence_threshold}
                    onChange={(e) => setFormData({ ...formData, confidence_threshold: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum confidence score for auto-classification
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!formData.name.trim()}>
                  Create Technology Area
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
            <CardTitle className="text-sm font-medium">Total Areas</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emerging</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emerging}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Developing</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.developing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mature</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mature}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Established</CardTitle>
            <Cpu className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.declining}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Potential</CardTitle>
            <TrendingUp className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highPotential}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patents</CardTitle>
            <PieChart className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatents.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Technology Classifications</CardTitle>
              <CardDescription>
                {filteredAreas.length} of {technologyAreas.length} technology areas
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
                placeholder="Search by name, keyword, or IPC/CPC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={maturityFilter} onValueChange={setMaturityFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by maturity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Maturity Levels</SelectItem>
                <SelectItem value="emerging">Emerging</SelectItem>
                <SelectItem value="developing">Developing</SelectItem>
                <SelectItem value="mature">Mature</SelectItem>
                <SelectItem value="established">Established</SelectItem>
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

          {/* Technology Areas Grid */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading technology areas...</p>
            </div>
          ) : filteredAreas.length === 0 ? (
            <div className="text-center py-12">
              <Cpu className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {technologyAreas.length === 0 ? 'No technology areas defined' : 'No areas match your filters'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {technologyAreas.length === 0
                  ? 'Create your first technology classification to start organizing patents'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {technologyAreas.length === 0 && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Technology Area
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAreas.map((area) => {
                const maturity = getMaturityBadge(area.patent_count || 0);
                return (
                  <Card key={area.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-base">{area.name}</CardTitle>
                          <Badge className={maturity.color} variant="secondary">
                            {maturity.label}
                          </Badge>
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
                              Export
                            </DropdownMenuItem>
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
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {area.description || 'No description provided'}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Patents</p>
                          <p className="font-semibold">{(area.patent_count || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Confidence</p>
                          <p className="font-semibold">{((area.confidence_threshold || 0.7) * 100).toFixed(0)}%</p>
                        </div>
                      </div>

                      {/* Keywords */}
                      {area.keywords && area.keywords.length > 0 && (
                        <div className="mt-4">
                          <p className="text-xs text-muted-foreground mb-2">Keywords</p>
                          <div className="flex flex-wrap gap-1">
                            {area.keywords.slice(0, 4).map((keyword, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {area.keywords.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{area.keywords.length - 4} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* IPC Classes */}
                      {area.ipc_classes && area.ipc_classes.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs text-muted-foreground mb-1">IPC Classes</p>
                          <p className="text-xs font-mono">
                            {area.ipc_classes.slice(0, 3).join(', ')}
                            {area.ipc_classes.length > 3 && ` +${area.ipc_classes.length - 3}`}
                          </p>
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
