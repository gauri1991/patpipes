'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package2, Plus, Search, RefreshCw, BarChart2, Layers,
  Sparkles, ArrowRight, Clock, CheckCircle2, AlertCircle,
  Loader2, TrendingUp, FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { analyticsApi, type AnalyticsProject } from '@/services/analyticsApi';

const STATUS_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft:             { label: 'Draft',       color: 'bg-neutral-100 text-neutral-600', icon: <FileText className="w-3 h-3" /> },
  active:            { label: 'Active',      color: 'bg-blue-100 text-blue-700',       icon: <TrendingUp className="w-3 h-3" /> },
  scope_definition:  { label: 'Scoping',     color: 'bg-purple-100 text-purple-700',   icon: <Clock className="w-3 h-3" /> },
  data_collection:   { label: 'Collecting',  color: 'bg-yellow-100 text-yellow-700',   icon: <Clock className="w-3 h-3" /> },
  patent_analysis:   { label: 'Analysing',   color: 'bg-cyan-100 text-cyan-700',       icon: <Sparkles className="w-3 h-3" /> },
  visualization:     { label: 'Visualizing', color: 'bg-indigo-100 text-indigo-700',   icon: <BarChart2 className="w-3 h-3" /> },
  report_generation: { label: 'Reporting',   color: 'bg-orange-100 text-orange-700',   icon: <FileText className="w-3 h-3" /> },
  completed:         { label: 'Completed',   color: 'bg-green-100 text-green-700',     icon: <CheckCircle2 className="w-3 h-3" /> },
  on_hold:           { label: 'On Hold',     color: 'bg-amber-100 text-amber-700',     icon: <AlertCircle className="w-3 h-3" /> },
  cancelled:         { label: 'Cancelled',   color: 'bg-red-100 text-red-600',         icon: <AlertCircle className="w-3 h-3" /> },
  archived:          { label: 'Archived',    color: 'bg-neutral-100 text-neutral-400', icon: <FileText className="w-3 h-3" /> },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: 'bg-neutral-100 text-neutral-600', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
      {meta.icon}
      {meta.label}
    </span>
  );
}

export default function SalesPackageDashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<AnalyticsProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    const res = await analyticsApi.getProjects(100, 0);
    if (res.success && res.data) setProjects(Array.isArray(res.data) ? res.data : (res.data as any).results ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  const createProject = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const res = await analyticsApi.createProject({ name: newName.trim(), description: newDesc.trim(), status: 'draft', priority: 'medium' });
    if (res.success && res.data) {
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      router.push(`/dashboard/sales-package/projects/${res.data.id}`);
    }
    setCreating(false);
  };

  const filtered = projects.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPatents = projects.reduce((s, p) => s + (p.portfolio_patent_count ?? 0), 0);
  const activeCount  = projects.filter(p => ['active', 'patent_analysis', 'data_collection'].includes(p.status)).length;

  return (
    <div className="flex flex-col h-full min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-neutral-900 rounded-lg">
              <Package2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">Sales Package</h1>
              <p className="text-sm text-neutral-500">Bundle and package patents for sale or licensing</p>
            </div>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2 bg-neutral-900 text-white hover:bg-neutral-800">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>
      </div>

      <div className="flex-1 px-6 py-6 flex flex-col gap-6">
        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Projects',  value: projects.length,  icon: <Package2 className="w-4 h-4" /> },
            { label: 'Active',          value: activeCount,       icon: <TrendingUp className="w-4 h-4" /> },
            { label: 'Patents Covered', value: totalPatents.toLocaleString(), icon: <Layers className="w-4 h-4" /> },
            { label: 'Completed',       value: projects.filter(p => p.status === 'completed').length, icon: <CheckCircle2 className="w-4 h-4" /> },
          ].map(s => (
            <Card key={s.label} className="border border-neutral-200">
              <CardContent className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-neutral-500">{s.label}</span>
                  <span className="text-neutral-400">{s.icon}</span>
                </div>
                <p className="text-2xl font-bold text-neutral-900">{loading ? '—' : s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search + refresh */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchProjects} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Project grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-2 text-neutral-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading projects…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center">
              <Package2 className="w-8 h-8 text-neutral-400" />
            </div>
            <div className="text-center">
              <p className="text-neutral-700 font-medium">
                {search ? 'No projects match your search' : 'No projects yet'}
              </p>
              <p className="text-neutral-400 text-sm mt-1">
                {search ? 'Try a different keyword' : 'Create a project to start bundling patents for sale or licensing'}
              </p>
            </div>
            {!search && (
              <Button onClick={() => setShowCreate(true)} className="gap-2 mt-2">
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map(project => (
              <Card
                key={project.id}
                className="border border-neutral-200 bg-white hover:border-neutral-400 hover:shadow-sm transition-all cursor-pointer group"
                onClick={() => router.push(`/dashboard/sales-package/projects/${project.id}`)}
              >
                <CardHeader className="px-4 py-3 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold text-neutral-900 leading-snug group-hover:text-neutral-700 line-clamp-2">
                      {project.name}
                    </CardTitle>
                    <StatusBadge status={project.status} />
                  </div>
                  {project.description && (
                    <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{project.description}</p>
                  )}
                </CardHeader>
                <CardContent className="px-4 pb-4 pt-0">
                  <div className="flex items-center gap-4 text-xs text-neutral-500 mb-3">
                    {project.portfolio_name && (
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3" />
                        {project.portfolio_name}
                      </span>
                    )}
                    {(project.portfolio_patent_count ?? 0) > 0 && (
                      <span>{project.portfolio_patent_count?.toLocaleString()} patents</span>
                    )}
                    {project.datasets?.length > 0 && (
                      <span>{project.datasets.length} dataset{project.datasets.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400">
                      {new Date(project.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-xs text-neutral-400 flex items-center gap-1 group-hover:text-neutral-700 transition-colors">
                      Open <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* New Project Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Sales Package Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Project Name</Label>
              <Input
                placeholder="e.g. Q3 Licensing Campaign"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createProject()}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-neutral-400 font-normal">(optional)</span></Label>
              <Textarea
                placeholder="Briefly describe the goal of this package…"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>Cancel</Button>
            <Button onClick={createProject} disabled={!newName.trim() || creating} className="gap-2">
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              Create & Open
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
