'use client';

import { useState, useEffect } from 'react';
import { useBrainstorming } from '@/hooks/useBrainstorming';
import {
  Lightbulb,
  Plus,
  Save,
  Trash2,
  Edit2,
  Tag,
  Calendar,
  Clock,
  Mic,
  Image,
  FileText,
  Sparkles,
  Archive,
  Pin
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface IdeationTabProps {
  projectId: string;
  sessionId: string | null;
}

export function IdeationTab({ projectId, sessionId }: IdeationTabProps) {
  const {
    ideas,
    createIdea,
    voteOnIdea,
    pinIdea,
    loading,
    error
  } = useBrainstorming(projectId);
  const [currentIdea, setCurrentIdea] = useState<{
    title: string;
    description: string;
    idea_type: string;
    tags: string[];
    priority: string;
  }>({
    title: '',
    description: '',
    idea_type: 'concept',
    tags: [],
    priority: 'medium'
  });
  const [tagInput, setTagInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'archived' | 'pinned'>('all');

  const handleSaveIdea = async () => {
    if (!currentIdea.title?.trim() || !sessionId) return;

    const ideaData = {
      title: currentIdea.title,
      description: currentIdea.description || '',
      idea_type: currentIdea.idea_type,
      tags: currentIdea.tags,
      priority: currentIdea.priority
    };

    const result = await createIdea(ideaData);
    if (result) {
      resetForm();
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !currentIdea.tags.includes(tagInput.trim())) {
      setCurrentIdea({
        ...currentIdea,
        tags: [...currentIdea.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setCurrentIdea({
      ...currentIdea,
      tags: currentIdea.tags.filter(t => t !== tag)
    });
  };

  const handleTogglePin = async (id: string) => {
    await pinIdea(id);
  };

  const handleVote = async (id: string, voteType: 'up' | 'down') => {
    await voteOnIdea(id, voteType);
  };

  const resetForm = () => {
    setCurrentIdea({
      title: '',
      description: '',
      idea_type: 'concept',
      tags: [],
      priority: 'medium'
    });
    setTagInput('');
    setEditingId(null);
  };

  const getFilteredIdeas = () => {
    switch (filter) {
      case 'active':
        return ideas.filter(i => i.status === 'active');
      case 'archived':
        return ideas.filter(i => i.status === 'archived');
      case 'pinned':
        return ideas.filter(i => i.is_pinned);
      default:
        return ideas;
    }
  };

  const filteredIdeas = getFilteredIdeas();
  const sortedIdeas = [...filteredIdeas].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'problem': return '🎯';
      case 'solution': return '💡';
      case 'feature': return '⚡';
      case 'question': return '❓';
      case 'hypothesis': return '🔬';
      case 'insight': return '💎';
      default: return '🧠';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  if (!sessionId) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Active Session</h3>
          <p className="text-muted-foreground">
            Please select or create a brainstorming session to capture ideas.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800 text-sm">Error loading ideas: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Capture Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Quick capture: Type your idea and press Enter..."
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  createIdea({
                    title: e.currentTarget.value,
                    description: '',
                    idea_type: 'concept',
                    tags: [],
                    priority: 'medium'
                  });
                  e.currentTarget.value = '';
                }
              }}
            />
            <Button size="icon" variant="outline" title="Voice input">
              <Mic className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" title="Add image">
              <Image className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="outline" title="Add document">
              <FileText className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({ideas?.length || 0})
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Active ({ideas?.filter(i => i.status === 'active').length || 0})
          </Button>
          <Button
            variant={filter === 'pinned' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pinned')}
          >
            <Pin className="h-3 w-3 mr-1" />
            Pinned ({ideas?.filter(i => i.is_pinned).length || 0})
          </Button>
          <Button
            variant={filter === 'archived' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('archived')}
          >
            Archived ({ideas?.filter(i => i.status === 'archived').length || 0})
          </Button>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setEditingId('new');
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Idea
        </Button>
      </div>

      {/* Idea Form */}
      {editingId === 'new' && (
        <Card>
          <CardHeader>
            <CardTitle>Capture New Idea</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={currentIdea.title}
                  onChange={(e) => setCurrentIdea({ ...currentIdea, title: e.target.value })}
                  placeholder="Brief title for your idea"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={currentIdea.idea_type}
                    onValueChange={(value: any) => setCurrentIdea({ ...currentIdea, idea_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concept">Concept</SelectItem>
                      <SelectItem value="problem">Problem</SelectItem>
                      <SelectItem value="solution">Solution</SelectItem>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="question">Question</SelectItem>
                      <SelectItem value="hypothesis">Hypothesis</SelectItem>
                      <SelectItem value="insight">Insight</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={currentIdea.priority}
                    onValueChange={(value: any) => setCurrentIdea({ ...currentIdea, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={currentIdea.description}
                onChange={(e) => setCurrentIdea({ ...currentIdea, description: e.target.value })}
                placeholder="Detailed description of your idea..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tags..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag}>Add Tag</Button>
              </div>
              {currentIdea.tags && currentIdea.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentIdea.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                      <button
                        className="ml-1 text-xs"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSaveIdea}>
                <Save className="h-4 w-4 mr-2" />
                Save Idea
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedIdeas.map((idea) => (
          <Card 
            key={idea.id} 
            className={`relative ${idea.status === 'archived' ? 'opacity-60' : ''} ${idea.is_pinned ? 'ring-2 ring-blue-500' : ''}`}
          >
            {idea.is_pinned && (
              <div className="absolute -top-2 -right-2 z-10">
                <Pin className="h-5 w-5 text-blue-500 fill-blue-500" />
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getTypeIcon(idea.idea_type)}</span>
                  <div>
                    <h3 className="font-semibold">{idea.title}</h3>
                    <Badge 
                      variant="outline" 
                      className={`text-xs mt-1 ${getPriorityColor(idea.priority)}`}
                    >
                      {idea.priority}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleTogglePin(idea.id)}
                    disabled={loading}
                  >
                    <Pin className={`h-3 w-3 ${idea.is_pinned ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleVote(idea.id, 'up')}
                    disabled={loading}
                    title={`${idea.votes_up} upvotes`}
                  >
                    👍 {idea.votes_up}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleVote(idea.id, 'down')}
                    disabled={loading}
                    title={`${idea.votes_down} downvotes`}
                  >
                    👎 {idea.votes_down}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {idea.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {idea.description}
                </p>
              )}
              {idea.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {idea.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(idea.created_at).toLocaleDateString()}
                </span>
                <Badge variant="outline" className="text-xs">
                  {idea.idea_type}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {sortedIdeas.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Capture Your Ideas</h3>
            <p className="text-muted-foreground mb-4">
              Start by typing in the quick capture bar above or click "New Idea"
            </p>
            <Button onClick={() => setEditingId('new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Idea
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}