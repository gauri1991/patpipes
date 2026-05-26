'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Save,
  Trash2,
  Clock,
  History,
  AlertCircle,
  CheckCircle,
  Loader2,
  Pencil,
  X,
} from 'lucide-react';
import { ApiClient } from '@/services/apiClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PromptTemplate {
  id: string;
  section: string;
  section_label: string;
  category: string;
  category_label: string;
  version: number;
  prompt_text: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface ReferenceItem {
  value: string;
  label: string;
}

const ADMIN_BASE = '/analytics/api/admin/data-configuration';

// ---------------------------------------------------------------------------
// PromptManagementPanel
// ---------------------------------------------------------------------------

export function PromptManagementPanel() {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [sections, setSections] = useState<ReferenceItem[]>([]);
  const [categories, setCategories] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [filterSection, setFilterSection] = useState<string>('__all__');
  const [filterCategory, setFilterCategory] = useState<string>('__all__');

  // Create form
  const [showCreate, setShowCreate] = useState(false);

  // History panel
  const [historySection, setHistorySection] = useState<string | null>(null);
  const [historyCategory, setHistoryCategory] = useState<string | null>(null);
  const [historyVersions, setHistoryVersions] = useState<PromptTemplate[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [tplRes, secRes, catRes] = await Promise.all([
        ApiClient.get<PromptTemplate[]>(`${ADMIN_BASE}/prompts/`),
        ApiClient.get<ReferenceItem[]>(`${ADMIN_BASE}/prompts/sections/`),
        ApiClient.get<ReferenceItem[]>(`${ADMIN_BASE}/prompts/categories/`),
      ]);

      if (tplRes.success && tplRes.data) setTemplates(tplRes.data);
      if (secRes.success && secRes.data) setSections(secRes.data);
      if (catRes.success && catRes.data) setCategories(catRes.data);
    } catch {
      setError('Failed to load prompt templates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filtered = templates.filter((t) => {
    if (filterSection !== '__all__' && t.section !== filterSection) return false;
    if (filterCategory !== '__all__' && t.category !== filterCategory) return false;
    return true;
  });

  const showHistory = async (section: string, category: string) => {
    setHistorySection(section);
    setHistoryCategory(category);
    setHistoryLoading(true);
    try {
      const res = await ApiClient.get<PromptTemplate[]>(
        `${ADMIN_BASE}/prompts/history/?section=${section}&category=${category}`,
      );
      if (res.success && res.data) setHistoryVersions(res.data);
    } catch {
      setHistoryVersions([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistory = () => {
    setHistorySection(null);
    setHistoryCategory(null);
    setHistoryVersions([]);
  };

  const deleteTemplate = async (id: string) => {
    try {
      await ApiClient.delete(`${ADMIN_BASE}/prompts/${id}/`);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError('Failed to delete template.');
    }
  };

  const toggleActive = async (template: PromptTemplate) => {
    try {
      const res = await ApiClient.put<PromptTemplate>(
        `${ADMIN_BASE}/prompts/${template.id}/`,
        { is_active: !template.is_active },
      );
      if (res.success) {
        fetchAll();
      }
    } catch {
      setError('Failed to update template.');
    }
  };

  const editTemplate = async (id: string, data: { prompt_text: string; description: string }) => {
    try {
      const res = await ApiClient.put<PromptTemplate>(`${ADMIN_BASE}/prompts/${id}/`, data);
      if (res.success && res.data) {
        setTemplates((prev) => prev.map((t) => (t.id === id ? res.data! : t)));
      } else {
        setError(res.error || 'Failed to save template.');
      }
    } catch {
      setError('Failed to save template.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading prompts...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setError('')}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Filters + Add */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterSection} onValueChange={setFilterSection}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All sections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All sections</SelectItem>
            {sections.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="h-4 w-4 mr-1" />
            New Template
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <CreatePromptForm
          sections={sections}
          categories={categories}
          onCreated={() => {
            setShowCreate(false);
            fetchAll();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {/* History Panel */}
      {historySection && historyCategory && (
        <HistoryPanel
          section={historySection}
          category={historyCategory}
          versions={historyVersions}
          loading={historyLoading}
          onClose={closeHistory}
        />
      )}

      {/* Template List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No prompt templates found. Create one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((tpl) => (
            <PromptCard
              key={tpl.id}
              template={tpl}
              onShowHistory={() => showHistory(tpl.section, tpl.category)}
              onToggleActive={() => toggleActive(tpl)}
              onDelete={() => deleteTemplate(tpl.id)}
              onEdit={(data) => editTemplate(tpl.id, data)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PromptCard
// ---------------------------------------------------------------------------

function PromptCard({
  template,
  onShowHistory,
  onToggleActive,
  onDelete,
  onEdit,
}: {
  template: PromptTemplate;
  onShowHistory: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onEdit: (data: { prompt_text: string; description: string }) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(template.prompt_text);
  const [editDesc, setEditDesc] = useState(template.description);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleEditOpen = () => {
    setEditText(template.prompt_text);
    setEditDesc(template.description);
    setEditing(true);
  };

  const handleEditCancel = () => {
    setEditing(false);
  };

  const handleEditSave = async () => {
    setSaving(true);
    await onEdit({ prompt_text: editText, description: editDesc });
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        className="flex items-center gap-2 w-full px-4 py-3 text-left text-sm hover:bg-muted/50 transition-colors"
        onClick={() => { setExpanded(!expanded); if (editing) setEditing(false); }}
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0" />
        )}
        <span className="font-semibold flex-1">{template.section_label}</span>
        <Badge variant="outline" className="text-[10px]">
          {template.category_label}
        </Badge>
        <Badge variant="secondary" className="text-[10px]">
          v{template.version}
        </Badge>
        {template.is_active ? (
          <Badge className="text-[10px] bg-green-600">Active</Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px]">Inactive</Badge>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t pt-3 space-y-3">
          {/* Description */}
          {!editing && template.description && (
            <p className="text-xs text-muted-foreground">{template.description}</p>
          )}

          {/* View mode */}
          {!editing && (
            <pre className="text-xs bg-muted/50 rounded p-3 overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto font-mono">
              {template.prompt_text}
            </pre>
          )}

          {/* Edit mode */}
          {editing && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium block mb-1">Description</label>
                <Input
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Brief description of this prompt template..."
                  className="text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">
                  Prompt Text
                  <span className="ml-1 font-normal text-muted-foreground">
                    (use {'{placeholder}'} syntax for template variables)
                  </span>
                </label>
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={16}
                  className="font-mono text-xs resize-y"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleEditSave} disabled={saving || !editText.trim()}>
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Save Changes
                </Button>
                <Button variant="ghost" size="sm" onClick={handleEditCancel} disabled={saving}>
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Metadata row */}
          {!editing && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Updated: {new Date(template.updated_at).toLocaleString()}
              {template.created_by && <span>by {template.created_by}</span>}
            </div>
          )}

          {/* Action buttons */}
          {!editing && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleEditOpen}>
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={onShowHistory}>
                <History className="h-3 w-3 mr-1" />
                History
              </Button>
              <Button variant="outline" size="sm" onClick={onToggleActive}>
                {template.is_active ? 'Deactivate' : 'Activate'}
              </Button>
              {!confirmDelete ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              ) : (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => { onDelete(); setConfirmDelete(false); }}
                  >
                    Confirm Delete
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CreatePromptForm
// ---------------------------------------------------------------------------

function CreatePromptForm({
  sections,
  categories,
  onCreated,
  onCancel,
}: {
  sections: ReferenceItem[];
  categories: ReferenceItem[];
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [section, setSection] = useState('');
  const [category, setCategory] = useState('general');
  const [promptText, setPromptText] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!section || !promptText.trim()) {
      setError('Section and prompt text are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await ApiClient.post<PromptTemplate>(`${ADMIN_BASE}/prompts/`, {
        section,
        category,
        prompt_text: promptText,
        description,
      });
      if (res.success) {
        onCreated();
      } else {
        setError(res.error || 'Failed to create template.');
      }
    } catch {
      setError('Failed to create template.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Create New Prompt Template</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium block mb-1">Section</label>
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger>
                <SelectValue placeholder="Select section..." />
              </SelectTrigger>
              <SelectContent>
                {sections.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Description (optional)</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this prompt template..."
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">
            Prompt Text
            <span className="text-muted-foreground ml-1 font-normal">
              (Use placeholders like {'{abstract}'}, {'{claims_text}'}, {'{independent_claims}'}, {'{description}'})
            </span>
          </label>
          <Textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Enter the prompt template..."
            rows={10}
            className="font-mono text-xs"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreate} disabled={saving} size="sm">
            {saving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Create Template
          </Button>
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// HistoryPanel
// ---------------------------------------------------------------------------

function HistoryPanel({
  section,
  category,
  versions,
  loading,
  onClose,
}: {
  section: string;
  category: string;
  versions: PromptTemplate[];
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm">
          Version History — {section} / {category}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Close
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading history...
          </div>
        ) : versions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No version history found.</p>
        ) : (
          <div className="space-y-2">
            {versions.map((v) => (
              <div key={v.id} className="border rounded p-3 text-xs space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">v{v.version}</Badge>
                  {v.is_active ? (
                    <Badge className="text-[10px] bg-green-600">
                      <CheckCircle className="h-3 w-3 mr-0.5" /> Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">Inactive</Badge>
                  )}
                  <span className="text-muted-foreground ml-auto">
                    {new Date(v.created_at).toLocaleString()}
                  </span>
                </div>
                {v.description && (
                  <p className="text-muted-foreground">{v.description}</p>
                )}
                <pre className="bg-muted/50 rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto text-[11px]">
                  {v.prompt_text}
                </pre>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PromptManagementPanel;
